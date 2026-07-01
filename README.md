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
- HerohubOS logo asset in `public/herohub-os-logo.svg`
- IBM Plex Sans bundled through `@fontsource`; Scandia configured as the display-font family when available

## Setup

```bash
npm install
cp .env.example .env
npm run dev
```

For Netlify, add the following environment variable in **Site configuration > Environment variables**:

```bash
OPENAI_API_KEY=...
OPENAI_MODEL=gpt-4.1-nano
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

## Fonts and logo

The app uses IBM Plex Sans through the `@fontsource/ibm-plex-sans` package, so it will render consistently after `npm install`. Scandia is configured first in the display font stack in `src/styles.css`, but the actual Scandia font files are not included in this project. To use Scandia exactly, add your Adobe Fonts/Typekit CSS link to `index.html` or self-host your licensed Scandia webfont files and update the `--font-display` variable in `src/styles.css`.

The HerohubOS SVG logo lives at:

```bash
public/herohub-os-logo.svg
```

Replace that file if you want to swap the logo without changing the React components.

## Text overflow controls

The app now uses three layers of overflow protection:

1. The OpenAI function asks for compact copy and enforces JSON schema length limits.
2. `src/lib/reportContent.js` normalizes AI output and trims overly long fields before rendering.
3. `src/styles.css` uses fixed page boundaries, wrapping, line clamps, and hidden overflow on page panels so content stays within the 16:9 report pages.

## Customizing the report design

Most of the visual match lives in:

- `src/styles.css`
- `src/components/Report.jsx`

The report pages are fixed at `1600px x 900px` to match a 16:9 landscape PDF. The export function converts each `.report-page` into a 16:9 PDF page.

## AI connection test

After deploying to Netlify and adding environment variables, open this URL in a browser:

```bash
https://YOUR-SITE-NAME.netlify.app/.netlify/functions/analyze
```

Expected successful response:

```json
{"ok":true,"keyConfigured":true,"model":"gpt-4.1-mini","message":"OpenAI key and model access look good."}
```

If `keyConfigured` is false, the OpenAI key was not added to the Function environment or the site needs a fresh deploy. If the message mentions model access, set `OPENAI_MODEL` to `gpt-5.4` and redeploy.

For Netlify, use these exact variable names:

```bash
OPENAI_API_KEY
OPENAI_MODEL
```

Put the actual `sk-...` key in the variable value field, not the variable name field.


## v8 period-scope fix

The app now defaults to the last fully closed month and includes a standard TTM helper. For a report ending May 2026, use the button to set the report window to June 2025 – May 2026. The app also warns when the selected period is not exactly 12 months, because custom periods will not match the standard HerohubOS executive report outputs.

## v9 AI timeout safeguard

This version limits the transcript excerpt sent to the AI function and adds an AI timeout budget so Netlify returns the built-in fallback analysis instead of a Netlify Internal Error if OpenAI takes too long.

Optional Netlify environment variable:

```text
AI_TIMEOUT_MS=8500
```

Keep this below your Netlify function timeout. The default is 8000ms.


## v11 AI stability notes

Set Netlify environment variables to:

- `OPENAI_API_KEY`: your OpenAI API key
- `OPENAI_MODEL`: `gpt-4.1-mini`
- `AI_TIMEOUT_MS`: `2500`

v11 uses only one fast model attempt and sends a smaller transcript payload so Netlify does not return a platform-level 500 before the app can fall back gracefully.


## v20 OpenAI timeout note
Set `AI_TIMEOUT_MS=30000` in Netlify. v20 allows up to 45000ms, but 25000ms is the recommended starting point for synchronous Netlify Functions.


## v20 AI JSON fix

V18 increases the OpenAI output-token budget and adds clearer JSON parse diagnostics. Add `AI_MAX_OUTPUT_TOKENS=6000` in Netlify if AI output was being cut off mid-string.


## v20 layout and AI insight update

V18 updates the last two pages to match the older executive-report structure: Leadership Priorities now uses five large priority cards with an Executive Mandate rail, and Executive Talk Track now uses four department-meeting cards with Hits, Risks, and Questions plus a Final Executive Narrative rail. The AI schema now generates these sections directly.

Recommended Netlify variables:

```
OPENAI_MODEL=gpt-4.1-nano
AI_TIMEOUT_MS=30000
AI_MAX_OUTPUT_TOKENS=5000
```

V18 also tightens takeaway length, prevents duplicate right-rail summaries across the report, and removes CSS line clamps that were cutting text off in exported PDFs.


## v20 update

- Main report page headlines now explicitly use Scandia Medium (`font-weight: 500`) instead of the browser/default bold weight.
- This applies to the cover title, contents title, standard report page titles, and the executive talk track page title.


## v20 note
AI timeout default increased to 55 seconds and the AI schema was tightened to reduce aborted requests while preserving the final-page insight structure. Recommended Netlify variables: OPENAI_MODEL=gpt-4.1-nano, AI_TIMEOUT_MS=22000, AI_MAX_OUTPUT_TOKENS=6000.


## v23 Netlify 504 inactivity fix

If Netlify returns an `Inactivity Timeout` HTML page, the synchronous function waited too long before returning data. V22 keeps the AI request under the common proxy idle window and uses a faster default model.

Recommended Netlify variables:

```text
OPENAI_MODEL=gpt-4.1-nano
AI_TIMEOUT_MS=22000
AI_MAX_OUTPUT_TOKENS=6000
```

If the AI does not finish inside that budget, the app returns the deterministic fallback JSON instead of letting Netlify return a 504 HTML page.
