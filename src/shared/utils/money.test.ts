import { formatMoney } from './money';

// uk-UA groups thousands with a non-breaking space (U+00A0 / U+202F depending
// on the ICU build); normalise to a plain space so assertions stay stable.
const norm = (value: string): string => value.replace(/\s/g, ' ');

describe('formatMoney', () => {
  it('formats UAH with uk-UA grouping and the ₴ glyph', () => {
    expect(norm(formatMoney(1234567.5, { code: 980, symbol: 'UAH' }))).toBe('1 234 567,50 ₴');
  });

  it('defaults to UAH (₴) when no currency is set', () => {
    expect(norm(formatMoney(100))).toBe('100,00 ₴');
  });

  it('maps known numeric codes to glyphs', () => {
    expect(norm(formatMoney(89.9, { code: 840, symbol: 'USD' }))).toBe('89,90 $');
    expect(norm(formatMoney(50, { code: 978, symbol: 'EUR' }))).toBe('50,00 €');
  });

  it('renders negatives with a leading minus', () => {
    expect(norm(formatMoney(-42, { code: 980 }))).toBe('-42,00 ₴');
  });

  it('prefixes a + for non-negative amounts when showSign is set', () => {
    expect(norm(formatMoney(42, { code: 980 }, { showSign: true }))).toBe('+42,00 ₴');
    expect(norm(formatMoney(-42, { code: 980 }, { showSign: true }))).toBe('-42,00 ₴');
  });

  it('falls back to the stored alpha symbol for codes without a glyph', () => {
    expect(norm(formatMoney(1500, { code: 985, symbol: 'PLN' }))).toBe('1 500,00 PLN');
  });

  it('treats amounts as major units (does not divide by 100)', () => {
    expect(norm(formatMoney(100, { code: 840, symbol: 'USD' }))).toBe('100,00 $');
  });
});
