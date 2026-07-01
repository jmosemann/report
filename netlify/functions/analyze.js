function money(n) {
  const value = Number(n || 0);
  const abs = Math.abs(value);
  const sign = value < 0 ? '-' : '';
  if (abs >= 1_000_000) return `${sign}$${(abs / 1_000_000).toFixed(abs >= 10_000_000 ? 0 : 1)}M`;
  if (abs >= 1_000) return `${sign}$${Math.round(abs / 1000)}K`;
  return `${sign}$${Math.round(abs).toLocaleString()}`;
}

function pct(n) {
  return `${Number(n || 0).toFixed(1)}%`;
}

const FUNCTION_VERSION = 'v32';


function cleanTranscript(value = '') {
  return String(value || '')
    .replace(/\b\d{1,2}:\d{2}(?::\d{2})?\b/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

const DANGLING_ENDING = /\b(?:and|or|but|with|for|to|from|by|of|in|on|at|as|into|about|through|against|between|so|then|while|because|before|after)\.?$/i;

function completeSentence(value, fallback = 'Review this item during the next operating meeting.') {
  let text = String(value || '').replace(/\s+/g, ' ').trim();
  text = text.replace(/\s*(?:\.\.\.|…)+\s*$/, '').trim();
  text = text.replace(/[,:;\-–—]+$/g, '').trim();
  while (DANGLING_ENDING.test(text)) {
    text = text.replace(DANGLING_ENDING, '').replace(/[,:;\-–—]+$/g, '').trim();
  }
  if (!text) text = fallback;
  if (!/[.!?]$/.test(text)) text += '.';
  return text;
}

function shortText(value, max = 120) {
  const text = String(value || '').replace(/\s+/g, ' ').trim();
  if (!text) return '';
  if (text.length <= max) return completeSentence(text, text);
  const hardLimit = Math.max(max, Math.min(text.length, Math.round(max * 1.55)));
  const soft = text.slice(0, hardLimit);
  const sentenceMatches = [...soft.matchAll(/[.!?](?=\s|$)/g)];
  if (sentenceMatches.length) {
    const end = sentenceMatches[sentenceMatches.length - 1].index + 1;
    if (end >= Math.max(28, max * 0.45)) return completeSentence(soft.slice(0, end), text);
  }
  const clauseCut = Math.max(soft.lastIndexOf('; '), soft.lastIndexOf(', '), soft.lastIndexOf(' — '), soft.lastIndexOf(' - '));
  if (clauseCut >= Math.max(34, max * 0.55)) return completeSentence(soft.slice(0, clauseCut), text);
  const wordCut = soft.lastIndexOf(' ');
  const candidate = wordCut > 28 ? soft.slice(0, wordCut) : soft;
  return completeSentence(candidate, text);
}

const TRANSCRIPT_THEME_RULES = [
  {
    key: 'marketShare',
    area: 'OEM / Market Share',
    title: 'Market data is an action item',
    priority: 'Validate brand and category opportunity with registration data, then separate true share loss from inventory, credit, and mix issues.',
    currentRead: 'Transcript flag',
    status: 'ACTION',
    leadershipMove: 'Request county/category registration data and review by OEM.',
    talkSection: 'Sales / Inventory',
    patterns: [/market share|share loss|losing share|registration data|county[- ]level|\bBRP\b|Can[- ]?Am|Sea[- ]?Doo/i]
  },
  {
    key: 'qualifiedVolume',
    area: 'Qualified Unit Volume',
    title: 'Volume needs qualified swings',
    priority: 'Build a weekly view of lead volume, approvals, sold units, and lost opportunities so unit count improves without weakening deal quality.',
    currentRead: 'Owner priority',
    status: 'ACTION',
    leadershipMove: 'Track leads, approvals, turndowns, and sold units weekly.',
    talkSection: 'Sales / Inventory',
    patterns: [/unit count|unit volume|more volume|qualified swing|more swings|lead volume|traffic|sold units|closing|opportunities/i]
  },
  {
    key: 'creditFi',
    area: 'F&I / Credit',
    title: 'Credit visibility matters',
    priority: 'Track approvals, turndowns, lender fit, down-payment issues, and payment expectations so F&I can protect PVR and improve close quality.',
    currentRead: 'Transcript flag',
    status: 'ACTION',
    leadershipMove: 'Review lender fit, declines, and payment-fit issues weekly.',
    talkSection: 'F&I / Credit',
    patterns: [/credit|approval|approved|declined|turndown|down payment|lender|payment fit|payment expectation|finance|\bF&I\b|pvr/i]
  },
  {
    key: 'budgetSeasonality',
    area: 'Budget & Seasonality',
    title: 'Budget needs monthly rhythm',
    priority: 'Translate the budget and seasonal pattern into month-specific targets instead of relying on annual or prior-year comparisons.',
    currentRead: 'Transcript flag',
    status: 'WATCH',
    leadershipMove: 'Load monthly targets and inspect variance by department.',
    talkSection: 'Leadership / Systems',
    patterns: [/budget|seasonality|seasonal|NCM|monthly target|forecast|variance|prior year|month[- ]specific/i]
  },
  {
    key: 'leadershipScorecards',
    area: 'Department Scorecards',
    title: 'Management needs measurable ownership',
    priority: 'Define decision rights and KPI ownership for sales, F&I, parts, service, inventory, and follow-up leaders.',
    currentRead: 'Leadership theme',
    status: 'ACTION',
    leadershipMove: 'Assign scorecard owners before the next review.',
    talkSection: 'Leadership / Systems',
    patterns: [/manager|management|leadership|owner|ownership|accountability|scorecard|next generation|training|department lead|Robert|Byron|Jessica|Bradley/i]
  },
  {
    key: 'systemsCrm',
    area: 'Systems / CRM',
    title: 'Systems rhythm needs clarity',
    priority: 'Clarify the CRM, DMS, reporting, and follow-up workflow so the management team works from one operating cadence.',
    currentRead: 'Systems theme',
    status: 'ACTION',
    leadershipMove: 'Define CRM and reporting inspection rhythm.',
    talkSection: 'Leadership / Systems',
    patterns: [/CRM|Lightspeed|DMS|system|reporting|data|dashboard|HHOS|HerohubOS|process|workflow|follow[- ]up/i]
  },
  {
    key: 'serviceCapacity',
    area: 'Service Capacity',
    title: 'Service capacity is a constraint',
    priority: 'Review technician flow, bay capacity, parts delays, and facility constraints so fixed ops can grow without hurting customer trust.',
    currentRead: 'Transcript flag',
    status: 'WATCH',
    leadershipMove: 'Track RECT, parts delays, and bay flow.',
    talkSection: 'Service / Parts',
    patterns: [/service|repair order|\bRO\b|technician|bay|capacity|facility|building|space|shop|RECT|parts delay|approval delay/i]
  },
  {
    key: 'inventoryCapital',
    area: 'Inventory & Capital',
    title: 'Capital needs category rules',
    priority: 'Tie stocking, aging, floorplan, cash, and turn expectations to a clear brand/category capital plan.',
    currentRead: 'Capital theme',
    status: 'WATCH',
    leadershipMove: 'Review aged inventory, turn, and floorplan by category.',
    talkSection: 'Sales / Inventory',
    patterns: [/inventory|floorplan|aged|stocking|stock|turn|cash|capital|payable|used inventory|new inventory|overstock/i]
  },
  {
    key: 'partsAttachment',
    area: 'Parts & Attachment',
    title: 'Attachment should support retention',
    priority: 'Connect parts, accessories, service, and F&I follow-up so attachment improves customer retention and gross profit.',
    currentRead: 'Attachment theme',
    status: 'WATCH',
    leadershipMove: 'Inspect attachment, parts demand, and retention follow-up.',
    talkSection: 'Service / Parts',
    patterns: [/parts|accessor|P&A|PA&A|PG&A|attachment|counter|invoice|customer[- ]pay|maintenance/i]
  },
  {
    key: 'trustLegacy',
    area: 'Customer Trust',
    title: 'Trust is a strategic advantage',
    priority: 'Protect the relationship-led selling model while making growth, credit, and department ownership more measurable.',
    currentRead: 'Transcript theme',
    status: 'WATCH',
    leadershipMove: 'Keep customer trust central to scorecards and growth plans.',
    talkSection: 'Leadership / Systems',
    patterns: [/trust|legacy|relationship|reputation|family|community|customer experience|customers trust/i]
  },
  {
    key: 'marginPricing',
    area: 'New-Unit Profit Bridge',
    title: 'Deal structure needs inspection',
    priority: 'Review discounts, freight, setup, floorplan, advertising, and sales expense allocation so volume converts to operating profit.',
    currentRead: 'Margin theme',
    status: 'ACTION',
    leadershipMove: 'Bridge unit gross to department NOP by brand.',
    talkSection: 'Sales / Inventory',
    patterns: [/margin|gross|discount|freight|setup|prep|price|pricing|front[- ]end|deal structure|profit bridge/i]
  }
];

function findEvidence(text, patterns) {
  const clean = cleanTranscript(text);
  if (!clean) return '';
  for (const pattern of patterns) {
    const match = clean.match(pattern);
    if (match && typeof match.index === 'number') {
      const start = Math.max(0, match.index - 120);
      const end = Math.min(clean.length, match.index + match[0].length + 160);
      return shortText(clean.slice(start, end), 220);
    }
  }
  return '';
}

function extractTranscriptIntelligence(transcriptText = '', metrics = {}) {
  const clean = cleanTranscript(transcriptText).slice(0, 12000);
  const themes = [];
  if (clean) {
    for (const rule of TRANSCRIPT_THEME_RULES) {
      let score = 0;
      for (const pattern of rule.patterns) {
        const matches = clean.match(new RegExp(pattern.source, pattern.flags.includes('g') ? pattern.flags : `${pattern.flags}g`));
        if (matches?.length) score += matches.length;
      }
      const evidence = score ? findEvidence(clean, rule.patterns) : '';
      if (score && evidence) themes.push({
        key: rule.key,
        area: rule.area,
        title: rule.title,
        priority: rule.priority,
        currentRead: rule.currentRead,
        status: rule.status,
        leadershipMove: rule.leadershipMove,
        talkSection: rule.talkSection,
        evidence,
        score
      });
    }
  }

  const ranked = themes.sort((a, b) => b.score - a.score).slice(0, 7);
  return {
    available: ranked.length > 0,
    transcriptCharsReviewed: clean.length,
    themes: ranked,
    summary: ranked.map((t) => `${t.area}: ${t.evidence}`).slice(0, 6)
  };
}

function themeByKey(transcriptIntel, key) {
  return transcriptIntel?.themes?.find((t) => t.key === key);
}

function firstTheme(transcriptIntel, keys = []) {
  return keys.map((key) => themeByKey(transcriptIntel, key)).find(Boolean);
}

function defaultPriorityTemplates(metrics = {}) {
  return [
    { area: 'Volume & Credit Conversion', priority: 'Build a weekly view of leads, approvals, turndowns, sold units, and lost opportunities each week.', currentRead: `${(metrics.unitSales || 0).toLocaleString()} units`, status: metrics.nopMargin < 3 ? 'ACTION' : 'WATCH', leadershipMove: 'Inspect lead and credit flow weekly.' },
    { area: 'Major-unit profit bridge', priority: 'Bridge discounts, freight, floorplan, and selling expense to unit gross profit.', currentRead: pct(metrics.frontEndGpMargin), status: metrics.frontEndGpMargin < 8 ? 'ACTION' : 'WATCH', leadershipMove: 'Review deal structure by brand.' },
    { area: 'F&I / Credit', priority: 'Connect early F&I introduction, lender mix, and payment-fit review.', currentRead: `${money(metrics.fAndIPvr)} PVR`, status: metrics.fAndIPvr < 400 ? 'ACTION' : 'WATCH', leadershipMove: 'Inspect accepts, declines, and lender fit.' },
    { area: 'Fixed ops throughput', priority: 'Turn RO activity and parts demand into retention and throughput routines.', currentRead: `${(metrics.service?.roCount || 0).toLocaleString()} ROs`, status: 'WATCH', leadershipMove: 'Track RECT, parts delays, and bay flow.' },
    { area: 'Department scorecards', priority: 'Define KPI ownership for sales, F&I, parts, service, inventory, and follow-up.', currentRead: metrics.sourceCounts?.transcriptCharacters ? 'Context available' : 'Context not provided', status: 'ACTION', leadershipMove: 'Assign owners before the next review.' }
  ];
}

function buildTranscriptPriorities(metrics, transcriptIntel) {
  const defaults = defaultPriorityTemplates(metrics);
  if (!transcriptIntel?.themes?.length) return defaults;
  const priorityOrder = ['marketShare', 'qualifiedVolume', 'creditFi', 'budgetSeasonality', 'leadershipScorecards', 'systemsCrm', 'serviceCapacity', 'inventoryCapital', 'partsAttachment', 'trustLegacy', 'marginPricing'];
  const byKey = new Map(transcriptIntel.themes.map((t) => [t.key, t]));
  const selected = [];
  for (const key of priorityOrder) {
    const theme = byKey.get(key);
    if (!theme) continue;
    selected.push({
      area: theme.area,
      priority: theme.priority,
      currentRead: theme.currentRead,
      status: theme.status,
      leadershipMove: theme.leadershipMove
    });
    if (selected.length >= 5) break;
  }
  for (const item of defaults) {
    if (selected.length >= 5) break;
    if (!selected.some((p) => p.area.toLowerCase() === item.area.toLowerCase())) selected.push(item);
  }
  return selected.slice(0, 5);
}

function buildTranscriptWigTakeaways(metrics, transcriptIntel) {
  const themes = transcriptIntel?.themes || [];
  if (!themes.length) return null;
  return themes.slice(0, 3).map((theme) => ({ title: theme.title, body: shortText(theme.priority, 116) }));
}

function buildTranscriptMandate(metrics, transcriptIntel) {
  if (!transcriptIntel?.themes?.length) return null;
  const volume = firstTheme(transcriptIntel, ['qualifiedVolume', 'creditFi']);
  const market = firstTheme(transcriptIntel, ['marketShare', 'inventoryCapital', 'marginPricing']);
  const leadership = firstTheme(transcriptIntel, ['leadershipScorecards', 'systemsCrm', 'budgetSeasonality', 'trustLegacy']);
  return [
    { title: volume?.title || 'Create qualified swings', body: shortText(volume?.priority || 'Grow unit count through lead quality, credit visibility, and disciplined follow-up.', 82) },
    { title: market?.title || 'Protect profit conversion', body: shortText(market?.priority || `Connect ${money(metrics.grossProfit)} gross profit to ${money(metrics.netOperatingProfit)} NOP.`, 82) },
    { title: leadership?.title || 'Make ownership measurable', body: shortText(leadership?.priority || 'Use scorecards to move managers from tasks to outcomes.', 82) }
  ];
}

function buildTranscriptFinalNarrative(metrics, transcriptIntel) {
  if (!transcriptIntel?.themes?.length) return null;
  const themes = transcriptIntel.themes;
  return [
    { title: themes[0]?.title || 'Transcript priorities are clear', body: shortText(themes[0]?.priority || 'The owner conversation should drive the next operating review.', 82) },
    { title: themes[1]?.title || 'Growth needs a system', body: shortText(themes[1]?.priority || 'Volume, credit, inventory, F&I, and fixed ops need one operating rhythm.', 82) },
    { title: themes[2]?.title || 'Scorecards drive action', body: shortText(themes[2]?.priority || 'Department owners should bring actions, variances, and next steps.', 82) }
  ];
}

function buildTranscriptTalkSections(baseSections, metrics, transcriptIntel) {
  if (!transcriptIntel?.themes?.length) return baseSections;
  const bySection = new Map();
  for (const theme of transcriptIntel.themes) {
    const list = bySection.get(theme.talkSection) || [];
    list.push(theme);
    bySection.set(theme.talkSection, list);
  }
  return baseSections.map((section) => {
    const themes = bySection.get(section.title) || [];
    if (!themes.length) return section;
    const primary = themes[0];
    const secondary = themes[1];
    return {
      ...section,
      hits: [
        shortText(primary.evidence || primary.priority, 96),
        section.hits?.[0] || 'The report creates a practical fact base for action.'
      ].slice(0, 2),
      risks: [
        shortText(primary.priority, 104),
        secondary ? shortText(secondary.priority, 104) : section.risks?.[0]
      ].filter(Boolean).slice(0, 2),
      questions: [
        primary.key === 'marketShare' ? 'What does county-level registration data show by OEM and category?' :
        primary.key === 'creditFi' ? 'Where are deals failing most often: score, down payment, lender fit, trade equity, or follow-up?' :
        primary.key === 'serviceCapacity' ? 'Where do ROs wait on parts, approval, technician flow, or capacity?' :
        primary.key === 'leadershipScorecards' ? 'Who owns each weekly KPI and what result should change?' :
        'What specific weekly action should prove this priority is moving?',
        section.questions?.[0] || 'What should be reviewed before the next HHOS meeting?'
      ].slice(0, 2)
    };
  });
}

function applyTranscriptIntelligenceToAnalysis(base, metrics, transcriptIntel) {
  if (!transcriptIntel?.themes?.length) return base;
  const wigTakeaways = buildTranscriptWigTakeaways(metrics, transcriptIntel);
  const executiveMandate = buildTranscriptMandate(metrics, transcriptIntel);
  const finalNarrative = buildTranscriptFinalNarrative(metrics, transcriptIntel);
  return {
    ...base,
    wigTakeaways: wigTakeaways || base.wigTakeaways,
    leadershipPriorities: buildTranscriptPriorities(metrics, transcriptIntel),
    executiveMandate: executiveMandate || base.executiveMandate,
    talkTrackSections: buildTranscriptTalkSections(base.talkTrackSections, metrics, transcriptIntel),
    finalNarrative: finalNarrative || base.finalNarrative,
    _transcriptThemes: transcriptIntel.themes.map((t) => ({ area: t.area, title: t.title, evidence: t.evidence }))
  };
}

function fallbackAnalysis(metrics = {}, transcriptIntel = null) {
  const bestDepartment = [...(metrics.departments || [])].sort((a, b) => (b.directNop || 0) - (a.directNop || 0))[0];
  const bestOem = [...(metrics.oems || [])].sort((a, b) => (b.frontEndGp || 0) - (a.frontEndGp || 0))[0];
  const base = {
    executiveRead: [
      `Revenue reached ${money(metrics.revenue)} across ${(metrics.unitSales || 0).toLocaleString()} retailed units.`,
      `The store retained ${money(metrics.netOperatingProfit)} of NOP, or ${pct(metrics.nopMargin)}, on a ${pct(metrics.grossMargin)} gross margin.`,
      bestDepartment ? `${bestDepartment.department} is the strongest direct-profit pocket at ${money(bestDepartment.directNop)} of direct NOP.` : `Department detail should be reviewed once the GL mapping is complete.`,
      `Service, P&A, F&I, and major-unit margin should be reviewed together so leadership can separate volume from profit quality.`
    ],
    executiveTakeaways: [
      { title: metrics.nopMargin >= 3 ? 'Profit is positive' : 'Profit needs attention', body: `NOP finished at ${money(metrics.netOperatingProfit)}, or ${pct(metrics.nopMargin)}, for the selected period.` },
      { title: bestDepartment ? `${bestDepartment.department} is the profit lever` : 'Department mapping matters', body: bestDepartment ? `${bestDepartment.department} produced ${money(bestDepartment.directNop)} in direct NOP.` : 'Confirm department mapping before final management review.' },
      { title: 'Systems and cadence matter', body: 'Use this report to create a recurring review of margin, F&I, fixed ops, inventory, and follow-up discipline.' }
    ],
    wigTakeaways: [
      { title: 'Margin is the WIG', body: `Front-end GP margin is ${pct(metrics.frontEndGpMargin)} and should be inspected by brand, category, and deal structure.` },
      { title: 'F&I is a process opportunity', body: `F&I PVR is ${money(metrics.fAndIPvr)}; scripts, early introduction, and acceptance review should be practiced weekly.` },
      { title: 'Service is operational', body: `RO count is ${(metrics.service?.roCount || 0).toLocaleString()}; review throughput, RECT, and bay flow.` }
    ],
    financialTakeaways: [
      { title: 'Gross margin is visible', body: `Gross profit was ${money(metrics.grossProfit)}, or ${pct(metrics.grossMargin)}, on ${money(metrics.revenue)} of revenue.` },
      { title: 'NOP is the baseline', body: `The store retained ${money(metrics.netOperatingProfit)} after ${money(metrics.operatingExpenses)} in operating expenses.` },
      { title: 'Capital needs reconciliation', body: 'Inventory and floorplan balances should be reconciled to schedules before cash-planning decisions.' }
    ],
    trendTakeaways: [
      { title: 'Seasonality is visible', body: 'Compare high-volume months against margin and NOP rather than volume alone.' },
      { title: 'Profit varies by mix', body: 'Review NOP next to margin, trade quality, floorplan interest, and service throughput.' },
      { title: 'Use the trend operationally', body: 'Turn monthly trend movement into a recurring leadership inspection rhythm.' }
    ],
    departmentTakeaways: [
      { title: bestDepartment ? `${bestDepartment.department} leads contribution` : 'Contribution needs mapping', body: bestDepartment ? `${bestDepartment.department} produced ${money(bestDepartment.directNop)} in direct NOP.` : 'Department contribution should be validated with mapped GL detail.' },
      { title: 'Fixed ops matters', body: `Service and P&A generated ${money((metrics.service?.grossProfit || 0) + (metrics.parts?.grossProfit || 0))} in combined gross profit.` },
      { title: 'Unit margin needs rigor', body: `Front-end GP margin is ${pct(metrics.frontEndGpMargin)}.` }
    ],
    inventoryTakeaways: [
      { title: 'Inventory supports growth', body: 'Capital planning should be category-specific and tied to turns, aged inventory, and sales velocity.' },
      { title: 'Floorplan cost is real', body: `Floorplan interest was ${money(metrics.capital?.floorplanInterest)} for the selected period.` },
      { title: 'Facility affects capital', body: 'Facility, inventory, service capacity, and cash planning should be reviewed together.' }
    ],
    fixedOpsTakeaways: [
      { title: 'Service is productive', body: `Service generated ${money(metrics.service?.revenue)} in RO revenue.` },
      { title: 'Parts is a stabilizer', body: `P&A generated ${money(metrics.parts?.grossProfit)} in gross profit.` },
      { title: 'F&I needs process', body: `F&I PVR is ${money(metrics.fAndIPvr)}.` }
    ],
    oemTakeaways: [
      { title: bestOem ? `${bestOem.make} leads GP` : 'OEM detail needs review', body: bestOem ? `${bestOem.make} produced ${money(bestOem.frontEndGp)} of front-end GP.` : 'OEM contribution is unavailable or low-detail in the uploaded data.' },
      { title: 'Mix matters', body: 'Compare units, revenue, and margin before making stocking decisions.' },
      { title: 'Set category rules', body: 'Use clear aging, stocking, and exit rules for lower-contribution categories.' }
    ],
    leadershipPriorities: [
      { area: 'Volume & Credit Conversion', priority: 'Track leads, approvals, turndowns, sold units, and lost opportunities each week.', currentRead: `${(metrics.unitSales || 0).toLocaleString()} units`, status: metrics.nopMargin < 3 ? 'ACTION' : 'WATCH', leadershipMove: 'Inspect lead and credit flow weekly.' },
      { area: 'Major-unit profit bridge', priority: 'Bridge discounts, freight, floorplan, and selling expense to unit gross profit.', currentRead: pct(metrics.frontEndGpMargin), status: metrics.frontEndGpMargin < 8 ? 'ACTION' : 'WATCH', leadershipMove: 'Review deal structure by brand.' },
      { area: 'F&I / Credit', priority: 'Connect early F&I introduction, lender mix, and payment-fit review.', currentRead: `${money(metrics.fAndIPvr)} PVR`, status: metrics.fAndIPvr < 400 ? 'ACTION' : 'WATCH', leadershipMove: 'Inspect accepts, declines, and lender fit.' },
      { area: 'Fixed ops throughput', priority: 'Turn RO activity and parts demand into retention and throughput routines.', currentRead: `${(metrics.service?.roCount || 0).toLocaleString()} ROs`, status: 'WATCH', leadershipMove: 'Track RECT, parts delays, and bay flow.' },
      { area: 'Department scorecards', priority: 'Define KPI ownership for sales, F&I, parts, service, inventory, and follow-up.', currentRead: metrics.sourceCounts?.transcriptCharacters ? 'Context available' : 'Context not provided', status: 'ACTION', leadershipMove: 'Assign owners before the next review.' }
    ],
    executiveMandate: [
      { title: 'Protect profit conversion', body: `Connect ${money(metrics.grossProfit)} gross profit to ${money(metrics.netOperatingProfit)} NOP.` },
      { title: 'Create qualified swings', body: 'Grow unit count through lead quality, credit visibility, and follow-up discipline.' },
      { title: 'Make ownership measurable', body: 'Use scorecards to move managers from tasks to outcomes.' }
    ],
    talkTrackSections: [
      { title: 'Sales / Inventory', hits: ['The store has a real selling base to work from.', 'Inventory can support growth if capital follows contribution.'], risks: ['Volume may not convert if deal structure is weak.', 'Floorplan and aged inventory can absorb margin.'], questions: ['Which brands deserve more capital?', 'Where are price, trade, freight, or floorplan costs absorbing margin?'] },
      { title: 'F&I / Credit', hits: ['F&I has a measurable PVR baseline.', 'Credit review can create better visibility into lost opportunities.'], risks: ['Declines and payment-fit issues can become invisible.', 'Cash buyers may miss appropriate attachment options.'], questions: ['Where are deals failing most often?', 'Are cash and declined customers still shown relevant options?'] },
      { title: 'Service / Parts', hits: ['RO activity supports retention beyond the initial sale.', 'Parts demand shows attachment potential.'], risks: ['Direct expenses can offset gross activity.', 'Parts delays and capacity constraints weaken trust.'], questions: ['Which P&A categories create true profit?', 'Where do ROs wait on parts, approval, or capacity?'] },
      { title: 'Leadership / Systems', hits: ['The report creates a common fact base for action.', 'A weekly cadence can connect departments.'], risks: ['Titles do not create accountability without scorecards.', 'Annual goals must become monthly targets.'], questions: ['Who owns each weekly KPI?', 'What should be reviewed before the next HHOS meeting?'] }
    ],
    finalNarrative: [
      { title: 'Profit quality is the issue', body: 'Revenue scale must convert into repeatable operating profit.' },
      { title: 'Growth needs a system', body: 'Volume, credit, inventory, F&I, and fixed ops need one operating rhythm.' },
      { title: 'Scorecards drive the next review', body: 'Department owners should bring actions, variances, and next steps.' }
    ],
    executiveTalkTrack: [
      `The executive discussion should start with the baseline: ${metrics.dealerName || 'the dealer'} generated ${money(metrics.revenue)} in revenue and retained ${money(metrics.netOperatingProfit)} in net operating profit for ${metrics.periodLabel}. That gives the team a clear fact base before the conversation moves into department execution.`,
      `The next question is profit quality. Gross margin finished at ${pct(metrics.grossMargin)} and front-end GP margin finished at ${pct(metrics.frontEndGpMargin)}. Leadership should inspect whether volume is being created through healthy pricing, good trade decisions, disciplined fees, and the right brand/category mix.`,
      bestDepartment ? `${bestDepartment.department} should be treated as a proof point. It produced ${money(bestDepartment.directNop)} of direct NOP, which gives the team a practical place to identify what is working and where similar discipline can be repeated.` : `Department contribution should be reviewed carefully because the available data does not yet point to one obvious direct-profit engine.`,
      `Fixed ops and F&I should be discussed as management systems, not just report lines. Service throughput, parts attachment, F&I introduction, and customer follow-up all require a cadence that can be practiced, measured, and inspected.`,
      `The final leadership move is to convert this report into next-month action: one margin inspection, one F&I process inspection, one fixed-ops throughput inspection, and one systems/CRM follow-up. The value of the report is the operating rhythm it creates after the meeting.`
    ]
  };
  return applyTranscriptIntelligenceToAnalysis(base, metrics, transcriptIntel);
}


function safeError(error) {
  const status = error?.status ? `status ${error.status}` : null;
  const code = error?.code ? `code ${error.code}` : null;
  const type = error?.type ? `type ${error.type}` : null;
  const message = error?.message || String(error || 'Unknown error');
  return [status, code, type, message].filter(Boolean).join(' | ');
}

function configuredModel() {
  return String(process.env.OPENAI_MODEL || 'gpt-4.1-mini').trim();
}

function aiTimeoutMs() {
  // Keep this below the common CDN/proxy inactivity window for synchronous Netlify Functions.
  // If OpenAI has not responded by then, return fallback JSON instead of letting Netlify return a 504 HTML page.
  const configured = Number(process.env.AI_TIMEOUT_MS || 22000);
  return Number.isFinite(configured) ? Math.max(5000, Math.min(configured, 24000)) : 22000;
}

function aiMaxOutputTokens() {
  // v26 uses a compact transcript-intelligence schema, so a smaller output budget is enough and avoids runaway completions.
  const configured = Number(process.env.AI_MAX_OUTPUT_TOKENS || 4000);
  return Number.isFinite(configured) ? Math.max(1800, Math.min(configured, 5000)) : 4000;
}

function compactService(service = {}) {
  return {
    roCount: service.roCount,
    warrantyRate: service.warrantyRate,
    revenue: service.revenue,
    cost: service.cost,
    grossProfit: service.grossProfit,
    monthly: Array.isArray(service.monthly) ? service.monthly.slice(0, 12).map((m) => ({ month: m.month, revenue: m.revenue })) : []
  };
}

function compactParts(parts = {}) {
  return {
    invoiceCount: parts.invoiceCount,
    revenue: parts.revenue,
    cost: parts.cost,
    grossProfit: parts.grossProfit,
    monthly: Array.isArray(parts.monthly) ? parts.monthly.slice(0, 12).map((m) => ({ month: m.month, revenue: m.revenue })) : []
  };
}

function compactCapital(capital = {}) {
  return {
    inventory: capital.inventory,
    newInventory: capital.newInventory,
    usedInventory: capital.usedInventory,
    partsInventory: capital.partsInventory,
    floorplanBalance: capital.floorplanBalance,
    floorplanInterest: capital.floorplanInterest,
    cash: capital.cash
  };
}

function compactMetricsForAi(metrics = {}) {
  return {
    dealerName: metrics.dealerName,
    periodLabel: metrics.periodLabel,
    revenue: metrics.revenue,
    grossProfit: metrics.grossProfit,
    grossMargin: metrics.grossMargin,
    operatingExpenses: metrics.operatingExpenses,
    netOperatingProfit: metrics.netOperatingProfit,
    nopMargin: metrics.nopMargin,
    unitSales: metrics.unitSales,
    newUnits: metrics.newUnits,
    usedUnits: metrics.usedUnits,
    frontEndGpMargin: metrics.frontEndGpMargin,
    fAndIPvr: metrics.fAndIPvr,
    financePenetration: metrics.financePenetration,
    service: compactService(metrics.service),
    parts: compactParts(metrics.parts),
    capital: compactCapital(metrics.capital),
    monthly: Array.isArray(metrics.monthly) ? metrics.monthly.slice(0, 12).map((m) => ({
      month: m.month,
      revenue: m.revenue,
      grossProfit: m.grossProfit,
      netOperatingProfit: m.netOperatingProfit,
      unitSales: m.unitSales
    })) : [],
    departments: Array.isArray(metrics.departments) ? metrics.departments.slice(0, 6).map((d) => ({
      department: d.department,
      revenue: d.revenue,
      grossProfit: d.grossProfit,
      directExpense: d.directExpense,
      directNop: d.directNop,
      gpMargin: d.gpMargin,
      nopMargin: d.nopMargin
    })) : [],
    oems: Array.isArray(metrics.oems) ? metrics.oems.slice(0, 6).map((o) => ({
      make: o.make,
      units: o.units,
      revenue: o.revenue,
      frontEndGp: o.frontEndGp,
      frontEndGpMargin: o.frontEndGpMargin,
      inventory: o.inventory
    })) : []
  };
}

function extractResponseText(data = {}) {
  if (typeof data.output_text === 'string' && data.output_text.trim()) return data.output_text;
  const parts = [];
  for (const item of data.output || []) {
    for (const content of item.content || []) {
      if (typeof content.text === 'string') parts.push(content.text);
    }
  }
  return parts.join('');
}

async function openAiFetch(path, apiKey, bodyOrNull, timeoutMs) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(`https://api.openai.com/v1${path}`, {
      method: bodyOrNull ? 'POST' : 'GET',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        ...(bodyOrNull ? { 'Content-Type': 'application/json' } : {})
      },
      body: bodyOrNull ? JSON.stringify(bodyOrNull) : undefined,
      signal: controller.signal
    });
    const text = await response.text();
    let data = null;
    try { data = text ? JSON.parse(text) : null; } catch { data = null; }
    if (!response.ok) {
      const message = data?.error?.message || text || `${response.status} ${response.statusText}`;
      const err = new Error(message);
      err.status = response.status;
      err.code = data?.error?.code;
      err.type = data?.error?.type;
      throw err;
    }
    return data;
  } finally {
    clearTimeout(timeout);
  }
}

