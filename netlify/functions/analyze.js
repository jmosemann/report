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

const FUNCTION_VERSION = 'v24';

function fallbackAnalysis(metrics = {}) {
  const bestDepartment = [...(metrics.departments || [])].sort((a, b) => (b.directNop || 0) - (a.directNop || 0))[0];
  const bestOem = [...(metrics.oems || [])].sort((a, b) => (b.frontEndGp || 0) - (a.frontEndGp || 0))[0];
  return {
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
}


function safeError(error) {
  const status = error?.status ? `status ${error.status}` : null;
  const code = error?.code ? `code ${error.code}` : null;
  const type = error?.type ? `type ${error.type}` : null;
  const message = error?.message || String(error || 'Unknown error');
  return [status, code, type, message].filter(Boolean).join(' | ');
}

function configuredModel() {
  return String(process.env.OPENAI_MODEL || 'gpt-4.1-nano').trim();
}

function aiTimeoutMs() {
  // Keep this below the common CDN/proxy inactivity window for synchronous Netlify Functions.
  // If OpenAI has not responded by then, return fallback JSON instead of letting Netlify return a 504 HTML page.
  const configured = Number(process.env.AI_TIMEOUT_MS || 22000);
  return Number.isFinite(configured) ? Math.max(5000, Math.min(configured, 24000)) : 22000;
}

function aiMaxOutputTokens() {
  // Keep output compact so the AI call can finish before Netlify's synchronous request goes idle.
  const configured = Number(process.env.AI_MAX_OUTPUT_TOKENS || 6000);
  return Number.isFinite(configured) ? Math.max(3200, Math.min(configured, 8000)) : 6000;
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
    service: metrics.service,
    parts: metrics.parts,
    capital: metrics.capital,
    monthly: Array.isArray(metrics.monthly) ? metrics.monthly.slice(0, 14).map((m) => ({
      month: m.month,
      revenue: m.revenue,
      grossProfit: m.grossProfit,
      netOperatingProfit: m.netOperatingProfit,
      unitSales: m.unitSales
    })) : [],
    departments: Array.isArray(metrics.departments) ? metrics.departments.slice(0, 8) : [],
    oems: Array.isArray(metrics.oems) ? metrics.oems.slice(0, 8) : [],
    sourceCounts: metrics.sourceCounts
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

async function createStructuredReport(apiKey, model, metrics, transcriptText, timeoutMs) {
  const isReasoningModel = /^gpt-5|^o\d/i.test(String(model || ''));
  const body = {
    model,
    instructions: [
      'You write HerohubOS executive performance report analysis for powersports, OPE, marine, RV, and dealer networks.',
      'Use a dealer-first, executive-ready tone. Be concise, practical, and grounded in the metrics.',
      'Never invent numbers that are not provided. When transcripts add context, use that context carefully.',
      'Respect the visual layout limits: takeaway titles must be short, takeaway bodies must be one sentence, leadership moves must be short action phrases, and talk-track paragraphs must be polished but compact.',
      'Return only valid JSON matching the schema. Do not include markdown, code fences, comments, or line breaks inside string values.',
      'Generate AI primarily for the executive read and pages 11 and 12. The other report pages use deterministic metric-based copy so the response stays small. Every field must be short enough to fit a fixed PDF layout.',
      'Prefer concrete business language over long narrative. Use short sentence fragments when appropriate. Titles should be 2-5 words. Body copy should usually be 8-14 words.',
      'Do not repeat the same title, question, or summary idea across the fields you return.'
    ].join('\n'),
    input: JSON.stringify({ metrics: compactMetricsForAi(metrics), transcriptText: String(transcriptText || '').slice(0, 600) }),
    max_output_tokens: aiMaxOutputTokens(),
    ...(isReasoningModel ? { reasoning: { effort: 'none' } } : {}),
    text: {
      format: {
        type: 'json_schema',
        name: 'herohub_report_analysis',
        schema,
        strict: true
      }
    }
  };
  const data = await openAiFetch('/responses', apiKey, body, timeoutMs);
  if (data?.status === 'incomplete') {
    const reason = data?.incomplete_details?.reason || 'unknown';
    const err = new Error(`OpenAI response was incomplete (${reason}). Increase AI_MAX_OUTPUT_TOKENS or reduce schema size.`);
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

const schema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    executiveRead: {
      type: 'array',
      items: { type: 'string', maxLength: 72 },
      minItems: 4,
      maxItems: 4
    },
    leadershipPriorities: {
      type: 'array',
      minItems: 5,
      maxItems: 5,
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          area: { type: 'string', maxLength: 28 },
          priority: { type: 'string', maxLength: 62 },
          currentRead: { type: 'string', maxLength: 34 },
          status: { type: 'string', enum: ['WATCH', 'ACTION', 'GOOD'] },
          leadershipMove: { type: 'string', maxLength: 42 }
        },
        required: ['area', 'priority', 'currentRead', 'status', 'leadershipMove']
      }
    },
    executiveMandate: { $ref: '#/$defs/takeawayArray' },
    talkTrackSections: {
      type: 'array',
      minItems: 4,
      maxItems: 4,
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          title: { type: 'string', maxLength: 24 },
          hits: { type: 'array', items: { type: 'string', maxLength: 48 }, minItems: 2, maxItems: 2 },
          risks: { type: 'array', items: { type: 'string', maxLength: 48 }, minItems: 2, maxItems: 2 },
          questions: { type: 'array', items: { type: 'string', maxLength: 52 }, minItems: 2, maxItems: 2 }
        },
        required: ['title', 'hits', 'risks', 'questions']
      }
    },
    finalNarrative: { $ref: '#/$defs/takeawayArray' }
  },
  required: ['executiveRead', 'leadershipPriorities', 'executiveMandate', 'talkTrackSections', 'finalNarrative'],
  $defs: {
    takeawayArray: {
      type: 'array',
      minItems: 3,
      maxItems: 3,
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          title: { type: 'string', maxLength: 22 },
          body: { type: 'string', maxLength: 56 }
        },
        required: ['title', 'body']
      }
    }
  }
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
  const fallback = fallbackAnalysis(metrics);
  const key = String(process.env.OPENAI_API_KEY || '').trim();
  if (!key) {
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...fallback, _warning: 'OPENAI_API_KEY is not configured for this Netlify Function; using fallback analysis.' })
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
      const text = await createStructuredReport(key, model, metrics, payload.transcriptText || '', Math.min(remaining, timeoutMs));
      const parsed = parseAiJson(text || '{}');
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...parsed, _model: model })
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
    body: JSON.stringify({ ...fallback, _warning: `AI request failed; using fallback analysis. ${errors.join(' || ')}` })
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
      fallback = fallbackAnalysis(payload.metrics || {});
    } catch {}
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...fallback, _warning: `AI function recovered after an internal error; using fallback analysis. ${safeError(error)}` })
    };
  }
}
