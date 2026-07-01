import React from 'react';
import {
  Activity,
  ArrowUpRight,
  BadgeDollarSign,
  Banknote,
  BarChart3,
  BriefcaseBusiness,
  Building2,
  CalendarCheck,
  CalendarDays,
  Car,
  ChartNoAxesCombined,
  CircleDollarSign,
  ClipboardCheck,
  ClipboardList,
  Cog,
  Crosshair,
  Database,
  FileBarChart,
  Gauge,
  Handshake,
  Landmark,
  LineChart,
  ListChecks,
  MapPinned,
  Megaphone,
  Package,
  PackageSearch,
  Puzzle,
  ReceiptText,
  Route,
  ScrollText,
  Settings,
  ShieldCheck,
  ShoppingCart,
  Signal,
  SlidersHorizontal,
  Sparkles,
  Store,
  Target,
  TimerReset,
  TrendingDown,
  TrendingUp,
  Truck,
  Users,
  WalletCards,
  Warehouse,
  Wrench
} from 'lucide-react';
import { formatMoney, formatPercent, formatCount } from '../lib/format.js';

const LOGO_SRC = `${import.meta.env.BASE_URL || '/'}herohub-os-logo.svg`;

const COLORS = {
  teal: '#18b9ad',
  purple: '#21164e',
  gold: '#f5ad2d',
  pink: '#e64c82',
  blue: '#4d72a7',
  gray: '#b8bac4',
  dark: '#0b0b0f'
};

function moneyTick(value) {
  const v = Number(value || 0);
  const abs = Math.abs(v);
  const sign = v < 0 ? '-' : '';
  if (abs >= 1_000_000) return `${sign}$${(abs / 1_000_000).toFixed(abs >= 10_000_000 ? 0 : 1)}M`;
  if (abs >= 1_000) return `${sign}$${Math.round(abs / 1000)}K`;
  return `${sign}$${abs}`;
}

function Header({ dealerName, label }) {
  return (
    <div className="report-header">
      <div className="dealer-name">{dealerName}</div>
      <div className="section-pill">{label}</div>
    </div>
  );
}

function Page({ children, className = '' }) {
  return <section className={`report-page ${className}`}>{children}</section>;
}

function TwoColumnPage({ dealerName, label, title, children, takeaways, iconSet = [] }) {
  return (
    <Page className="split-page">
      <div className="main-panel">
        <Header dealerName={dealerName} label={label} />
        <h1>{title}</h1>
        {children}
      </div>
      <TakeawayPanel takeaways={takeaways} iconSet={iconSet} />
    </Page>
  );
}

const TAKEAWAY_ICON_RULES = [
  { test: /service|fixed ops|repair|ro\b|bay|technician|throughput|capacity|labor|rect|customer-pay|warranty/i, icon: Wrench },
  { test: /parts|accessor|p&a|pg&a|pa&a|attachment|counter|invoice/i, icon: ShoppingCart },
  { test: /inventory aging|aged inventory|turn|stocking|overstock|recon|appraisal|used inventory/i, icon: Warehouse },
  { test: /inventory|floorplan|payable|capital|stock|cash planning|working capital|liquidity/i, icon: PackageSearch },
  { test: /cash|bank|cash flow|funding|liabilities|balance sheet/i, icon: Banknote },
  { test: /f&i|finance|pvr|penetration|acceptance|lender|credit|approval|down payment|payment/i, icon: WalletCards },
  { test: /crm|lightspeed|system|data|scorecard|reconciliation|reporting|dashboard|hhos|platform/i, icon: Database },
  { test: /trend|monthly|season|seasonality|trajectory|momentum|pattern|decline|increase|movement/i, icon: LineChart },
  { test: /volume|unit sales|unit count|retail|retailed|sold units|swings|leads/i, icon: ChartNoAxesCombined },
  { test: /margin|gross|profit|nop|expense|cost|operating leverage|loss|revenue|money/i, icon: CircleDollarSign },
  { test: /goal|wig|priority|target|focus|discipline|inspection|action|watch|mandate/i, icon: Target },
  { test: /leadership|manager|management|owner|ownership|accountability|cadence|rhythm/i, icon: Users },
  { test: /training|practice|script|coaching|talk track|roleplay|skill/i, icon: ClipboardCheck },
  { test: /oem|brand|brp|yamaha|polaris|can-am|sea-doo|honda|kawasaki|market share|registration/i, icon: Store },
  { test: /customer|trust|relationship|reputation|experience|retention|community/i, icon: Handshake },
  { test: /facility|bay|building|space|store|showroom/i, icon: Building2 },
  { test: /marketing|advertising|campaign|lead source|digital/i, icon: Megaphone },
  { test: /risk|constraint|pressure|problem|issue|watch|warning/i, icon: Gauge },
  { test: /process|workflow|routine|operating rhythm|weekly|monthly review/i, icon: ListChecks }
];

