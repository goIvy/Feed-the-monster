const usd0 = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
const compact = new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 });
const num0 = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });

/** $84,210 */
export function usd(value: number): string {
  return usd0.format(Math.round(value));
}

/** $84.2K, $1.3M; exact dollars below $1,000. */
export function usdCompact(value: number): string {
  const abs = Math.abs(value);
  if (abs < 1000) return usd(value);
  const sign = value < 0 ? "-" : "";
  return `${sign}$${compact.format(abs)}`;
}

/** Signed currency: +$1,200 / -$340 */
export function usdSigned(value: number): string {
  const s = usd(Math.abs(value));
  return value < 0 ? `-${s}` : `+${s}`;
}

export function pct(value: number, digits = 0): string {
  return `${(value * 100).toFixed(digits)}%`;
}

/** Values already expressed in percent units (e.g. 4.1 → "4.1%"). */
export function pctPoints(value: number, digits = 1): string {
  return `${value.toFixed(digits)}%`;
}

export function signedPct(value: number, digits = 1): string {
  const v = value.toFixed(digits);
  return value > 0 ? `+${v}%` : `${v}%`;
}

export function number(value: number): string {
  return num0.format(value);
}

export function compactNumber(value: number): string {
  return compact.format(value);
}
