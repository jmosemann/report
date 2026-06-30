# HerohubOS Executive Report Builder for Netlify

This is a Netlify-ready React app that uploads dealer data and transcript files, analyzes a selected reporting period, generates AI-assisted executive insights, previews a HerohubOS-style landscape report, and exports it as a PDF.

## What it supports

- Data uploads: `.zip`, `.csv`, `.xlsx`, `.xls`
- Transcript uploads: `.docx`, `.txt`, `.md`
- Multiple files per upload field
- Report period selector: one month or a range of months
- Separate data window selector if you want the report narrative period to differ from the raw data window
- Lightspeed-style files such as `GEN01`, `ACT01`, `ACT02`, `RPT11`, `RPT12`, `SVC01`, and `PRT01`
- Client-side metrics and chart generation
- Server-side OpenAI analysis through a Netlify Function
- PDF export using the rendered report pages

## Setup

```bash
npm install
cp .env.example .env
npm run dev
```

For Netlify, add the following environment variable in **Site configuration > Environment variables**:

```bash
OPENAI_API_KEY=...
OPENAI_MODEL=gpt-5.5
```

If `OPENAI_API_KEY` is not set, the app still works, but the insight text falls back to rule-based language.

## Deploy

```bash
npm run build
netlify deploy --prod
```

## File expectations

The analytics engine is designed around the files in the sample upload:

- `GEN01`: dealer/store identity
- `ACT01`: chart of accounts and department mapping
- `ACT02`: accounting balances/monthly GL data
- `RPT11`: deal header data / finance penetration support
- `RPT12`: unit sales and OEM contribution support
- `SVC01`: repair order activity
- `PRT01`: parts invoices

The app also has generic fallbacks for files with recognizable date, amount, revenue, cost, department, and make columns, but the most accurate output comes from the Lightspeed-style exports above.

## Customizing the report design

Most of the visual match lives in:

- `src/styles.css`
- `src/components/Report.jsx`

The report pages are fixed at `1600px x 900px` to match a 16:9 landscape PDF. The export function converts each `.report-page` into a 16:9 PDF page.