function pickTakeawayIcon(item = {}, fallback = Sparkles) {
  const text = `${item.title || ''} ${item.body || ''}`;
  const match = TAKEAWAY_ICON_RULES.find((rule) => rule.test.test(text));
  return match?.icon || fallback || Sparkles;
}

function TakeawayPanel({ takeaways = [], iconSet = [] }) {
  return (
    <aside className="takeaway-panel">
      <h3>Executive Takeaways</h3>
      <div className="takeaway-list">
        {takeaways.slice(0, 3).map((item, idx) => {
          const Icon = pickTakeawayIcon(item, iconSet[idx]);
          return (
            <div className="takeaway-item" key={`${item.title}-${idx}`}>
              <span className="takeaway-icon" aria-hidden="true">
                <Icon size={34} strokeWidth={1.65} />
              </span>
              <div className="takeaway-copy">
                <h4>{item.title}</h4>
                <p>{item.body}</p>
              </div>
            </div>
          );
        })}
      </div>
    </aside>
  );
}

function NumberedRail({ heading, items = [] }) {
  const list = (items || []).slice(0, 3);
  return (
    <aside className="takeaway-panel numbered-panel">
      <h3>{heading}</h3>
      <div className="numbered-list">
        {list.map((item, idx) => (
          <div className="numbered-item" key={`${heading}-${idx}`}>
            <span className="number-box">{idx + 1}</span>
            <div className="takeaway-copy">
              <h4>{item.title}</h4>
              <p>{item.body}</p>
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
}

function StatCard({ label, value, sub, accent = 'teal' }) {
  return (
    <div className="stat-card">
      <div className="stat-label">{label}</div>
      <div className="stat-value">{value}</div>
      <div className="stat-sub">{sub}</div>
      <span className={`stat-accent ${accent}`} />
    </div>
  );
}

function ChartCard({ title, children, wide = false }) {
  return (
    <div className={`chart-card ${wide ? 'wide' : ''}`}>
      <h4>{title}</h4>
      <div className="chart-wrap">{children}</div>
    </div>
  );
}

function DataTable({ columns, rows, note }) {
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>{columns.map((c) => <th key={c.key}>{c.label}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((row, idx) => (
            <tr key={idx}>{columns.map((c) => <td key={c.key}>{c.render ? c.render(row) : row[c.key]}</td>)}</tr>
          ))}
        </tbody>
      </table>
      {note ? <div className="table-note">{note}</div> : null}
    </div>
  );
}

function StatusPill({ value }) {
  const normalized = String(value || '').toLowerCase();
  const cls = normalized.includes('action') ? 'action' : normalized.includes('good') ? 'good' : 'watch';
  return <span className={`status ${cls}`}>{value}</span>;
}

function numericValues(data = [], keys = []) {
  return data.flatMap((row) => keys.map((key) => Number(row?.[key] || 0))).filter((value) => Number.isFinite(value));
}

function niceTicks(min, max, count = 5) {
  let lo = Number.isFinite(min) ? min : 0;
  let hi = Number.isFinite(max) ? max : 0;
  if (lo === hi) {
    const pad = Math.abs(hi || 1);
    lo -= pad;
    hi += pad;
  }
  if (lo > 0) lo = 0;
  if (hi < 0) hi = 0;
  const span = hi - lo || 1;
  const rawStep = span / Math.max(1, count - 1);
  const pow = Math.pow(10, Math.floor(Math.log10(rawStep)));
  const normalized = rawStep / pow;
  const niceStep = normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10;
  const step = niceStep * pow;
  const start = Math.floor(lo / step) * step;
  const end = Math.ceil(hi / step) * step;
  const ticks = [];
  for (let value = start; value <= end + step / 2; value += step) {
    ticks.push(Math.abs(value) < step / 1000 ? 0 : value);
  }
  return ticks.length >= 2 ? ticks : [0, end || step];
}

function valueFormatterForLabel(type) {
  if (type === 'units') return (v) => String(Math.round(Number(v || 0)));
  return moneyTick;
}

function splitChartLabel(label = '', maxChars = 12) {
  const clean = String(label || '').replace(/\s+/g, ' ').trim();
  if (!clean) return [''];
  if (clean.length <= maxChars) return [clean];
  const words = clean.split(' ');
  const lines = [];
  let current = '';
  words.forEach((word) => {
    const next = current ? `${current} ${word}` : word;
    if (next.length <= maxChars || !current) {
      current = next;
    } else {
      lines.push(current);
      current = word;
    }
  });
  if (current) lines.push(current);
  const clipped = lines.slice(0, 2);
  if (lines.length > 2) clipped[1] = `${clipped[1].slice(0, Math.max(4, maxChars - 1))}…`;
  return clipped;
}

function AxisLabel({ x, y, label, maxChars = 12 }) {
  const lines = splitChartLabel(label, maxChars);
  return (
    <text x={x} y={y} textAnchor="middle" className="chart-tick chart-x-tick">
      {lines.map((line, idx) => <tspan key={`${line}-${idx}`} x={x} dy={idx === 0 ? 0 : 13}>{line}</tspan>)}
    </text>
  );
}

function ChartLegend({ items }) {
  if (!items?.length) return null;
  return (
    <g className="chart-legend" transform="translate(470 18)">
      {items.map((item, idx) => (
        <g key={item.name} transform={`translate(${idx * 132} 0)`}>
          <line x1="0" y1="0" x2="24" y2="0" stroke={item.color} strokeWidth="4" strokeLinecap="round" />
          <text x="32" y="5">{item.name}</text>
        </g>
      ))}
    </g>
  );
}

function EmptyChart({ label = 'No chart data available' }) {
  return (
    <svg className="chart-svg" viewBox="0 0 720 250" role="img" aria-label={label} preserveAspectRatio="xMidYMid meet">
      <rect x="0" y="0" width="720" height="250" fill="#fff" />
      <text x="360" y="125" textAnchor="middle" className="chart-empty">{label}</text>
    </svg>
  );
}

function TrendChart({ data, lines = ['revenue', 'nop'] }) {
  const activeSeries = [
    { key: 'revenue', name: 'Revenue', color: COLORS.teal },
    { key: 'grossProfit', name: 'Gross Profit', color: COLORS.purple },
    { key: 'nop', name: 'NOP', color: COLORS.purple }
  ].filter((series) => lines.includes(series.key));

  const rows = (data || []).filter(Boolean);
  if (!rows.length || !activeSeries.length) return <EmptyChart />;

  const W = 720;
  const H = 250;
  const m = { top: 42, right: 24, bottom: 48, left: 78 };
  const plotW = W - m.left - m.right;
  const plotH = H - m.top - m.bottom;
  const values = numericValues(rows, activeSeries.map((series) => series.key));
  const ticks = niceTicks(Math.min(...values), Math.max(...values), 5);
  const yMin = ticks[0];
  const yMax = ticks[ticks.length - 1];
  const y = (value) => m.top + (1 - ((Number(value || 0) - yMin) / (yMax - yMin || 1))) * plotH;
  const x = (idx) => m.left + (rows.length === 1 ? plotW / 2 : (idx / (rows.length - 1)) * plotW);
  const zeroY = y(0);

  return (
    <svg className="chart-svg" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Trend chart" preserveAspectRatio="xMidYMid meet">
      <rect x="0" y="0" width={W} height={H} fill="#fff" />
      {ticks.map((tick) => {
        const ty = y(tick);
        return (
          <g key={tick}>
            <line x1={m.left} x2={W - m.right} y1={ty} y2={ty} className="chart-grid" />
            <text x={m.left - 12} y={ty + 4} textAnchor="end" className="chart-tick">{moneyTick(tick)}</text>
          </g>
        );
      })}
      <line x1={m.left} x2={W - m.right} y1={zeroY} y2={zeroY} className="chart-zero" />
      {rows.map((row, idx) => {
        const tx = x(idx);
        const show = rows.length <= 12 || idx % 2 === 0;
        return show ? <AxisLabel key={`${row.month}-${idx}`} x={tx} y={H - 31} label={row.month} maxChars={8} /> : null;
      })}
      <text x={m.left + plotW / 2} y={H - 6} textAnchor="middle" className="chart-axis-label">Month</text>
      <text x="18" y={m.top + plotH / 2} textAnchor="middle" className="chart-axis-label" transform={`rotate(-90 18 ${m.top + plotH / 2})`}>Dollars ($)</text>
      <ChartLegend items={activeSeries} />
      {activeSeries.map((series) => {
        const path = rows.map((row, idx) => `${idx === 0 ? 'M' : 'L'} ${x(idx)} ${y(row[series.key])}`).join(' ');
        return (
          <g key={series.key}>
            <path d={path} fill="none" stroke={series.color} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
            {rows.map((row, idx) => <circle key={idx} cx={x(idx)} cy={y(row[series.key])} r="4.5" fill="#fff" stroke={series.color} strokeWidth="3" />)}
          </g>
        );
      })}
    </svg>
  );
}

function BarMoneyChart({ data, dataKey, name, color = COLORS.teal, yLabel = 'Dollars ($)', valueType = 'money' }) {
  const rows = (data || []).filter(Boolean);
  if (!rows.length) return <EmptyChart />;

  const W = 720;
  const H = 250;
  const m = { top: 30, right: 22, bottom: 50, left: 78 };
  const plotW = W - m.left - m.right;
  const plotH = H - m.top - m.bottom;
  const values = numericValues(rows, [dataKey]);
  const ticks = niceTicks(Math.min(...values), Math.max(...values), 5);
  const yMin = ticks[0];
  const yMax = ticks[ticks.length - 1];
  const y = (value) => m.top + (1 - ((Number(value || 0) - yMin) / (yMax - yMin || 1))) * plotH;
  const zeroY = y(0);
  const slot = plotW / Math.max(1, rows.length);
  const barW = Math.min(54, Math.max(14, slot * 0.62));
  const formatTick = valueFormatterForLabel(valueType);

  return (
    <svg className="chart-svg" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={name || 'Bar chart'} preserveAspectRatio="xMidYMid meet">
      <rect x="0" y="0" width={W} height={H} fill="#fff" />
      {ticks.map((tick) => {
        const ty = y(tick);
        return (
          <g key={tick}>
            <line x1={m.left} x2={W - m.right} y1={ty} y2={ty} className="chart-grid" />
            <text x={m.left - 12} y={ty + 4} textAnchor="end" className="chart-tick">{formatTick(tick)}</text>
          </g>
        );
      })}
      <line x1={m.left} x2={W - m.right} y1={zeroY} y2={zeroY} className="chart-zero" />
      {rows.map((row, idx) => {
        const value = Number(row?.[dataKey] || 0);
        const cx = m.left + slot * idx + slot / 2;
        const top = Math.min(y(value), zeroY);
        const height = Math.max(1, Math.abs(zeroY - y(value)));
        const label = String(row.name || row.month || '').replace(/\n/g, ' ');
        return (
          <g key={`${label}-${idx}`}>
            <rect x={cx - barW / 2} y={top} width={barW} height={height} rx="5" fill={color} />
            <AxisLabel x={cx} y={H - 32} label={label} maxChars={rows.length > 6 ? 8 : 12} />
          </g>
        );
      })}
      <text x={m.left + plotW / 2} y={H - 6} textAnchor="middle" className="chart-axis-label">Category</text>
      <text x="18" y={m.top + plotH / 2} textAnchor="middle" className="chart-axis-label" transform={`rotate(-90 18 ${m.top + plotH / 2})`}>{yLabel}</text>
    </svg>
  );
}

function UnitsChart({ data }) {
  return <BarMoneyChart data={(data || []).map((m) => ({ name: m.month, units: m.units }))} dataKey="units" name="Units" color={COLORS.gold} yLabel="Units" valueType="units" />;
}

function Cover({ data }) {
  const { metrics } = data;
  return (
    <Page className="cover-page">
      <div className="cover-content">
        <img className="cover-logo" src={LOGO_SRC} alt="HerohubOS" />
        <div className="cover-kicker">Herohub Operating System<br />Executive Report</div>
        <h1>{metrics.dealerName}</h1>
        <div className="cover-period"><CalendarDays size={26} /> {metrics.periodLabel}</div>
        <p>Financial data based on GL export, transaction detail, and dealer context notes.</p>
      </div>
      <div className="cover-bars"><span /><span /><span /><span /><span /></div>
    </Page>
  );
}

function Contents({ data }) {
  const { metrics } = data;
  const items = [
    'Executive Summary',
    'WIG Dashboard',
    'Financial Snapshot',
    'Monthly Trends',
    'Department Performance',
    'Inventory & Floorplan Discipline',
    'Fixed Ops & F&I Contribution',
    'OEM Profit Contribution Intelligence',
    'Leadership Priorities',
    'Executive Talk Track'
  ];
  return (
    <Page className="contents-page">
      <div className="contents-left">
        <h1>Contents</h1>
        <p>This report gives an executive view of {metrics.dealerName} over {metrics.periodLabel}: where profit is being created, where management attention is needed, and which operating routines should guide the next leadership discussion.</p>
      </div>
      <ol className="contents-list">
        {items.map((item, idx) => <li key={item}><span>{String(idx + 1).padStart(2, '0')}</span>{item}</li>)}
      </ol>
      <div className="cover-bars"><span /><span /><span /><span /><span /></div>
    </Page>
  );
}

function ExecutiveSummary({ data }) {
  const { metrics, content, cards } = data;
  return (
    <TwoColumnPage dealerName={metrics.dealerName} label="Executive Summary" title={`${metrics.periodLabel} Performance`} takeaways={content.executiveTakeaways} iconSet={[Crosshair, CircleDollarSign, Database]}>
      <div className="stat-grid four">
        <StatCard {...cards.revenue} />
        <StatCard {...cards.grossProfit} />
        <StatCard {...cards.nop} accent="black" />
        <StatCard {...cards.units} accent="gold" />
      </div>
      <div className="summary-grid">
        <ChartCard title="Monthly Revenue and Operating Profit" wide>
          <TrendChart data={metrics.monthly} lines={['revenue', 'nop']} />
        </ChartCard>
        <div className="executive-read card-box">
          <h3>Executive Read</h3>
          <ul>{content.executiveRead.map((line, i) => <li key={i}>{line}</li>)}</ul>
        </div>
      </div>
    </TwoColumnPage>
  );
}

function WigDashboard({ data }) {
  const { metrics, content, cards } = data;
  const columns = [
    { key: 'area', label: 'Area' },
    { key: 'priority', label: 'Wildly Important Goal' },
    { key: 'currentRead', label: 'Current Read' },
    { key: 'status', label: 'Status', render: (r) => <StatusPill value={r.status} /> },
    { key: 'leadershipMove', label: 'Leadership Move' }
  ];
  return (
    <TwoColumnPage dealerName={metrics.dealerName} label="Wildly Important Goals" title="Wildly Important Goals" takeaways={content.wigTakeaways} iconSet={[Gauge, ShieldCheck, Sparkles]}>
      <div className="stat-grid four">
        <StatCard label="NOP Margin" value={formatPercent(metrics.nopMargin)} sub="Maintain positive profit" />
        <StatCard {...cards.frontEndGp} accent="gold" />
        <StatCard {...cards.fiPvr} accent="gold" />
        <StatCard {...cards.serviceNop} accent="black" />
      </div>
      <DataTable columns={columns} rows={content.leadershipPriorities} />
    </TwoColumnPage>
  );
}

function FinancialSnapshot({ data }) {
  const { metrics, content } = data;
  const rows = [
    ['Revenue', formatMoney(metrics.revenue), `${metrics.periodLabel} operating revenue`],
    ['Gross Profit', formatMoney(metrics.grossProfit), `${formatPercent(metrics.grossMargin)} margin`],
    ['Operating Expenses', formatMoney(metrics.operatingExpenses), `${formatPercent(metrics.operatingExpenseRate)} of revenue`],
    ['Net Operating Profit', formatMoney(metrics.netOperatingProfit), `${formatPercent(metrics.nopMargin)} margin`],
    ['Floorplan Interest', formatMoney(metrics.capital.floorplanInterest), 'Selected-period GL expense'],
    ['Advertising', formatMoney(metrics.capital.advertising), 'Selected-period GL expense'],
    ['Ending Cash', formatMoney(metrics.capital.cash), 'Bank/cash account proxy'],
    ['Inventory Proxy', formatMoney(metrics.capital.inventory), 'Positive inventory balance proxy'],
    ['OEM Payable Proxy', formatMoney(metrics.capital.oemPayable), 'Floorplan/OEM payable proxy']
  ];
  const columns = [
    { key: 'metric', label: 'Metric' },
    { key: 'value', label: metrics.periodLabel },
    { key: 'read', label: 'Read' }
  ];
  const tableRows = rows.map(([metric, value, read]) => ({ metric, value, read }));
  const bridgeData = [
    { name: 'Revenue', amount: metrics.revenue },
    { name: 'GP', amount: metrics.grossProfit },
    { name: 'Expense', amount: metrics.operatingExpenses },
    { name: 'NOP', amount: metrics.netOperatingProfit }
  ];
  const capitalData = [
    { name: 'Inventory', amount: metrics.capital.inventory },
    { name: 'OEM Payable\nProxy', amount: metrics.capital.oemPayable },
    { name: 'Cash', amount: metrics.capital.cash },
    { name: 'Floor Int.', amount: metrics.capital.floorplanInterest },
    { name: 'Advertising', amount: metrics.capital.advertising }
  ];
  return (
    <TwoColumnPage dealerName={metrics.dealerName} label="Financial Snapshot" title="Financial Snapshot" takeaways={content.financialTakeaways} iconSet={[TrendingUp, CircleDollarSign, FileBarChart]}>
      <DataTable columns={columns} rows={tableRows} />
      <div className="chart-row two">
        <ChartCard title="Profit Bridge"><BarMoneyChart data={bridgeData} dataKey="amount" name="Amount" color={COLORS.teal} /></ChartCard>
        <ChartCard title="Capital / Cost Position"><BarMoneyChart data={capitalData} dataKey="amount" name="Amount" color={COLORS.pink} /></ChartCard>
      </div>
    </TwoColumnPage>
  );
}

function MonthlyTrends({ data }) {
  const { metrics, content } = data;
  return (
    <TwoColumnPage dealerName={metrics.dealerName} label="Monthly Performance Trends" title="Monthly Performance Trends" takeaways={content.trendTakeaways} iconSet={[Sparkles, CircleDollarSign, TrendingUp]}>
      <ChartCard title="Monthly Revenue and Gross Profit" wide><TrendChart data={metrics.monthly} lines={['revenue', 'grossProfit']} /></ChartCard>
      <div className="chart-row two">
        <ChartCard title="Monthly NOP"><BarMoneyChart data={metrics.monthly.map((m) => ({ name: m.month, amount: m.nop }))} dataKey="amount" name="NOP" color={COLORS.teal} yLabel="NOP ($)" /></ChartCard>
        <ChartCard title="Monthly Retailed Units"><UnitsChart data={metrics.monthly} /></ChartCard>
      </div>
    </TwoColumnPage>
  );
}

function DepartmentPerformance({ data }) {
  const { metrics, content, departmentRows } = data;
  const columns = [
    { key: 'department', label: 'Department' },
    { key: 'revenue', label: 'Revenue', render: (r) => formatMoney(r.revenue) },
    { key: 'grossProfit', label: 'Gross Profit', render: (r) => formatMoney(r.grossProfit) },
    { key: 'gpMargin', label: 'GP Margin', render: (r) => formatPercent(r.gpMargin) },
    { key: 'directExpense', label: 'Direct Expense', render: (r) => formatMoney(r.directExpense) },
    { key: 'directNop', label: 'Direct NOP', render: (r) => formatMoney(r.directNop) },
    { key: 'nopMargin', label: 'NOP Margin', render: (r) => formatPercent(r.nopMargin) }
  ];
  const nopData = departmentRows.map((r) => ({ name: r.department.replace(' Major Units', '').replace(' & Accessories', ''), amount: r.directNop }));
  const revenueData = departmentRows.map((r) => ({ name: r.department.replace(' Major Units', '').replace(' & Accessories', ''), amount: r.revenue }));
  return (
    <TwoColumnPage dealerName={metrics.dealerName} label="Department Performance" title="Department Performance" takeaways={content.departmentTakeaways} iconSet={[FileBarChart, Wrench, Crosshair]}>
      <DataTable columns={columns} rows={departmentRows} note="Note: Department direct NOP may not tie to consolidated NOP because consolidated/admin/other lines are not shown in the department table." />
      <div className="chart-row two">
        <ChartCard title="Department NOP"><BarMoneyChart data={nopData} dataKey="amount" name="Direct NOP" color={COLORS.purple} yLabel="Direct NOP ($)" /></ChartCard>
        <ChartCard title="Revenue Mix"><BarMoneyChart data={revenueData} dataKey="amount" name="Revenue" color={COLORS.purple} /></ChartCard>
      </div>
    </TwoColumnPage>
  );
}

function InventoryFloorplan({ data }) {
  const { metrics, content } = data;
  const monthlyFloorplan = metrics.monthly.map((m) => ({ name: m.month, amount: m.floorplanInterest }));
  const capital = [
    { name: 'Inventory', amount: metrics.capital.inventory },
    { name: 'OEM Payable', amount: metrics.capital.oemPayable },
    { name: 'Cash', amount: metrics.capital.cash }
  ];
  return (
    <TwoColumnPage dealerName={metrics.dealerName} label="Inventory & Floorplan" title="Inventory & Floorplan Discipline" takeaways={content.inventoryTakeaways} iconSet={[PackageSearch, CircleDollarSign, Database]}>
      <div className="stat-grid four">
        <StatCard label="Ending Inventory Proxy" value={formatMoney(metrics.capital.inventory)} sub="Positive balances only" />
        <StatCard label="Ending OEM Payable Proxy" value={formatMoney(metrics.capital.oemPayable)} sub="Abs. floorplan/OEM payable accts" />
        <StatCard label="Floorplan Interest" value={formatMoney(metrics.capital.floorplanInterest)} sub="Selected-period expense" accent="gold" />
        <StatCard label="Ending Cash" value={formatMoney(metrics.capital.cash)} sub="Bank/cash accounts" accent="black" />
      </div>
      <div className="chart-row two">
        <ChartCard title="Monthly Floorplan Interest"><BarMoneyChart data={monthlyFloorplan} dataKey="amount" name="Floorplan Interest" color={COLORS.teal} yLabel="Floorplan Interest ($)" /></ChartCard>
        <ChartCard title="Capital Position"><BarMoneyChart data={capital} dataKey="amount" name="Balance" color={COLORS.purple} yLabel="Balance ($)" /></ChartCard>
      </div>
      <p className="note-line">Note: Inventory and floorplan balances are directional proxies until reconciled to aged inventory and floorplan schedules.</p>
    </TwoColumnPage>
  );
}

function FixedOpsFi({ data }) {
  const { metrics, content } = data;
  return (
    <TwoColumnPage dealerName={metrics.dealerName} label="Fixed Ops & F&I" title="Fixed Ops & F&I Contribution" takeaways={content.fixedOpsTakeaways} iconSet={[Wrench, PackageSearch, ShieldCheck]}>
      <div className="stat-grid four">
        <StatCard label="Repair Orders" value={formatCount(metrics.service.roCount)} sub="Closed ROs" />
        <StatCard label="RO Revenue" value={formatMoney(metrics.service.revenue)} sub="Labor, parts, misc & sublet" />
        <StatCard label="F&I PVR" value={formatMoney(metrics.fAndIPvr, { compact: false })} sub="GL F&I gross / unit" accent="gold" />
        <StatCard label="Finance Penetration" value={formatPercent(metrics.financePenetration)} sub="Lienholder based" accent="black" />
      </div>
      <div className="summary-grid fixedops">
        <ChartCard title="Monthly Repair-Order Revenue" wide>
          <BarMoneyChart data={metrics.service.byMonth.map((m) => ({ name: m.month, amount: m.revenue }))} dataKey="amount" name="RO Revenue" color={COLORS.teal} yLabel="RO Revenue ($)" />
        </ChartCard>
        <div className="executive-read card-box">
          <h3>Executive Read</h3>
          <ul>
            <li>Service processed {formatCount(metrics.service.roCount)} closed ROs and {formatMoney(metrics.service.revenue)} in RO revenue.</li>
            <li>P&A invoices produced {formatMoney(metrics.parts.revenue)} in revenue and {formatMoney(metrics.parts.grossProfit)} in gross profit.</li>
            <li>F&I generated roughly {formatMoney(metrics.fAndIPvr, { compact: false })} per retailed unit.</li>
            <li>Review F&I training and service-space constraints as operating unlocks.</li>
          </ul>
        </div>
      </div>
    </TwoColumnPage>
  );
}

function OemContribution({ data }) {
  const { metrics, content } = data;
  const rows = metrics.oems?.length ? metrics.oems : [{ make: 'No OEM detail', units: 0, revenue: 0, frontEndGp: 0, frontEndGpMargin: 0, read: 'N/A' }];
  const columns = [
    { key: 'make', label: 'Brand / Category' },
    { key: 'units', label: 'Units', render: (r) => formatCount(r.units) },
    { key: 'revenue', label: 'Revenue', render: (r) => formatMoney(r.revenue) },
    { key: 'frontEndGp', label: 'Front-End GP', render: (r) => formatMoney(r.frontEndGp) },
    { key: 'frontEndGpMargin', label: 'Front-End GP Margin', render: (r) => formatPercent(r.frontEndGpMargin) },
    { key: 'read', label: 'Read' }
  ];
  return (
    <TwoColumnPage dealerName={metrics.dealerName} label="OEM Profit Contribution" title="OEM Profit Contribution Intelligence" takeaways={content.oemTakeaways} iconSet={[Database, Crosshair, Sparkles]}>
      <DataTable columns={columns} rows={rows} />
      <div className="chart-row two">
        <ChartCard title="OEM Front-End GP"><BarMoneyChart data={rows.map((r) => ({ name: r.make, amount: r.frontEndGp }))} dataKey="amount" name="Front-End GP" color={COLORS.teal} /></ChartCard>
        <ChartCard title="OEM Revenue"><BarMoneyChart data={rows.map((r) => ({ name: r.make, amount: r.revenue }))} dataKey="amount" name="Revenue" color={COLORS.purple} /></ChartCard>
      </div>
    </TwoColumnPage>
  );
}

function PriorityCardList({ priorities = [] }) {
  return (
    <div className="priority-card-list">
      {priorities.slice(0, 5).map((item, idx) => (
        <div className="priority-card" key={`${item.area}-${idx}`}>
          <span className="priority-number">{idx + 1}</span>
          <div>
            <h4>{item.area}</h4>
            <p>{item.priority}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function LeadershipPriorities({ data }) {
  const { metrics, content } = data;
  return (
    <Page className="split-page leadership-page">
      <div className="main-panel">
        <Header dealerName={metrics.dealerName} label="Leadership Priorities" />
        <h1>Leadership Priorities</h1>
        <PriorityCardList priorities={content.leadershipPriorities} />
      </div>
      <NumberedRail heading="Executive Mandate" items={content.executiveMandate} />
    </Page>
  );
}

function SectionBullets({ label, items, kind }) {
  if (!items?.length) return null;
  return (
    <div className={`talk-section ${kind}`}>
      <h5>{label}</h5>
      <ul>
        {items.slice(0, 3).map((item, idx) => <li key={`${label}-${idx}`}>{item}</li>)}
      </ul>
    </div>
  );
}

function TalkTrackGrid({ sections = [] }) {
  return (
    <div className="talk-track-grid">
      {sections.slice(0, 4).map((section, idx) => (
        <div className="talk-card" key={`${section.title}-${idx}`}>
          <h4>{section.title}</h4>
          <SectionBullets label="Hits" items={section.hits} kind="hits" />
          <SectionBullets label="Risks" items={section.risks} kind="risks" />
          <SectionBullets label="Questions" items={section.questions} kind="questions" />
        </div>
      ))}
    </div>
  );
}

function ExecutiveTalkTrack({ data }) {
  const { metrics, content } = data;
  return (
    <Page className="split-page talk-page">
      <div className="main-panel">
        <Header dealerName={metrics.dealerName} label="Executive Talk Track" />
        <h1>Executive Talk Track - Department Meetings</h1>
        <TalkTrackGrid sections={content.talkTrackSections} />
      </div>
      <NumberedRail heading="Final Executive Narrative" items={content.finalNarrative} />
    </Page>
  );
}

export default function Report({ data }) {
  if (!data) return null;
  return (
    <div className="report-document" id="report-document">
      <Cover data={data} />
      <Contents data={data} />
      <ExecutiveSummary data={data} />
      <WigDashboard data={data} />
      <FinancialSnapshot data={data} />
      <MonthlyTrends data={data} />
      <DepartmentPerformance data={data} />
      <InventoryFloorplan data={data} />
      <FixedOpsFi data={data} />
      <OemContribution data={data} />
      <LeadershipPriorities data={data} />
      <ExecutiveTalkTrack data={data} />
    </div>
  );
}
