import { formatMoney, formatPercent, formatCount, safeDivide } from './format.js';

function compactText(value, max = 140) {
  const text = String(value || '').replace(/\s+/g, ' ').trim();
  if (text.length <= max) return text;
  const slice = text.slice(0, Math.max(0, max - 1));
  const cut = Math.max(slice.lastIndexOf('. '), slice.lastIndexOf('; '), slice.lastIndexOf(', '), slice.lastIndexOf(' '));
  const trimmed = slice.slice(0, cut > max * 0.55 ? cut : slice.length).trim();
  return `${trimmed.replace(/[.,;:]+$/, '')}…`;
}

function normKey(text = '') {
  return String(text || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

function normalizeTakeawayList(input, fallback, used = new Set()) {
  const source = Array.isArray(input) && input.length ? input : fallback;
  const clean = [];
  const candidates = [...source, ...(fallback || [])];
  for (const item of candidates) {
    if (!item || clean.length >= 3) break;
    const title = compactText(item.title, 34);
    const body = compactText(item.body, 128);
    const key = `${normKey(title)}|${normKey(body).slice(0, 70)}`;
    const titleKey = `title:${normKey(title)}`;
    if (!title || !body || used.has(key) || used.has(titleKey)) continue;
    used.add(key);
    used.add(titleKey);
    clean.push({ title, body });
  }
  while (clean.length < 3 && fallback?.[clean.length]) {
    const item = fallback[clean.length];
    clean.push({ title: compactText(item.title, 34), body: compactText(item.body, 128) });
  }
  return clean.slice(0, 3);
}

function normalizeNumberedList(input, fallback, used = new Set()) {
  return normalizeTakeawayList(input, fallback, used);
}

function normalizeExecutiveRead(input, fallback) {
  const source = Array.isArray(input) && input.length ? input : fallback;
  const clean = source.slice(0, 4).map((line, idx) => compactText(line || fallback[idx], 130));
  while (clean.length < 4 && fallback[clean.length]) clean.push(compactText(fallback[clean.length], 130));
  return clean.slice(0, 4);
}

function normalizePriorityList(input, fallback) {
  const source = Array.isArray(input) && input.length ? input : fallback;
  const clean = source.slice(0, 5).map((item, idx) => {
    const backup = fallback[idx] || fallback[0] || {};
    const status = String(item?.status || backup.status || 'WATCH').toUpperCase();
    return {
      area: compactText(item?.area || backup.area, 36),
      priority: compactText(item?.priority || backup.priority, 145),
      currentRead: compactText(item?.currentRead || backup.currentRead, 52),
      status: ['WATCH', 'ACTION', 'GOOD'].includes(status) ? status : 'WATCH',
      leadershipMove: compactText(item?.leadershipMove || backup.leadershipMove, 82)
    };
  });
  while (clean.length < 5 && fallback[clean.length]) {
    const item = fallback[clean.length];
    clean.push({
      area: compactText(item.area, 36),
      priority: compactText(item.priority, 145),
      currentRead: compactText(item.currentRead, 52),
      status: item.status,
      leadershipMove: compactText(item.leadershipMove, 82)
    });
  }
  return clean.slice(0, 5);
}

function normalizeBulletList(input, fallback, maxItems = 3, maxLen = 118) {
  const source = Array.isArray(input) && input.length ? input : fallback;
  const out = [];
  for (const item of source || []) {
    if (out.length >= maxItems) break;
    const text = compactText(item, maxLen);
    if (text) out.push(text);
  }
  while (out.length < Math.min(maxItems, fallback?.length || 0)) out.push(compactText(fallback[out.length], maxLen));
  return out;
}

function normalizeTalkSections(input, fallback) {
  const source = Array.isArray(input) && input.length ? input : fallback;
  const out = source.slice(0, 4).map((section, idx) => {
    const backup = fallback[idx] || fallback[0] || {};
    return {
      title: compactText(section?.title || backup.title, 34),
      hits: normalizeBulletList(section?.hits, backup.hits, 2, 112),
      risks: normalizeBulletList(section?.risks, backup.risks, 2, 112),
      questions: normalizeBulletList(section?.questions, backup.questions, 2, 112)
    };
  });
  while (out.length < 4 && fallback[out.length]) out.push(fallback[out.length]);
  return out.slice(0, 4);
}

function deterministicTakeaways(metrics) {
  const takeaways = [];
  if (metrics.nopMargin >= 3) {
    takeaways.push({ title: 'Profit is positive', body: `NOP finished at ${formatMoney(metrics.netOperatingProfit)}, or ${formatPercent(metrics.nopMargin)}.` });
  } else {
    takeaways.push({ title: 'Profit conversion is thin', body: `NOP finished at ${formatMoney(metrics.netOperatingProfit)}, or ${formatPercent(metrics.nopMargin)}.` });
  }

  const strongestDepartment = [...(metrics.departments || [])].sort((a, b) => b.directNop - a.directNop)[0];
  if (strongestDepartment) {
    takeaways.push({ title: `${strongestDepartment.department} leads profit`, body: `${strongestDepartment.department} produced ${formatMoney(strongestDepartment.directNop)} in direct NOP.` });
  }

  if (metrics.frontEndGpMargin < 5) {
    takeaways.push({ title: 'Unit margin needs rigor', body: `Front-end GP margin is ${formatPercent(metrics.frontEndGpMargin)}; inspect deals by brand.` });
  } else {
    takeaways.push({ title: 'Unit margin must hold', body: `Front-end GP margin is ${formatPercent(metrics.frontEndGpMargin)}; protect deal structure.` });
  }

  if (metrics.service?.revenue) {
    takeaways.push({ title: 'Fixed ops matters', body: `Service processed ${formatCount(metrics.service.roCount)} ROs and ${formatMoney(metrics.service.revenue)} of RO revenue.` });
  }

  return takeaways.slice(0, 3);
}

function defaultLeadershipPriorities(metrics) {
  const priorities = [];
  priorities.push({
    area: 'Volume & Credit Conversion',
    priority: 'Build a weekly view of leads, approvals, turndowns, sold units, and lost opportunities so volume improves without weakening deal quality.',
    currentRead: `${formatCount(metrics.unitSales)} units`,
    status: metrics.nopMargin < 3 ? 'ACTION' : 'WATCH',
    leadershipMove: 'Inspect leads, approvals, declines, and sold units weekly.'
  });
  priorities.push({
    area: 'Major-Unit Profit Bridge',
    priority: 'Review discounts, freight, floorplan, advertising, and sales expense allocation so new-unit gross converts to operating profit.',
    currentRead: `${formatPercent(metrics.frontEndGpMargin)} front-end GP`,
    status: metrics.frontEndGpMargin < 8 ? 'ACTION' : 'WATCH',
    leadershipMove: 'Bridge GP to expenses by category.'
  });
  priorities.push({
    area: 'F&I / Credit Process',
    priority: 'Use early introduction, lender mix, and payment-fit review to protect PVR while improving approval quality.',
    currentRead: `${formatMoney(metrics.fAndIPvr, { compact: false })} PVR`,
    status: metrics.fAndIPvr < 400 ? 'ACTION' : 'WATCH',
    leadershipMove: 'Review accepts, declines, and lender fit.'
  });
  priorities.push({
    area: 'Fixed Ops Throughput',
    priority: 'Connect service, parts, and follow-up around the customer lifecycle so RO volume and parts demand become retention engines.',
    currentRead: `${formatCount(metrics.service?.roCount)} ROs`,
    status: 'WATCH',
    leadershipMove: 'Track RECT, parts delays, and bay flow.'
  });
  priorities.push({
    area: 'Department Scorecards',
    priority: 'Define decision rights and KPI ownership for sales, F&I, parts, service, inventory, and customer follow-up leaders.',
    currentRead: metrics.transcriptAvailable ? 'Transcript context available' : 'Transcript context not provided',
    status: 'ACTION',
    leadershipMove: 'Assign owners and scorecards before the next review.'
  });
  return priorities;
}

function defaultExecutiveMandate(metrics) {
  return [
    { title: 'Protect profit conversion', body: `The next review should connect ${formatMoney(metrics.grossProfit)} gross profit to ${formatMoney(metrics.netOperatingProfit)} NOP.` },
    { title: 'Create qualified swings', body: 'Unit count must grow through better lead quality, credit visibility, and follow-up discipline.' },
    { title: 'Make ownership measurable', body: 'Scorecards should move managers from task ownership to outcome ownership.' }
  ];
}

function defaultFinalNarrative(metrics) {
  return [
    { title: 'Profit quality is the issue', body: `${metrics.dealerName} has revenue scale, but the leadership system must turn gross into NOP.` },
    { title: 'Growth needs a system', body: 'Volume, credit, inventory, F&I, and fixed ops need one weekly operating rhythm.' },
    { title: 'Scorecards drive the next review', body: 'Department owners should bring actions, variances, and next steps to the next HHOS review.' }
  ];
}

function defaultExecutiveRead(metrics) {
  const lines = [];
  if (metrics.revenue) lines.push(`Revenue reached ${formatMoney(metrics.revenue)} across ${formatCount(metrics.unitSales)} retailed units.`);
  if (metrics.netOperatingProfit || metrics.revenue) lines.push(`The store retained ${formatMoney(metrics.netOperatingProfit)} of NOP, or ${formatPercent(metrics.nopMargin)}, on a ${formatPercent(metrics.grossMargin)} gross margin.`);
  const bestDept = [...(metrics.departments || [])].sort((a, b) => b.directNop - a.directNop)[0];
  if (bestDept) lines.push(`${bestDept.department} is the cleanest direct profit pocket at ${formatMoney(bestDept.directNop)} of direct NOP.`);
  if (metrics.service?.roCount) lines.push(`Service and P&A provide a fixed-ops foundation with ${formatCount(metrics.service.roCount)} ROs and ${formatMoney((metrics.service?.grossProfit || 0) + (metrics.parts?.grossProfit || 0))} of combined gross profit.`);
  return lines.slice(0, 4);
}

function defaultTalkTrackSections(metrics) {
  const strongestDepartment = [...(metrics.departments || [])].sort((a, b) => b.directNop - a.directNop)[0];
  const weakestDepartment = [...(metrics.departments || [])].filter((d) => d.revenue > 0).sort((a, b) => a.directNop - b.directNop)[0];
  return [
    {
      title: 'Sales / Inventory',
      hits: [
        `${formatMoney(metrics.revenue)} in revenue gives the store a real selling base to work from.`,
        strongestDepartment ? `${strongestDepartment.department} shows where operating discipline is already creating profit.` : 'The unit mix gives leadership multiple levers to inspect by brand and category.'
      ],
      risks: [
        `Front-end GP margin is ${formatPercent(metrics.frontEndGpMargin)}, so volume alone may not convert to profit.`,
        `Inventory and floorplan exposure should be tied to turn expectations and category plans.`
      ],
      questions: [
        'Which brands deserve more capital based on contribution, margin, inventory, and turns?',
        'Where are price, trade, freight, or floorplan costs absorbing margin?'
      ]
    },
    {
      title: 'F&I / Credit',
      hits: [
        `F&I PVR is ${formatMoney(metrics.fAndIPvr, { compact: false })}, giving leadership a measurable back-end baseline.`,
        `Finance penetration is ${formatPercent(metrics.financePenetration)}, which should be reviewed against deal quality.`
      ],
      risks: [
        'If approvals, declines, and payment-fit issues are not tracked, lost opportunity stays invisible.',
        'Cash or declined customers may still need disciplined protection, maintenance, or accessory presentation.'
      ],
      questions: [
        'Where are deals failing most often: score, down payment, lender fit, trade equity, or follow-up?',
        'Are cash buyers and declined customers still shown relevant options?'
      ]
    },
    {
      title: 'Service / Parts',
      hits: [
        `Service processed ${formatCount(metrics.service?.roCount)} ROs and supports retention beyond the initial sale.`,
        `Parts generated ${formatMoney(metrics.parts?.grossProfit)} in gross profit, showing attachment demand exists.`
      ],
      risks: [
        'Gross activity alone is not enough if direct expenses keep fixed ops under pressure.',
        'Parts delays, approvals, or capacity issues can weaken trust and reduce repeat visits.'
      ],
      questions: [
        'Which P&A categories create true profit after expense, and which tie up capital?',
        'Where do ROs wait on parts, approval, or capacity?'
      ]
    },
    {
      title: 'Leadership / Systems',
      hits: [
        'The report gives leaders a common fact base for action, not just a financial recap.',
        'Management cadence can connect sales, F&I, service, parts, inventory, and follow-up.'
      ],
      risks: [
        'Titles do not automatically create outcome ownership without scorecards and inspection.',
        'Annual goals need to be translated into month-specific targets and weekly follow-up.'
      ],
      questions: [
        'Who owns each weekly KPI across sales, F&I, service, parts, inventory, and credit?',
        'What should be reviewed before the next HHOS meeting?'
      ]
    }
  ];
}

function defaultTalkTrack(metrics) {
  const sections = defaultTalkTrackSections(metrics);
  return sections.flatMap((s) => [...s.hits, ...s.risks, ...s.questions]).slice(0, 5);
}

export function normalizeAi(ai, metrics) {
  const fallback = {
    executiveRead: defaultExecutiveRead(metrics),
    executiveTakeaways: deterministicTakeaways(metrics),
    wigTakeaways: [
      { title: 'Margin is the WIG', body: `Front-end GP margin is ${formatPercent(metrics.frontEndGpMargin)} and needs category inspection.` },
      { title: 'F&I needs process', body: `F&I PVR is ${formatMoney(metrics.fAndIPvr, { compact: false })}; inspect acceptance and lender mix.` },
      { title: 'Service is operational', body: 'RO activity should be reviewed against capacity, RECT, and technician flow.' }
    ],
    financialTakeaways: [
      { title: 'Gross profit is visible', body: `Gross profit was ${formatMoney(metrics.grossProfit)}, or ${formatPercent(metrics.grossMargin)}.` },
      { title: 'Operating leverage is the test', body: `Expenses were ${formatMoney(metrics.operatingExpenses)} against ${formatMoney(metrics.grossProfit)} of GP.` },
      { title: 'Capital needs reconciliation', body: 'Inventory, cash, and floorplan balances need schedule-level review.' }
    ],
    trendTakeaways: [
      { title: 'Seasonality is visible', body: 'High-volume months should be reviewed separately from low-volume months.' },
      { title: 'Profit varies by mix', body: 'NOP should be reviewed next to margin, floorplan, and service throughput.' },
      { title: 'Use the trend operationally', body: 'Monthly movement should become a recurring leadership inspection rhythm.' }
    ],
    departmentTakeaways: deterministicTakeaways(metrics),
    inventoryTakeaways: [
      { title: 'Inventory needs a plan', body: 'Capital planning should be category-specific and tied to turns.' },
      { title: 'Floorplan cost is real', body: `Floorplan interest was ${formatMoney(metrics.capital?.floorplanInterest)} for the period.` },
      { title: 'Cash planning matters', body: 'Inventory, service capacity, and cash planning should be reviewed together.' }
    ],
    fixedOpsTakeaways: [
      { title: 'Service is a trust lever', body: `RO activity produced ${formatMoney(metrics.service?.grossProfit)} in gross profit.` },
      { title: 'Parts demand exists', body: `P&A produced ${formatMoney(metrics.parts?.grossProfit)} in gross profit.` },
      { title: 'F&I must connect', body: 'Credit, attachment, and customer follow-up should work together.' }
    ],
    oemTakeaways: [
      { title: 'Brand mix matters', body: 'Compare unit volume, revenue, and front-end GP before stocking decisions.' },
      { title: 'Anchor brands need focus', body: 'High-volume brands should receive disciplined inventory and sales review.' },
      { title: 'Selective brands need rules', body: 'Lower-volume brands need clear stocking, aging, and exit rules.' }
    ],
    leadershipPriorities: defaultLeadershipPriorities(metrics),
    executiveMandate: defaultExecutiveMandate(metrics),
    executiveTalkTrack: defaultTalkTrack(metrics),
    talkTrackSections: defaultTalkTrackSections(metrics),
    finalNarrative: defaultFinalNarrative(metrics)
  };

  const used = new Set();
  const content = {
    executiveRead: normalizeExecutiveRead(ai?.executiveRead, fallback.executiveRead),
    executiveTakeaways: normalizeTakeawayList(ai?.executiveTakeaways, fallback.executiveTakeaways, used),
    wigTakeaways: normalizeTakeawayList(ai?.wigTakeaways, fallback.wigTakeaways, used),
    financialTakeaways: normalizeTakeawayList(ai?.financialTakeaways, fallback.financialTakeaways, used),
    trendTakeaways: normalizeTakeawayList(ai?.trendTakeaways, fallback.trendTakeaways, used),
    departmentTakeaways: normalizeTakeawayList(ai?.departmentTakeaways, fallback.departmentTakeaways, used),
    inventoryTakeaways: normalizeTakeawayList(ai?.inventoryTakeaways, fallback.inventoryTakeaways, used),
    fixedOpsTakeaways: normalizeTakeawayList(ai?.fixedOpsTakeaways, fallback.fixedOpsTakeaways, used),
    oemTakeaways: normalizeTakeawayList(ai?.oemTakeaways, fallback.oemTakeaways, used),
    leadershipPriorities: normalizePriorityList(ai?.leadershipPriorities, fallback.leadershipPriorities),
    executiveMandate: normalizeNumberedList(ai?.executiveMandate, fallback.executiveMandate, used),
    executiveTalkTrack: Array.isArray(ai?.executiveTalkTrack) ? ai.executiveTalkTrack.slice(0, 5).map((p) => compactText(p, 360)) : fallback.executiveTalkTrack,
    talkTrackSections: normalizeTalkSections(ai?.talkTrackSections, fallback.talkTrackSections),
    finalNarrative: normalizeNumberedList(ai?.finalNarrative, fallback.finalNarrative, used)
  };
  return content;
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