function truncateText(value, max = 80) {
  return shortText(value, max);
}

function inflateCompactAi(compact = {}, metrics = {}, transcriptIntel = null) {
  const fallback = fallbackAnalysis(metrics, transcriptIntel);
  const read = Array.isArray(compact.executiveRead) && compact.executiveRead.length >= 4
    ? compact.executiveRead.slice(0, 4).map((x, i) => truncateText(x, 112) || fallback.executiveRead[i])
    : fallback.executiveRead;

  const priorityInsights = Array.isArray(compact.priorityInsights) ? compact.priorityInsights : [];
  const leadershipPriorities = fallback.leadershipPriorities.map((item, i) => ({
    ...item,
    priority: truncateText(priorityInsights[i] || item.priority, 84)
  }));

  const mandate = Array.isArray(compact.mandate) ? compact.mandate : [];
  const executiveMandate = fallback.executiveMandate.map((item, i) => ({
    title: item.title,
    body: truncateText(mandate[i] || item.body, 74)
  }));

  const talkGuidance = Array.isArray(compact.talkGuidance) ? compact.talkGuidance : [];
  const talkTrackSections = fallback.talkTrackSections.map((section, i) => ({
    ...section,
    hits: [truncateText(talkGuidance[i] || section.hits[0], 104), section.hits[1]]
  }));

  const finalNarrativeInput = Array.isArray(compact.finalNarrative) ? compact.finalNarrative : [];
  const finalNarrative = fallback.finalNarrative.map((item, i) => ({
    title: item.title,
    body: truncateText(finalNarrativeInput[i] || item.body, 74)
  }));

  return {
    ...fallback,
    executiveRead: read,
    leadershipPriorities,
    executiveMandate,
    talkTrackSections,
    finalNarrative
  };
}

