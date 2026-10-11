export function lineAmount(qty, rate, taxPct) {
  const q = Number(qty) || 0;
  const r = Number(rate) || 0;
  const t = Number(taxPct) || 0;
  const base = q * r;
  const tax = (base * t) / 100;
  return { base, tax, total: base + tax };
}

export function sumLines(items) {
  return items.reduce(
    (acc, it) => {
      const a = lineAmount(it.qty, it.rate, it.tax_pct);
      acc.subtotal += a.base;
      acc.tax += a.tax;
      acc.total += a.total;
      return acc;
    },
    { subtotal: 0, tax: 0, total: 0 }
  );
}

export function money(n) {
  return Math.round((Number(n) || 0) * 100) / 100;
}

export function today() {
  return new Date().toISOString().slice(0, 10);
}
