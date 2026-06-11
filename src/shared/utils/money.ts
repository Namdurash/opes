/**
 * Money formatting for the whole app.
 *
 * Amounts are always in MAJOR units (hryvnias, not kopecks) — Monobank payloads
 * are converted to major units before storage, so never divide by 100 here.
 *
 * Output uses the Ukrainian locale (uk-UA): space thousands separator, comma
 * decimal separator, currency glyph after the amount. The currency glyph is
 * resolved from the ISO-4217 NUMERIC code (980 = UAH, 840 = USD, 978 = EUR, …),
 * defaulting to UAH (₴) when a card or transaction has no currency set.
 */

export interface MoneyCurrency {
  /** ISO-4217 numeric code, e.g. 980 (UAH), 840 (USD), 978 (EUR). */
  code?: number | null;
  /**
   * Stored currency string — in this app it is the ISO alpha code (e.g. "UAH").
   * Used as a fallback label for codes that have no dedicated glyph.
   */
  symbol?: string | null;
}

export interface FormatMoneyOptions {
  /** Prefix a "+" on non-negative amounts — for signed transaction deltas. */
  showSign?: boolean;
}

// ISO-4217 numeric code → display glyph. Codes without a well-known single
// glyph fall back to the stored alpha symbol (e.g. "PLN"), then to UAH.
const CURRENCY_GLYPHS: Record<number, string> = {
  980: '₴', // UAH
  840: '$', // USD
  978: '€', // EUR
  826: '£', // GBP
  392: '¥', // JPY
};

const DEFAULT_SYMBOL = '₴';

const amountFormatter = new Intl.NumberFormat('uk-UA', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const resolveSymbol = ({ code, symbol }: MoneyCurrency): string => {
  const glyph = code == null ? undefined : CURRENCY_GLYPHS[code];
  if (glyph) return glyph;
  if (symbol) return symbol;
  return DEFAULT_SYMBOL;
};

export const formatMoney = (
  amount: number,
  currency: MoneyCurrency = {},
  { showSign = false }: FormatMoneyOptions = {},
): string => {
  const prefix = showSign && amount >= 0 ? '+' : '';
  return `${prefix}${amountFormatter.format(amount)} ${resolveSymbol(currency)}`;
};
