export function parseNumber(value) {
  if (value === null || value === undefined) return 0;
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  let s = String(value).trim();
  if (!s || s.toLowerCase() === 'nan' || s.toLowerCase() === 'none') return 0;
  const isParenNegative = /^\(.*\)$/.test(s);
  s = s.replace(/[,$%\s]/g, '').replace(/[()]/g, '');
  const n = Number(s);
  if (!Number.isFinite(n)) return 0;
  return isParenNegative ? -n : n;
}

export function asMonthKey(dateLike) {
  if (!dateLike) return null;
  if (dateLike instanceof Date && !Number.isNaN(dateLike.getTime())) {
    return `${dateLike.getFullYear()}-${String(dateLike.getMonth() + 1).padStart(2, '0')}`;
  }
  const raw = String(dateLike).trim();
  if (!raw || raw === '01/01/1000 12:00:00 AM') return null;

  // YYYY-MM or YYYY-MM-DD
  const iso = raw.match(/^(\d{4})-(\d{1,2})(?:-\d{1,2})?/);
  if (iso) return `${iso[1]}-${String(Number(iso[2])).padStart(2, '0')}`;

  // MM/DD/YYYY or MM/DD/YY, with optional time
  const us = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})/);
  if (us) {
    let year = Number(us[3]);
    if (year < 100) year += 2000;
    return `${year}-${String(Number(us[1])).padStart(2, '0')}`;
  }

  const d = new Date(raw);
  if (!Number.isNaN(d.getTime())) {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  }
  return null;
}

export function monthLabel(key) {
  if (!key) return '';
  const [y, m] = key.split('-').map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString('en-US', { month: 'short' });
}

export function monthLabelLong(key) {
  if (!key) return '';
  const [y, m] = key.split('-').map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

export function monthRange(startKey, endKey) {
  if (!startKey || !endKey) return [];
  const [sy, sm] = startKey.split('-').map(Number);
  const [ey, em] = endKey.split('-').map(Number);
  const out = [];
  const d = new Date(sy, sm - 1, 1);
  const end = new Date(ey, em - 1, 1);
  while (d <= end) {
    out.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
    d.setMonth(d.getMonth() + 1);
  }
  return out;
}

export function inMonthWindow(monthKey, startKey, endKey) {
  if (!monthKey || !startKey || !endKey) return false;
  return monthKey >= startKey && monthKey <= endKey;
}

export function formatMoney(value, options = {}) {
  const n = Number(value || 0);
  const abs = Math.abs(n);
  const sign = n < 0 ? '-' : '';
  if (options.compact !== false) {
    if (abs >= 1_000_000) return `${sign}$${(abs / 1_000_000).toFixed(abs >= 10_000_000 ? 0 : 1)}M`;
    if (abs >= 1_000) return `${sign}$${Math.round(abs / 1_000)}K`;
  }
  return `${sign}$${abs.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
}

export function formatPercent(value, digits = 1) {
  const n = Number(value || 0);
  return `${n.toFixed(digits)}%`;
}

export function formatCount(value) {
  return Number(value || 0).toLocaleString('en-US', { maximumFractionDigits: 0 });
}

export function safeDivide(numerator, denominator, fallback = 0) {
  const den = Number(denominator || 0);
  if (!den) return fallback;
  return Number(numerator || 0) / den;
}

export function cleanName(name = '') {
  return String(name).replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' ').trim();
}

export function truncate(text = '', max = 180) {
  const t = String(text || '').replace(/\s+/g, ' ').trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1).trim()}…`;
}
