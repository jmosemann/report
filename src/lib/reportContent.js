import { formatMoney, formatPercent, formatCount, safeDivide } from './format.js';


function compactText(value, max = 140) {
  const text = String(value || '').replace(/\s+/g, ' ').trim();
  if (text.length <= max) return text;
  const slice = text.slice(0, Math.max(0, max - 1));
  const cut = Math.max(slice.lastIndexOf('. '), slice.lastIndexOf('; '), slice.lastIndexOf(', '), slice.lastIndexOf(' '));
  const trimmed = slice.slice(0, cut > max * 0.55 ? cut : slice.length).trim();
  return `${trimmed.replace(/[.,;:]+$/, '')}…`;
}

function normalizeTakeawayList(input, fallback) {
  const source = Array.isArray(input) && input.length ? input : fallback;
  const clean = source.slice(0, 3).map((item, idx) => {
    const backup = fallback[idx] || fallback[0] || {};
    return {
      title: compactText(item?.title || backup.title, 42),
      body: compactText(item?.body || backup.body, 170)
    };
  });
  while (clean.length < 3 && fallback[clean.length]) {
    clean.push({
      title: compactText(fallback[clean.length].title, 42),
      body: compactText(fallback[clean.length].body, 170)
    });
  }
  return clean.slice(0, 3);
}

function normalizeExecutiveRead(input, fallback) {
  const source = Array.isArray(input) && input.length ? input : fallback;
  const clean = source.slice(0, 4).map((line, idx) => compactText(line || fallback[idx], 165));
  while (clean.length < 4 && fallback[clean.length]) clean.push(compactText(fallback[clean.length], 165));
  return clean.slice(0, 4);
}

function normalizePriorityList(input, fallback) {
  const source = Array.isArray(input) && input.length ? input : fallback;
  const clean = source.slice(0, 5).map((item, idx) => {
    const backup = fallback[idx] || fallback[0] || {};
    const status = String(item?.status || backup.status || 'WATCH').toUpperCase();
    return {
      area: compactText(item?.area || backup.area, 32),
      priority: compactText(item?.priority || backup.priority, 92),
      currentRead: compactText(item?.currentRead || backup.currentRead, 52),
      status: ['WATCH', 'ACTION', 'GOOD'].includes(status) ? status : 'WATCH',
      leadershipMove: compactText(item?.leadershipMove || backup.leadershipMove, 82)
    };
  });
  while (clean.length < 5 && fallback[clean.length]) {
    const item = fallback[clean.length];
    clean.push({
      area: compactText(item.area, 32),
      priority: compactText(item.priority, 92),
      currentRead: compactText(item.currentRead, 52),
      status: item.status,
      leadershipMove: compactText(item.leadershipMove, 82)
    });
  }
  return clean.slice(0, 5);
}

function normalizeTalkTrack(input, fallback) {
  const source = Array.isArray(input) && input.length ? input : fallback;
  const clean = source.slice(0, 5).map((paragraph, idx) => compactText(paragraph || fallback[idx], 520));
  while (clean.length < 5 && fallback[clean.length]) clean.push(compactText(fallback[clean.length], 520));
  return clean.slice(0, 5);
}

function deterministicTakeaways(metrics) {
  const takeaways = [];
  if (metrics.nopMargin >= 3) {
    takeaways.push({ title: 'Profit is positive', body: `The store retained ${formatMoney(metrics.netOperatingProfit)} of NOP, or ${formatPercent(metrics.nopMargin)}, for the selected period.` });
  } else {
    takeaways.push({ title: 'Profit needs attention', body: `NOP finished at ${formatMoney(metrics.netOperatingProfit)}, or ${formatPercent(metrics.nopMargin)}, which should be inspected against gross margin and expense load.` });
  }

  const strongestDepartment = [...(metrics.departments || [])].sort((a, b) => b.directNop - a.directNop)[0];
  if (strongestDepartment) {
    takeaways.push({ title: `${strongestDepartment.department} is carrying profit`, body: `${strongestDepartment.department} produced ${formatMoney(strongestDepartment.directNop)} of direct NOP.` });
  }

  if (metrics.frontEndGpMargin < 5) {
    takeaways.push({ title: 'Unit margin needs rigor', body: `Front-end GP margin is ${formatPercent(metrics.frontEndGpMargin)}; review pricing, trade, freight, prep, and discounting by brand.` });
  } else {
    takeaways.push({ title: 'Unit margin has room to scale', body: `Front-end GP margin is ${formatPercent(metrics.frontEndGpMargin)}; protect deal structure as volume grows.` });
  }

  if (metrics.service?.revenue) {
    takeaways.push({ title: 'Fixed ops is a stabilizer', body: `Service processed ${formatCount(metrics.service.roCount)} ROs and ${formatMoney(metrics.service.revenue)} of RO revenue.` });
  }

  return takeaways.slice(0, 3);
}

