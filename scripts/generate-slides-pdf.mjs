#!/usr/bin/env node
// Generate a 16:9 slide deck PDF from JSON using pdf-lib.
// Usage: node scripts/generate-slides-pdf.mjs <input.json> <output.pdf>

import fs from 'node:fs';
import path from 'node:path';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

function ensureDir(filePath) {
  const dir = path.dirname(filePath);
  fs.mkdirSync(dir, { recursive: true });
}

function loadJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function parseHex(hex) {
  const m = /^#?([\da-f]{2})([\da-f]{2})([\da-f]{2})$/i.exec(hex || '');
  if (!m) return rgb(0.1, 0.1, 0.1);
  const r = parseInt(m[1], 16) / 255;
  const g = parseInt(m[2], 16) / 255;
  const b = parseInt(m[3], 16) / 255;
  return rgb(r, g, b);
}

function wrapLines(text, maxChars) {
  const words = (text || '').split(/\s+/);
  const lines = [];
  let line = '';
  for (const w of words) {
    if (!w) continue;
    const next = line ? line + ' ' + w : w;
    if (next.length > maxChars) {
      if (line) lines.push(line);
      line = w;
    } else {
      line = next;
    }
  }
  if (line) lines.push(line);
  return lines;
}

function sanitize(text) {
  if (!text) return '';
  return text
    .replace(/[\u2013\u2014]/g, '-') // en/em dash -> hyphen
    .replace(/[\u2018\u2019]/g, "'") // curly single quotes -> '
    .replace(/[\u201C\u201D]/g, '"') // curly double quotes -> "
    .replace(/[\u2192]/g, '->') // right arrow -> ->
    .replace(/[\u2022]/g, '*'); // bullet -> *
}

async function buildSlides(doc, data) {
  const width = 1280;
  const height = 720; // 16:9
  const margin = 60;
  const accent = parseHex(data.theme?.accent || '#0ea5e9');

  const fontTitle = await doc.embedFont(StandardFonts.HelveticaBold);
  const fontBody = await doc.embedFont(StandardFonts.Helvetica);

  function newPage() {
    const page = doc.addPage([width, height]);
    // top accent bar
    page.drawRectangle({ x: 0, y: height - 8, width, height: 8, color: accent });
    return page;
  }

  function drawTitleSlide(page, slide) {
    const title = sanitize(slide.title || data.title || 'Untitled');
    const subtitle = sanitize(slide.subtitle || '');
    page.drawText(title, { x: margin, y: height - 160, size: 48, font: fontTitle });
    if (subtitle) {
      page.drawText(subtitle, { x: margin, y: height - 210, size: 28, font: fontBody, color: rgb(0.25, 0.27, 0.3) });
    }
    // footer
    const footer = `${data.courseId || ''}  •  ${data.title || ''}`.trim();
    if (footer) page.drawText(footer, { x: margin, y: 24, size: 12, font: fontBody, color: rgb(0.4, 0.45, 0.5) });
  }

  function drawBulletsSlide(page, slide) {
    const title = sanitize(slide.title || '');
    if (title) page.drawText(title, { x: margin, y: height - 120, size: 36, font: fontTitle });
    let y = title ? height - 170 : height - 120;
  const items = (slide.items || []).map((t) => sanitize(t));
    for (const item of items) {
      const lines = wrapLines(item, 90);
      for (const line of lines) {
        if (y < 90) {
          page = newPage();
          y = height - 120;
        }
        page.drawText('- ' + line, { x: margin, y, size: 24, font: fontBody });
        y -= 34;
      }
      y -= 6;
    }
  }

  for (const [idx, slide] of (data.slides || []).entries()) {
    const page = newPage();
    const type = slide.type || (idx === 0 ? 'title' : 'bullets');
    if (type === 'title') drawTitleSlide(page, slide);
    else if (type === 'bullets') drawBulletsSlide(page, slide);
    else {
      // fallback to bullets
      drawBulletsSlide(page, slide);
    }
    // page number
    const number = String(idx + 1);
    page.drawText(number, { x: width - margin, y: 24, size: 12, font: fontBody, color: rgb(0.4, 0.45, 0.5) });
  }
}

async function main() {
  const [input, output] = process.argv.slice(2);
  if (!input || !output) {
    console.error('Usage: node scripts/generate-slides-pdf.mjs <input.json> <output.pdf>');
    process.exit(1);
  }
  const data = loadJson(input);
  const doc = await PDFDocument.create();
  await buildSlides(doc, data);
  const bytes = await doc.save();
  ensureDir(output);
  fs.writeFileSync(output, bytes);
  console.log(`Slides PDF written to ${output}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
