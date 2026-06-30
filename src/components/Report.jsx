import React from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import {
  CalendarDays,
  CircleDollarSign,
  Crosshair,
  Database,
  FileBarChart,
  Gauge,
  PackageSearch,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Wrench
} from 'lucide-react';
import { formatMoney, formatPercent, formatCount } from '../lib/format.js';

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

function TakeawayPanel({ takeaways = [], iconSet = [] }) {
  return (
    <aside className="takeaway-panel">
      <h3>Executive Takeaways</h3>
      <div className="takeaway-list">
        {takeaways.slice(0, 3).map((item, idx) => {
          const Icon = iconSet[idx] || Sparkles;
          return (
            <div className="takeaway-item" key={`${item.title}-${idx}`}>
              <Icon size={42} strokeWidth={1.7} />
              <div>
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

function TrendChart({ data, lines = ['revenue', 'nop'] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data} margin={{ top: 20, right: 28, bottom: 28, left: 38 }}>
        <CartesianGrid stroke="#e1e3e8" />
        <XAxis dataKey="month" label={{ value: 'Month', position: 'insideBottom', offset: -18 }} tick={{ fontSize: 14 }} />
        <YAxis tickFormatter={moneyTick} label={{ value: 'Dollars ($)', angle: -90, position: 'insideLeft', offset: -22 }} tick={{ fontSize: 14 }} />
        <Tooltip formatter={(v) => formatMoney(v, { compact: false })} />
        <Legend verticalAlign="top" align="right" height={30} />
        {lines.includes('revenue') && <Line type="monotone" dataKey="revenue" name="Revenue" stroke={COLORS.teal} strokeWidth={4} dot={{ r: 5 }} />}
        {lines.includes('grossProfit') && <Line type="monotone" dataKey="grossProfit" name="Gross Profit" stroke={COLORS.purple} strokeWidth={4} dot={{ r: 5 }} />}
        {lines.includes('nop') && <Line type="monotone" dataKey="nop" name="NOP" stroke={COLORS.purple} strokeWidth={4} dot={{ r: 5 }} />}
      </LineChart>
    </ResponsiveContainer>
  );
}

function BarMoneyChart({ data, dataKey, name, color = COLORS.teal, yLabel = 'Dollars ($)' }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 20, right: 20, bottom: 28, left: 38 }}>
        <CartesianGrid stroke="#e1e3e8" />
        <XAxis dataKey="name" label={{ value: 'Category', position: 'insideBottom', offset: -18 }} tick={{ fontSize: 14 }} />
        <YAxis tickFormatter={moneyTick} label={{ value: yLabel, angle: -90, position: 'insideLeft', offset: -22 }} tick={{ fontSize: 14 }} />
        <Tooltip formatter={(v) => formatMoney(v, { compact: false })} />
        <Bar dataKey={dataKey} name={name} fill={color} radius={[6, 6, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

function UnitsChart({ data }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 20, right: 20, bottom: 28, left: 38 }}>
        <CartesianGrid stroke="#e1e3e8" />
        <XAxis dataKey="month" label={{ value: 'Month', position: 'insideBottom', offset: -18 }} tick={{ fontSize: 14 }} />
        <YAxis label={{ value: 'Units', angle: -90, position: 'insideLeft', offset: -12 }} tick={{ fontSize: 14 }} />
        <Tooltip />
        <Bar dataKey="units" name="Units" fill={COLORS.gold} radius={[6, 6, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

function Cover({ data }) {
  const { metrics } = data;
  return (
    <Page className="cover-page">
      <div className="cover-content">
        <div className="logo-wordmark">HER<span>OHUB OS</span><sup>™</sup></div>
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

function LeadershipPriorities({ data }) {
  const { metrics, content } = data;
  const columns = [
    { key: 'area', label: 'Area' },
    { key: 'priority', label: 'Priority' },
    { key: 'currentRead', label: 'Current Read' },
    { key: 'status', label: 'Status', render: (r) => <StatusPill value={r.status} /> },
    { key: 'leadershipMove', label: 'Leadership Move' }
  ];
  return (
    <TwoColumnPage dealerName={metrics.dealerName} label="Leadership Priorities" title="Leadership Priorities" takeaways={content.executiveTakeaways} iconSet={[Crosshair, Gauge, ShieldCheck]}>
      <DataTable columns={columns} rows={content.leadershipPriorities} />
      <div className="priority-read card-box full-width">
        <h3>How to use this page</h3>
        <p>Use these priorities to keep the meeting focused on a small number of operating moves. The goal is not to solve every issue in one discussion. The goal is to leave the room with clear owners, a short inspection cadence, and measurable follow-up before the next report.</p>
      </div>
    </TwoColumnPage>
  );
}

function ExecutiveTalkTrack({ data }) {
  const { metrics, content } = data;
  return (
    <TwoColumnPage dealerName={metrics.dealerName} label="Executive Talk Track" title="Executive Talk Track" takeaways={content.executiveTakeaways} iconSet={[Sparkles, CircleDollarSign, TrendingUp]}>
      <div className="talk-track">
        {content.executiveTalkTrack.map((paragraph, idx) => <p key={idx}>{paragraph}</p>)}
      </div>
    </TwoColumnPage>
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
