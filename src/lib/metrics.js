import {
  asMonthKey,
  monthRange,
  monthLabel,
  monthLabelLong,
  inMonthWindow,
  parseNumber,
  safeDivide,
  cleanName
} from './format.js';

function firstRows(byType, type) {
  return (byType[type] || []).flatMap((f) => f.rows || []);
}

function fullAccount(row) {
  const account = String(row.account ?? row.Account ?? '').trim().replace(/\.0$/, '');
  const dept = String(row.dept_id ?? row.department_code ?? '').trim().replace(/\.0$/, '');
  if (account.includes('-')) return account;
  return dept ? `${account}-${dept}` : account;
}

function buildAccountMap(act01Rows) {
  const map = new Map();
  for (const row of act01Rows) {
    const acct = String(row.account ?? row.Account ?? '').trim();
    if (acct) map.set(acct, row);
    const accountCode = String(row.account_code ?? row.AccountCode ?? '').trim().replace(/\.0$/, '');
    const dept = String(row.department_code ?? row.DepartmentCode ?? '').trim().replace(/\.0$/, '');
    if (accountCode && dept) map.set(`${accountCode}-${dept}`, row);
    if (accountCode && !map.has(accountCode)) map.set(accountCode, row);
  }
  return map;
}

function buildAccountingRows(act01Rows, act02Rows, startKey, endKey) {
  const accountMap = buildAccountMap(act01Rows);
  const rows = [];
  for (const row of act02Rows) {
    const fiscalYear = Number(row.fiscal_year ?? row.FiscalYear ?? row.year ?? row.Year);
    if (!fiscalYear) continue;
    const key = fullAccount(row);
    const account = accountMap.get(key) || accountMap.get(String(row.account ?? '').trim()) || {};

    for (let i = 1; i <= 12; i += 1) {
      const monthKey = `${fiscalYear}-${String(i).padStart(2, '0')}`;
      if (!inMonthWindow(monthKey, startKey, endKey)) continue;
      const amount = parseNumber(row[`M${i}`]);
      rows.push({
        monthKey,
        account: key,
        accountName: account.account_name || row.account_name || key,
        department: account.department_name || row.department_name || 'Unmapped',
        departmentCode: account.department_code || row.dept_id || '',
        statement: account.statement || row.statement || '',
        type: account.type || row.type || '',
        debitCredit: account.debit_credit || '',
        amount
      });
    }
  }
  return rows;
}

function sum(rows, predicate = () => true) {
  return rows.reduce((total, row) => (predicate(row) ? total + Number(row.amount || 0) : total), 0);
}

function groupBy(rows, keyGetter) {
  const map = new Map();
  for (const row of rows) {
    const key = keyGetter(row);
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(row);
  }
  return map;
}

function normalizeMake(make) {
  const m = String(make || 'Unassigned').trim();
  if (!m) return 'Unassigned';
  const lower = m.toLowerCase();
  if (lower.includes('cub')) return 'Cub Cadet';
  if (lower.includes('mahindra')) return 'Mahindra';
  if (lower.includes('polaris')) return 'Polaris';
  if (lower.includes('kawasaki')) return 'Kawasaki';
  if (lower.includes('stihl') || lower.includes('steel')) return 'Stihl';
  if (lower.includes('kayo')) return 'Kayo';
  if (lower.includes('case')) return 'Case IH';
  return m.replace(/\s+/g, ' ');
}

function dateFromRow(row, fields) {
  for (const field of fields) {
    const key = Object.keys(row).find((k) => k.toLowerCase() === field.toLowerCase());
    if (key) {
      const monthKey = asMonthKey(row[key]);
      if (monthKey) return monthKey;
    }
  }
  return null;
}

function filterRowsByMonth(rows, fields, startKey, endKey) {
  return rows.filter((row) => inMonthWindow(dateFromRow(row, fields), startKey, endKey));
}

function getStoreName(genRows, fallback = 'Dealer') {
  const row = genRows?.[0] || {};
  return row.name || row.Name || row.code || row.Code || fallback;
}

