import Papa from 'papaparse';
import JSZip from 'jszip';
import * as XLSX from 'xlsx';
import mammoth from 'mammoth/mammoth.browser';

function normalizeKey(name = '') {
  return name.toLowerCase().replace(/[^a-z0-9]/g, '');
}

function classifyDataFile(name, rows) {
  const normalized = normalizeKey(name);
  const cols = rows?.[0] ? Object.keys(rows[0]).map(normalizeKey) : [];
  const colSet = new Set(cols);
  const has = (...needles) => needles.some((n) => normalized.includes(n));
  const hasCols = (...needles) => needles.every((n) => cols.some((c) => c.includes(normalizeKey(n))));
  const hasExactCols = (...needles) => needles.every((n) => colSet.has(normalizeKey(n)));

  // File-name hints are the most reliable. Check them before broad column fallbacks.
  if (has('act01')) return 'ACT01';
  if (has('act02')) return 'ACT02';
  if (has('rpt11')) return 'RPT11';
  if (has('rpt12')) return 'RPT12';
  if (has('svc01')) return 'SVC01';
  if (has('prt01')) return 'PRT01';
  if (has('gen01')) return 'GEN01';

  if (hasCols('account_name', 'department_name', 'debit_credit')) return 'ACT01';
  if (hasCols('fiscal_year', 'M1', 'M12', 'statement')) return 'ACT02';
  if (hasCols('DealNumber', 'Lienholder', 'DealDate')) return 'RPT11';
  if (hasCols('VIN', 'NewUsed', 'UnitPrice', 'UnitCost')) return 'RPT12';
  if (hasCols('date_cashiered', 'price_labor', 'cost_labor') || hasCols('date_closed', 'price_labor', 'cost_labor')) return 'SVC01';
  if (hasCols('date_invoice', 'price_total', 'margin_total')) return 'PRT01';
  // GEN01 is only three fields in this export; avoid matching customer_name/supplier_code in other files.
  if (hasExactCols('store_id', 'code', 'name') && cols.length <= 5) return 'GEN01';
  return 'GENERIC';
}

function parseCsvText(text, name) {
  const parsed = Papa.parse(text, {
    header: true,
    skipEmptyLines: true,
    dynamicTyping: false,
    transformHeader: (h) => String(h || '').trim()
  });
  if (parsed.errors?.length) {
    const serious = parsed.errors.find((e) => e.type !== 'Delimiter');
    if (serious) console.warn(`CSV parse issue in ${name}`, serious);
  }
  return parsed.data.filter((row) => Object.values(row).some((v) => String(v ?? '').trim() !== ''));
}

async function parseDataFile(file) {
  const name = file.name || 'upload';
  const lower = name.toLowerCase();

  if (lower.endsWith('.zip')) {
    const zip = await JSZip.loadAsync(await file.arrayBuffer());
    const results = [];
    const entries = Object.values(zip.files).filter((entry) => !entry.dir);
    for (const entry of entries) {
      const entryName = entry.name;
      const entryLower = entryName.toLowerCase();
      if (entryLower.endsWith('.csv')) {
        const text = await entry.async('text');
        const rows = parseCsvText(text, entryName);
        results.push({ name: entryName, type: classifyDataFile(entryName, rows), rows });
      } else if (entryLower.endsWith('.xlsx') || entryLower.endsWith('.xls')) {
        const buffer = await entry.async('arraybuffer');
        results.push(...parseWorkbook(buffer, entryName));
      }
    }
    return results;
  }

  if (lower.endsWith('.csv')) {
    const text = await file.text();
    const rows = parseCsvText(text, name);
    return [{ name, type: classifyDataFile(name, rows), rows }];
  }

  if (lower.endsWith('.xlsx') || lower.endsWith('.xls')) {
    return parseWorkbook(await file.arrayBuffer(), name);
  }

  return [];
}

function parseWorkbook(buffer, name) {
  const wb = XLSX.read(buffer, { type: 'array' });
  return wb.SheetNames.map((sheetName) => {
    const rows = XLSX.utils.sheet_to_json(wb.Sheets[sheetName], { defval: '' });
    const fileName = `${name} :: ${sheetName}`;
    return { name: fileName, type: classifyDataFile(fileName, rows), rows };
  }).filter((f) => f.rows.length);
}

async function parseTranscript(file) {
  const name = file.name || 'transcript';
  const lower = name.toLowerCase();
  if (lower.endsWith('.docx')) {
    const result = await mammoth.extractRawText({ arrayBuffer: await file.arrayBuffer() });
    return { name, text: result.value || '' };
  }
  if (lower.endsWith('.txt') || lower.endsWith('.md') || lower.endsWith('.csv')) {
    return { name, text: await file.text() };
  }
  return { name, text: '' };
}

export async function ingestFiles({ dataFiles = [], transcriptFiles = [] }) {
  const data = [];
  for (const file of dataFiles) {
    const parsed = await parseDataFile(file);
    data.push(...parsed);
  }

  const transcripts = [];
  for (const file of transcriptFiles) {
    transcripts.push(await parseTranscript(file));
  }

  const byType = data.reduce((acc, file) => {
    acc[file.type] ||= [];
    acc[file.type].push(file);
    return acc;
  }, {});

  return {
    dataFiles: data,
    byType,
    transcripts,
    transcriptText: transcripts.map((t) => `--- ${t.name} ---\n${t.text}`).join('\n\n').trim()
  };
}