function defaultLeadershipPriorities(metrics) {
  const priorities = [];
  priorities.push({
    area: 'Major-unit margin',
    priority: 'Protect freight/prep discipline and improve front-end GP quality.',
    currentRead: formatPercent(metrics.frontEndGpMargin),
    status: metrics.frontEndGpMargin < 5 ? 'ACTION' : 'WATCH',
    leadershipMove: 'Review pricing, trade ACV, incentives, and exceptions weekly.'
  });
  priorities.push({
    area: 'F&I',
    priority: 'Build a repeatable F&I process around early customer introduction.',
    currentRead: `${formatMoney(metrics.fAndIPvr, { compact: false })} PVR`,
    status: metrics.fAndIPvr < 400 ? 'ACTION' : 'WATCH',
    leadershipMove: 'Practice scripts; inspect acceptance, declines, and lender mix.'
  });
  priorities.push({
    area: 'Service capacity',
    priority: 'Turn RO activity into a throughput and capacity plan.',
    currentRead: `${formatCount(metrics.service?.roCount)} ROs; ${formatMoney(metrics.service?.revenue)}`,
    status: 'WATCH',
    leadershipMove: 'Track hours, RECT, comeback risk, and bay flow.'
  });
  if (metrics.usedUnits) {
    priorities.push({
      area: 'Used units',
      priority: 'Protect appraisal, recon, pricing, and exit rules.',
      currentRead: `${formatCount(metrics.usedUnits)} used units`,
      status: 'WATCH',
      leadershipMove: 'Inspect aging, recon cost, and turn policy.'
    });
  }
  priorities.push({
    area: 'Systems / CRM',
    priority: 'Use data and customer notes to tighten management rhythm.',
    currentRead: metrics.transcriptAvailable ? 'Transcript context available' : 'Transcript context not provided',
    status: 'ACTION',
    leadershipMove: 'Clarify owners, cadence, scorecards, and follow-up rules.'
  });
  return priorities;
}

function defaultExecutiveRead(metrics) {
  const lines = [];
  if (metrics.revenue) lines.push(`Revenue reached ${formatMoney(metrics.revenue)} across ${formatCount(metrics.unitSales)} retailed units.`);
  if (metrics.netOperatingProfit || metrics.revenue) lines.push(`The store retained ${formatMoney(metrics.netOperatingProfit)} of NOP, or ${formatPercent(metrics.nopMargin)}, on a ${formatPercent(metrics.grossMargin)} gross margin.`);
  const bestDept = [...(metrics.departments || [])].sort((a, b) => b.directNop - a.directNop)[0];
  if (bestDept) lines.push(`${bestDept.department} is the cleanest direct profit pocket at ${formatMoney(bestDept.directNop)} of direct NOP.`);
  if (metrics.service?.roCount) lines.push(`Service and P&A provide a durable fixed-ops foundation, with ${formatCount(metrics.service.roCount)} ROs and ${formatMoney((metrics.service?.grossProfit || 0) + (metrics.parts?.grossProfit || 0))} of combined gross profit.`);
  return lines.slice(0, 4);
}