function buildUnitMetrics(rpt12Rows, rpt11Rows, startKey, endKey) {
  const units = filterRowsByMonth(rpt12Rows, ['Date', 'DealDate'], startKey, endKey);
  const deals = filterRowsByMonth(rpt11Rows, ['DealDate', 'Date'], startKey, endKey);
  const unitCount = units.length;
  const newUnits = units.filter((r) => String(r.NewUsed || r.new_used || '').toLowerCase().includes('new')).length;
  const usedUnits = units.filter((r) => String(r.NewUsed || r.new_used || '').toLowerCase().includes('used')).length;
  const unitRevenue = units.reduce((t, r) => t + parseNumber(r.UnitPrice || r.unit_price), 0);
  const unitCost = units.reduce((t, r) => t + parseNumber(r.UnitCost || r.unit_cost), 0);
  const holdback = units.reduce((t, r) => t + parseNumber(r.Holdback || r.holdback), 0);
  const rebate = units.reduce((t, r) => t + parseNumber(r.Rebate || r.rebate), 0);
  const doc = units.reduce((t, r) => t + parseNumber(r.DocPrice || r.doc_price), 0);
  const frontendGp = unitRevenue - unitCost + holdback + rebate + doc;

  const financedDeals = deals.filter((r) => {
    const lien = String(r.Lienholder || r.lienholder || '').trim().toLowerCase();
    const financeAmount = parseNumber(r.FinanceAmount || r.finance_amount);
    return financeAmount > 0 || (lien && !['none', 'cash', 'nan', 'n/a'].includes(lien));
  }).length;

  return {
    rows: units,
    deals,
    unitCount,
    newUnits,
    usedUnits,
    unitRevenue,
    unitCost,
    frontendGp,
    frontEndGpMargin: safeDivide(frontendGp, unitRevenue) * 100,
    financePenetration: safeDivide(financedDeals, Math.max(deals.length, unitCount)) * 100
  };
}

function buildServiceMetrics(svcRows, startKey, endKey) {
  const rows = filterRowsByMonth(svcRows, ['date_closed', 'date_cashiered', 'date_in'], startKey, endKey)
    .filter((r) => !String(r.status || '').toLowerCase().includes('void'));
  const revenue = rows.reduce((t, r) => t + parseNumber(r.price_sublet) + parseNumber(r.price_misc) + parseNumber(r.price_parts) + parseNumber(r.price_labor), 0);
  const cost = rows.reduce((t, r) => t + parseNumber(r.cost_sublet) + parseNumber(r.cost_parts) + parseNumber(r.cost_labor), 0);
  const grossProfit = revenue - cost;
  const byMonth = monthRange(startKey, endKey).map((monthKey) => ({
    monthKey,
    month: monthLabel(monthKey),
    revenue: rows
      .filter((r) => inMonthWindow(dateFromRow(r, ['date_closed', 'date_cashiered', 'date_in']), monthKey, monthKey))
      .reduce((t, r) => t + parseNumber(r.price_sublet) + parseNumber(r.price_misc) + parseNumber(r.price_parts) + parseNumber(r.price_labor), 0)
  }));
  return { rows, roCount: rows.length, revenue, cost, grossProfit, byMonth };
}

function buildPartsMetrics(prtRows, startKey, endKey) {
  const rows = filterRowsByMonth(prtRows, ['date_invoice', 'Date'], startKey, endKey);
  const revenue = rows.reduce((t, r) => t + parseNumber(r.price_total || r.PriceTotal), 0);
  const cost = rows.reduce((t, r) => t + parseNumber(r.cost_total || r.CostTotal), 0);
  const grossProfit = rows.reduce((t, r) => t + (r.margin_total !== undefined ? parseNumber(r.margin_total) : parseNumber(r.price_total) - parseNumber(r.cost_total)), 0);
  return { rows, invoiceCount: new Set(rows.map((r) => r.invoice_number || r.InvoiceNumber)).size, revenue, cost, grossProfit };
}

