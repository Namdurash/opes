export function formatAmount(amount: number, currencySymbol: string): string {
  const sign = amount >= 0 ? '+' : '';
  return `${sign}${amount.toFixed(2)} ${currencySymbol}`;
}
