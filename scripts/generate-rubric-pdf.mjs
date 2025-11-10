#!/usr/bin/env node
// Generate a rubric PDF from a JSON file using pdf-lib.
// Usage: node scripts/generate-rubric-pdf.mjs <input.json> <output.pdf>

import fs from 'node:fs';
import path from 'node:path';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

function loadJson(file) {
  const raw = fs.readFileSync(file, 'utf8');
  return JSON.parse(raw);
}

function ensureDir(filePath) {
  const dir = path.dirname(filePath);
  fs.mkdirSync(dir, { recursive: true });
}

function wrapText(text, maxLen = 90) {
  const words = text.split(/\s+/);
  const lines = [];
  let line = '';
  for (const w of words) {
    if ((line + ' ' + w).trim().length > maxLen) {
      lines.push(line.trim());
      line = w;
    } else {
      line += ' ' + w;
    }
  }
  if (line.trim()) lines.push(line.trim());
  return lines;
}

async function buildPdf(data) {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595.28, 841.89]); // A4 portrait
  const { width, height } = page.getSize();
  const margin = 50;
  let y = height - margin;

  const fontTitle = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontBody = await pdfDoc.embedFont(StandardFonts.Helvetica);

  function drawText(text, x, font, size, color = rgb(0, 0, 0)) {
    page.drawText(text, { x, y, size, font, color });
    y -= size + 6;
  }

  // Title
  drawText(data.title || 'Rubric', margin, fontTitle, 18);
  if (data.assignmentId) {
    drawText(`Assignment: ${data.assignmentId}`, margin, fontBody, 11, rgb(0.4, 0.45, 0.5));
  }
  y -= 6;

  for (const crit of data.criteria) {
    if (y < margin + 120) {
      // new page if space is tight
      y = height - margin;
    }
    drawText(crit.name, margin, fontTitle, 12);
    // Levels row
    const colGap = 12;
    const colWidth = (width - margin * 2 - colGap * (crit.levels.length - 1)) / crit.levels.length;
    let x = margin;
    const headerY = y;
    for (const lvl of crit.levels) {
      page.drawText(`${lvl.label} (${lvl.points})`, { x, y: headerY, size: 11, font: fontBody });
      x += colWidth + colGap;
    }
    y -= 18;
    // Descriptions
    x = margin;
    const descTopY = y;
    let maxDescHeight = 0;
    for (const lvl of crit.levels) {
      const desc = (lvl.description || '').trim();
      const lines = desc ? wrapText(desc, 70) : [];
      let dy = descTopY;
      for (const line of lines) {
        page.drawText(line, { x, y: dy, size: 10, font: fontBody, color: rgb(0.23, 0.28, 0.33) });
        dy -= 14;
      }
      const usedHeight = desc ? descTopY - dy + 6 : 0;
      if (usedHeight > maxDescHeight) maxDescHeight = usedHeight;
      x += colWidth + colGap;
    }
    y -= Math.max(maxDescHeight, 14) + 8;
  }

  if (typeof data.totalPoints === 'number') {
    y -= 6;
    drawText(`Total Points: ${data.totalPoints}`, margin, fontTitle, 12);
  }

  return pdfDoc;
}

async function main() {
  const [input, output] = process.argv.slice(2);
  if (!input || !output) {
    console.error('Usage: node scripts/generate-rubric-pdf.mjs <input.json> <output.pdf>');
    process.exit(1);
  }
  const data = loadJson(input);
  const pdfDoc = await buildPdf(data);
  ensureDir(output);
  const bytes = await pdfDoc.save();
  fs.writeFileSync(output, bytes);
  console.log(`Rubric PDF written to ${output}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