async function createStructuredReport(apiKey, model, metrics, transcriptText, transcriptIntel, timeoutMs) {
  const isReasoningModel = /^gpt-5|^o\d/i.test(String(model || ''));
  const body = {
    model,
    instructions: [
      'You write concise HerohubOS executive insights for dealer performance reports.',
      'Return only compact JSON matching the schema. No markdown. No extra keys.',
      'Use the metrics exactly as provided. Do not invent numbers.',
      'Write short, practical executive language. Avoid repeating the same idea.',
      'Each string must be one complete sentence. Never end a string with dangling words such as with, for, to, of, and, or, then, because, or so.',
      'Use transcriptIntelligence as the primary source for WIGs, leadership priorities, talk-track guidance, and the final narrative when themes are available.'
    ].join('\n'),
    input: JSON.stringify({
      metrics: compactMetricsForAi(metrics),
      transcriptIntelligence: transcriptIntel || extractTranscriptIntelligence(transcriptText, metrics),
      transcriptContext: String(transcriptText || '').replace(/\s+/g, ' ').slice(0, 900)
    }),
    max_output_tokens: aiMaxOutputTokens(),
    ...(isReasoningModel ? { reasoning: { effort: 'none' } } : {}),
    text: {
      format: {
        type: 'json_schema',
        name: 'herohub_compact_report_insights',
        schema: compactSchema,
        strict: true
      }
    }
  };
  const data = await openAiFetch('/responses', apiKey, body, timeoutMs);
  if (data?.status === 'incomplete') {
    const reason = data?.incomplete_details?.reason || 'unknown';
    const err = new Error(`OpenAI response was incomplete (${reason}). v26 compact transcript-intelligence schema should normally fit; reduce AI_MAX_OUTPUT_TOKENS only if timeouts occur or use gpt-4.1-mini.`);
    err.code = 'OPENAI_INCOMPLETE';
    throw err;
  }
  return extractResponseText(data) || '{}';
}