function defaultTalkTrack(metrics) {
  const strongestDepartment = [...(metrics.departments || [])].sort((a, b) => b.directNop - a.directNop)[0];
  const weakestMargin = [...(metrics.departments || [])].filter((d) => d.revenue > 0).sort((a, b) => a.nopMargin - b.nopMargin)[0];
  return [
    `The executive discussion should start with the simple read: the business generated ${formatMoney(metrics.revenue)} in revenue and retained ${formatMoney(metrics.netOperatingProfit)} in net operating profit for ${metrics.periodLabel}. That gives leadership a clear profitability baseline before the conversation moves into department-level execution.`,
    `The next question is quality of revenue. Gross margin finished at ${formatPercent(metrics.grossMargin)} and front-end GP margin finished at ${formatPercent(metrics.frontEndGpMargin)}. That means leadership should not only ask whether volume is growing, but whether the right deals, brands, customer segments, and pricing routines are creating profit that can be repeated.`,
    strongestDepartment ? `${strongestDepartment.department} should be treated as a proof point. It produced ${formatMoney(strongestDepartment.directNop)} of direct NOP, which gives the team a practical place to identify what is working and where similar operating discipline can be repeated.` : `Department contribution should be reviewed carefully because the available data does not yet point to one obvious direct-profit engine.`,
    weakestMargin ? `${weakestMargin.department} deserves inspection because its direct NOP margin is ${formatPercent(weakestMargin.nopMargin)}. The leadership move is not to overreact to one line; it is to understand whether the issue is mix, pricing, discounting, cost structure, throughput, or process consistency.` : `The department review should connect the numbers to the operating profile captured in the transcripts so the team avoids treating financial results as disconnected accounting output.`,
    `The final leadership move is to convert the report into a cadence: one margin conversation, one fixed-ops throughput conversation, one F&I process conversation, and one systems/CRM follow-up conversation. The value of the report is not the PDF itself; it is the operating rhythm it creates after the meeting.`
  ];
}

export function normalizeAi(ai, metrics) {
  const fallback = {
    executiveRead: defaultExecutiveRead(metrics),
    executiveTakeaways: deterministicTakeaways(metrics),
    wigTakeaways: [
      { title: 'Margin is the WIG', body: `The store has scale, but front-end GP margin is ${formatPercent(metrics.frontEndGpMargin)} and should be inspected by brand/category.` },
      { title: 'F&I needs process', body: `F&I PVR is ${formatMoney(metrics.fAndIPvr, { compact: false })}; scripts, menu discipline, and early introduction should be reviewed weekly.` },
      { title: 'Service is operational', body: `RO activity should be reviewed against capacity, RECT, and technician flow.` }
    ],
    financialTakeaways: [
      { title: 'Gross margin is visible', body: `Gross profit was ${formatMoney(metrics.grossProfit)}, or ${formatPercent(metrics.grossMargin)}, on ${formatMoney(metrics.revenue)} of revenue.` },
      { title: 'NOP is the baseline', body: `The store retained ${formatMoney(metrics.netOperatingProfit)} after ${formatMoney(metrics.operatingExpenses)} in operating expenses.` },
      { title: 'Capital data needs reconciliation', body: 'Inventory and OEM payable balances should be reconciled to aged inventory and floorplan schedules before final cash planning.' }
    ],
    trendTakeaways: [
      { title: 'Seasonality is visible', body: 'Review high-volume months separately from lower-volume months so mix does not hide operating issues.' },
      { title: 'Profit varies by mix', body: 'NOP should be reviewed next to gross margin, trade quality, floorplan interest, and service throughput.' },
      { title: 'Use the trend operationally', body: 'Turn monthly movement into a recurring leadership inspection rhythm.' }
    ],
    departmentTakeaways: deterministicTakeaways(metrics),
    inventoryTakeaways: [
      { title: 'Inventory supports growth', body: 'Capital planning should be category-specific across the dealer’s major businesses.' },
      { title: 'Floorplan cost is real', body: `Floorplan interest was ${formatMoney(metrics.capital?.floorplanInterest)} for the selected period.` },
      { title: 'Capacity affects capital', body: 'Facility, inventory, service capacity, and cash planning should be reviewed together.' }
    ],
    fixedOpsTakeaways: [
      { title: 'Service is productive', body: `RO activity produced ${formatMoney(metrics.service?.grossProfit)} in gross profit.` },
      { title: 'Parts is a stabilizer', body: `P&A produced ${formatMoney(metrics.parts?.grossProfit)} in gross profit.` },
      { title: 'F&I needs process', body: `F&I generated roughly ${formatMoney(metrics.fAndIPvr, { compact: false })} per retailed unit.` }
    ],
    oemTakeaways: [
      { title: 'Brand mix matters', body: 'Compare unit volume, revenue, and front-end GP by OEM before making stocking decisions.' },
      { title: 'Anchors deserve protection', body: 'High-volume/high-margin categories should receive inventory and sales-process discipline.' },
      { title: 'Selective brands need rules', body: 'Lower-volume brands should have clear stocking, aging, and exit rules.' }
    ],
    leadershipPriorities: defaultLeadershipPriorities(metrics),
    executiveTalkTrack: defaultTalkTrack(metrics)
  };

  return {
    executiveRead: normalizeExecutiveRead(ai?.executiveRead, fallback.executiveRead),
    executiveTakeaways: normalizeTakeawayList(ai?.executiveTakeaways, fallback.executiveTakeaways),
    wigTakeaways: normalizeTakeawayList(ai?.wigTakeaways, fallback.wigTakeaways),
    financialTakeaways: normalizeTakeawayList(ai?.financialTakeaways, fallback.financialTakeaways),
    trendTakeaways: normalizeTakeawayList(ai?.trendTakeaways, fallback.trendTakeaways),
    departmentTakeaways: normalizeTakeawayList(ai?.departmentTakeaways, fallback.departmentTakeaways),
    inventoryTakeaways: normalizeTakeawayList(ai?.inventoryTakeaways, fallback.inventoryTakeaways),
    fixedOpsTakeaways: normalizeTakeawayList(ai?.fixedOpsTakeaways, fallback.fixedOpsTakeaways),
    oemTakeaways: normalizeTakeawayList(ai?.oemTakeaways, fallback.oemTakeaways),
    leadershipPriorities: normalizePriorityList(ai?.leadershipPriorities, fallback.leadershipPriorities),
    executiveTalkTrack: normalizeTalkTrack(ai?.executiveTalkTrack, fallback.executiveTalkTrack)
  };
}