function buildOemMetrics(unitRows) {
  const groups = groupBy(unitRows, (r) => normalizeMake(r.Make || r.make || r.Brand || r.brand));
  return [...groups.entries()].map(([make, rows]) => {
    const revenue = rows.reduce((t, r) => t + parseNumber(r.UnitPrice || r.unit_price), 0);
    const cost = rows.reduce((t, r) => t + parseNumber(r.UnitCost || r.unit_cost), 0);
    const holdback = rows.reduce((t, r) => t + parseNumber(r.Holdback || r.holdback), 0);
    const rebate = rows.reduce((t, r) => t + parseNumber(r.Rebate || r.rebate), 0);
    const doc = rows.reduce((t, r) => t + parseNumber(r.DocPrice || r.doc_price), 0);
    const gp = revenue - cost + holdback + rebate + doc;
    let read = 'Selective';
    const gpMargin = safeDivide(gp, revenue) * 100;
    if (rows.length >= 30 && gpMargin >= 8) read = 'Anchor';
    if (rows.length >= 30 && gpMargin < 4) read = 'Volume / watch';
    return { make, units: rows.length, revenue, frontEndGp: gp, frontEndGpMargin: gpMargin, read };
  }).filter((row) => row.revenue > 0).sort((a, b) => b.frontEndGp - a.frontEndGp).slice(0, 8);
}

function buildCapitalMetrics(accountingRows, endKey) {
  const endingRows = accountingRows.filter((r) => r.monthKey === endKey);
  const allRows = accountingRows;
  const accountHas = (row, ...words) => words.some((word) => `${row.accountName} ${row.account}`.toLowerCase().includes(word));
  const cash = sum(endingRows, (r) => r.type === 'Asset' && accountHas(r, 'cash', 'bank'));
  const inventory = Math.abs(sum(endingRows, (r) => r.type === 'Asset' && accountHas(r, 'inventory')));
  const oemPayable = Math.abs(sum(endingRows, (r) => r.type === 'Liability' && accountHas(r, 'floor', 'oem', 'payable')));
  const floorplanInterest = Math.abs(sum(allRows, (r) => r.type === 'Expense' && accountHas(r, 'floor plan', 'floorplan')));
  const advertising = Math.abs(sum(allRows, (r) => r.type === 'Expense' && accountHas(r, 'advertis')));
  return { cash, inventory, oemPayable, floorplanInterest, advertising };
}

function buildGenericFallback(files, startKey, endKey) {
  const rows = files.flatMap((f) => (f.rows || []).map((r) => ({ ...r, __file: f.name })));
  const filtered = rows.filter((row) => {
    const dateField = Object.keys(row).find((k) => /date|month/i.test(k));
    return !dateField || inMonthWindow(asMonthKey(row[dateField]), startKey, endKey);
  });
  const revenue = filtered.reduce((total, row) => {
    const key = Object.keys(row).find((k) => /revenue|sales|price|amount/i.test(k));
    return total + (key ? parseNumber(row[key]) : 0);
  }, 0);
  return { revenue, rows: filtered };
}

