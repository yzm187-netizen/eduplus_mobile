# Assignment Description Authoring (Teacher)

This guide explains how to write assignment descriptions that render like a clean document within the mobile app. Use a simple Markdown‑like format (plain text with a few conventions). No special tooling required—just type your text.

## What’s supported

- Headings
  - `# Heading 1`
  - `## Heading 2`
  - `### Heading 3`
- Subtitle
  - An UPPERCASE short line (e.g., `CASE STUDY`) becomes an italic subtitle.
- Section labels (bold lead‑ins)
  - Any line ending with a colon becomes a bold label (e.g., `Your report should include:`).
  - Inside sentences, a leading label like `Recommendation:` is auto‑bolded.
- Bulleted lists
  - Lines starting with `- `.
- Numbered lists
  - Lines starting with `1. `, `2. `, etc.
- Inline emphasis
  - Bold: `**important**`
  - Italic: `*emphasis*`
- Horizontal rule
  - A line with `---` (or `___`) draws a subtle divider.

All of the above are rendered on a darker panel, with document‑like indentation and hierarchy. Collapsed view shows a three‑line preview with an ellipsis; expanded view shows the full formatting.

## Examples

### Example A (like the screenshot)

```
# Description of Assignment

CASE STUDY

You are part of a data analytics consultancy firm hired by an **e‑commerce company of your choice** (...). The company has been struggling with visualizing sales trends, delivery performance, and customer satisfaction metrics.

The company has approached your team to:
- Recommend SAS as the data visualization software to address their needs.
- Justify why SAS is the most appropriate choice for the company’s requirements.
- Highlight both the advantages and limitations of using SAS in their operations.

---

Your report should include:

1. Recommendation: Present **SAS** as the data visualization software and explain why it is suitable for your chosen company’s needs.
2. Justification: Provide clear reasons for selecting SAS, supported by examples or references.
3. Advantages & Disadvantages: Discuss at least **three advantages** and **three disadvantages** of using SAS.
4. References: Include credible sources using proper citation format.
```

### Example B (short)

```
## Project Brief

- Define scope and success metrics
- Identify stakeholders
- Draft timeline and risks
```

## Tips

- Keep headings and labels short and clear.
- Use `- ` for bullets and `1. ` for numbered items; keep one item per line.
- For emphasis inside sentences, prefer `**bold**` for key phrases.
- You can paste from a doc editor as plain text and add the minimal markers above.

## Storage & Compatibility

- The description is stored as a single text field (UTF‑8). The app parses and formats it at render time.
- This format is intentionally lightweight; if we need more power later (links, nested lists, tables), we can switch to full Markdown or a rich‑text JSON schema with a small migration.

## Roadmap (optional)

- Nested list support via indentation (e.g., two spaces before `- `)
- Links and block quotes
- Authoring UI with buttons (bold/italic/list) and live preview