function parseAiJson(text) {
  const cleaned = String(text || '')
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```$/i, '')
    .trim();
  try {
    return JSON.parse(cleaned || '{}');
  } catch (error) {
    const preview = cleaned.slice(Math.max(0, cleaned.length - 240));
    const err = new Error(`AI returned incomplete or malformed JSON: ${error.message}. Output length ${cleaned.length}. Tail: ${preview}`);
    err.code = 'AI_JSON_PARSE';
    throw err;
  }
}

const compactSchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    executiveRead: {
      type: 'array',
      minItems: 4,
      maxItems: 4,
      items: { type: 'string' }
    },
    priorityInsights: {
      type: 'array',
      minItems: 5,
      maxItems: 5,
      items: { type: 'string' }
    },
    mandate: {
      type: 'array',
      minItems: 3,
      maxItems: 3,
      items: { type: 'string' }
    },
    talkGuidance: {
      type: 'array',
      minItems: 4,
      maxItems: 4,
      items: { type: 'string' }
    },
    finalNarrative: {
      type: 'array',
      minItems: 3,
      maxItems: 3,
      items: { type: 'string' }
    }
  },
  required: ['executiveRead', 'priorityInsights', 'mandate', 'talkGuidance', 'finalNarrative']
};

async function innerHandler(event) {
  if (event.httpMethod === 'GET') {
    const key = String(process.env.OPENAI_API_KEY || '').trim();
    const model = configuredModel();
    if (!key) {
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ok: false, keyConfigured: false, model, timeoutMs: aiTimeoutMs(), maxOutputTokens: aiMaxOutputTokens(), version: FUNCTION_VERSION, message: 'OPENAI_API_KEY is not configured for this Netlify Function.' })
      };
    }
    try {
      await openAiFetch(`/models/${encodeURIComponent(model)}`, key, null, 5000);
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ok: true, keyConfigured: true, model, timeoutMs: aiTimeoutMs(), maxOutputTokens: aiMaxOutputTokens(), version: FUNCTION_VERSION, message: 'OpenAI key and model access look good.' })
      };
    } catch (error) {
      console.error(error);
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ok: false, keyConfigured: true, model, timeoutMs: aiTimeoutMs(), maxOutputTokens: aiMaxOutputTokens(), version: FUNCTION_VERSION, message: safeError(error) })
      };
    }
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method not allowed' };
  }

  let payload;
  try {
    payload = JSON.parse(event.body || '{}');
  } catch {
    return { statusCode: 400, body: 'Invalid JSON body.' };
  }

  const metrics = payload.metrics || {};
  const transcriptIntel = extractTranscriptIntelligence(payload.transcriptText || '', metrics);
  const fallback = fallbackAnalysis(metrics, transcriptIntel);
  const key = String(process.env.OPENAI_API_KEY || '').trim();
  if (!key) {
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...fallback, _transcriptThemes: transcriptIntel.themes, _warning: 'OPENAI_API_KEY is not configured for this Netlify Function; using fallback analysis.' })
    };
  }

  const timeoutMs = aiTimeoutMs();
  const primaryModel = configuredModel();
  // Try only one model. Multiple retries can push Netlify's function over its timeout and cause a platform 500.
  const modelsToTry = [primaryModel];
  const errors = [];
  const startedAt = Date.now();

  for (const model of modelsToTry) {
    const remaining = timeoutMs - (Date.now() - startedAt);
    if (remaining < 1200) {
      errors.push(`${model}: skipped because the function was near its AI timeout budget`);
      break;
    }
    try {
      const text = await createStructuredReport(key, model, metrics, payload.transcriptText || '', transcriptIntel, Math.min(remaining, timeoutMs));
      const parsed = parseAiJson(text || '{}');
      const inflated = inflateCompactAi(parsed, metrics, transcriptIntel);
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...inflated, _model: model, _transcriptThemes: transcriptIntel.themes })
      };
    } catch (error) {
      console.error(error);
      errors.push(`${model}: ${safeError(error)}`);
      if (String(error?.name || '').toLowerCase().includes('abort') || String(error?.code || '').toUpperCase().includes('TIMEOUT')) break;
    }
  }

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...fallback, _transcriptThemes: transcriptIntel.themes, _warning: `AI request failed; using fallback analysis. ${errors.join(' || ')}` })
  };
}


export async function handler(event) {
  try {
    return await innerHandler(event);
  } catch (error) {
    console.error('Unhandled analyze function error:', error);
    let fallback = fallbackAnalysis({});
    try {
      const payload = JSON.parse(event?.body || '{}');
      fallback = fallbackAnalysis(payload.metrics || {}, extractTranscriptIntelligence(payload.transcriptText || '', payload.metrics || {}));
    } catch {}
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...fallback, _warning: `AI function recovered after an internal error; using fallback analysis. ${safeError(error)}` })
    };
  }
}