export function buildMetrics(ingested, options) {
  const { byType, dataFiles } = ingested;
  const startKey = options.dataStart || options.reportStart;
  const endKey = options.dataEnd || options.reportEnd;
  const periodLabel = startKey === endKey ? monthLabelLong(startKey) : `${monthLabelLong(startKey)} – ${monthLabelLong(endKey)}`;

  const genRows = firstRows(byType, 'GEN01');
  const act01Rows = firstRows(byType, 'ACT01');
  const act02Rows = firstRows(byType, 'ACT02');
  const rpt11Rows = firstRows(byType, 'RPT11');
  const rpt12Rows = firstRows(byType, 'RPT12');
  const svcRows = firstRows(byType, 'SVC01');
  const prtRows = firstRows(byType, 'PRT01');

  const dealerName = options.dealerName?.trim() || getStoreName(genRows, cleanName(dataFiles?.[0]?.name) || 'Dealer');
  const accountingRows = buildAccountingRows(act01Rows, act02Rows, startKey, endKey);
  const months = monthRange(startKey, endKey);

  const consolidated = accountingRows.filter((r) => String(r.department).toLowerCase() === 'consolidated');
  const sourceRowsForOverall = consolidated.length ? consolidated : accountingRows;
  const revenue = sum(sourceRowsForOverall, (r) => r.type === 'Revenue');
  const cogs = sum(sourceRowsForOverall, (r) => r.type === 'Cost of Goods');
  const grossProfit = revenue - cogs;
  const operatingExpenses = sum(sourceRowsForOverall, (r) => r.type === 'Expense');
  const netOperatingProfit = grossProfit - operatingExpenses;

  const generic = !sourceRowsForOverall.length ? buildGenericFallback(dataFiles, startKey, endKey) : null;
  const unitMetrics = buildUnitMetrics(rpt12Rows, rpt11Rows, startKey, endKey);
  const service = buildServiceMetrics(svcRows, startKey, endKey);
  const parts = buildPartsMetrics(prtRows, startKey, endKey);
  const capital = buildCapitalMetrics(accountingRows, endKey);

  const monthly = months.map((monthKey) => {
    const monthRows = sourceRowsForOverall.filter((r) => r.monthKey === monthKey);
    const monthRevenue = sum(monthRows, (r) => r.type === 'Revenue');
    const monthCogs = sum(monthRows, (r) => r.type === 'Cost of Goods');
    const monthGp = monthRevenue - monthCogs;
    const monthExpense = sum(monthRows, (r) => r.type === 'Expense');
    return {
      monthKey,
      month: monthLabel(monthKey),
      revenue: monthRevenue,
      grossProfit: monthGp,
      nop: monthGp - monthExpense,
      units: unitMetrics.rows.filter((r) => inMonthWindow(dateFromRow(r, ['Date', 'DealDate']), monthKey, monthKey)).length,
      floorplanInterest: Math.abs(sum(accountingRows.filter((r) => r.monthKey === monthKey), (r) => r.type === 'Expense' && `${r.accountName} ${r.account}`.toLowerCase().includes('floor')))
    };
  });

  const departmentSource = accountingRows.filter((r) => !['consolidated', 'admin', 'rental', 'unmapped'].includes(String(r.department).toLowerCase()));
  const departments = [...groupBy(departmentSource, (r) => r.department).entries()].map(([department, rows]) => {
    const dRevenue = sum(rows, (r) => r.type === 'Revenue');
    const dCogs = sum(rows, (r) => r.type === 'Cost of Goods');
    const dGp = dRevenue - dCogs;
    const dExpense = sum(rows, (r) => r.type === 'Expense');
    return {
      department: department === 'Finance & Insurance' ? 'F & I' : department,
      revenue: dRevenue,
      grossProfit: dGp,
      gpMargin: safeDivide(dGp, dRevenue) * 100,
      directExpense: dExpense,
      directNop: dGp - dExpense,
      nopMargin: safeDivide(dGp - dExpense, dRevenue) * 100
    };
  }).filter((row) => Math.abs(row.revenue) + Math.abs(row.grossProfit) + Math.abs(row.directExpense) > 0);

  const fiDepartment = departments.find((d) => d.department === 'F & I') || { grossProfit: 0, directNop: 0 };
  const fiGross = fiDepartment.grossProfit || fiDepartment.directNop || 0;
  const fAndIPvr = safeDivide(fiGross, unitMetrics.unitCount);
  const oems = buildOemMetrics(unitMetrics.rows);

  return {
    dealerName,
    startKey,
    endKey,
    periodLabel,
    dataFiles: dataFiles.map((f) => ({ name: f.name, type: f.type, rows: f.rows.length })),
    hasAccounting: sourceRowsForOverall.length > 0,
    revenue: sourceRowsForOverall.length ? revenue : generic?.revenue || 0,
    grossProfit,
    grossMargin: safeDivide(grossProfit, revenue) * 100,
    operatingExpenses,
    operatingExpenseRate: safeDivide(operatingExpenses, revenue) * 100,
    netOperatingProfit,
    nopMargin: safeDivide(netOperatingProfit, revenue) * 100,
    unitSales: unitMetrics.unitCount,
    newUnits: unitMetrics.newUnits,
    usedUnits: unitMetrics.usedUnits,
    frontEndGpMargin: unitMetrics.frontEndGpMargin,
    fAndIPvr,
    financePenetration: unitMetrics.financePenetration,
    service,
    parts,
    capital,
    monthly,
    departments,
    oems,
    transcriptAvailable: Boolean(ingested.transcriptText),
    sourceCounts: {
      accountingRows: accountingRows.length,
      unitRows: unitMetrics.rows.length,
      roRows: service.rows.length,
      partRows: parts.rows.length,
      transcriptCharacters: ingested.transcriptText?.length || 0
    }
  };
}