export function buildReportData(metrics, ai) {
  const content = normalizeAi(ai, metrics);
  const departmentRows = metrics.departments?.length ? metrics.departments : [
    { department: 'New Units', revenue: metrics.revenue, grossProfit: metrics.grossProfit, gpMargin: metrics.grossMargin, directExpense: metrics.operatingExpenses, directNop: metrics.netOperatingProfit, nopMargin: metrics.nopMargin }
  ];

  const monthlyBest = [...metrics.monthly].sort((a, b) => b.nop - a.nop)[0];
  const monthlyWorst = [...metrics.monthly].sort((a, b) => a.nop - b.nop)[0];

  return {
    metrics,
    content,
    cards: {
      revenue: { label: 'Revenue', value: formatMoney(metrics.revenue), sub: `${metrics.periodLabel} operating revenue` },
      grossProfit: { label: 'Gross Profit', value: formatMoney(metrics.grossProfit), sub: `${formatPercent(metrics.grossMargin)} gross margin` },
      nop: { label: 'Net Operating Profit', value: formatMoney(metrics.netOperatingProfit), sub: `${formatPercent(metrics.nopMargin)} NOP margin` },
      units: { label: 'Unit Sales', value: formatCount(metrics.unitSales), sub: `${formatCount(metrics.newUnits)} new / ${formatCount(metrics.usedUnits)} used` },
      frontEndGp: { label: 'Front-End GP Margin', value: formatPercent(metrics.frontEndGpMargin), sub: 'Improve deal quality' },
      fiPvr: { label: 'F&I PVR', value: formatMoney(metrics.fAndIPvr, { compact: false }), sub: 'Build process' },
      serviceNop: { label: 'Service NOP', value: formatMoney((departmentRows.find((d) => d.department === 'Service') || {}).directNop || 0), sub: 'Protect throughput' }
    },
    departmentRows,
    monthlyBest,
    monthlyWorst,
    ratios: {
      fixedOpsGp: (metrics.service?.grossProfit || 0) + (metrics.parts?.grossProfit || 0),
      fixedOpsRevenue: (metrics.service?.revenue || 0) + (metrics.parts?.revenue || 0),
      fixedOpsMargin: safeDivide((metrics.service?.grossProfit || 0) + (metrics.parts?.grossProfit || 0), (metrics.service?.revenue || 0) + (metrics.parts?.revenue || 0)) * 100
    }
  };
}
