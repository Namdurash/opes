import type { Transaction } from '../../domain/transactions';
import type { TransactionSection } from './types';

export const formatTransactionTime = (isoString: string): string =>
  new Date(isoString).toLocaleTimeString('uk-UA', {
    hour: '2-digit',
    minute: '2-digit',
  });

export const formatAmount = (amount: number, currencySymbol: string): string => {
  const sign = amount >= 0 ? '+' : '';
  return `${sign}${amount.toFixed(2)} ${currencySymbol}`;
};

export const formatDateHeader = (dateKey: string): string => {
  const date = new Date(dateKey + 'T00:00:00');
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
  const target = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  if (target.getTime() === today.getTime()) return 'Today';
  if (target.getTime() === yesterday.getTime()) return 'Yesterday';

  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

const toDateKey = (isoString: string): string => isoString.slice(0, 10);

export const groupTransactionsByDate = (transactions: Transaction[]): TransactionSection[] => {
  const sorted = [...transactions].sort(
    (a, b) => b.occurredAtIso.localeCompare(a.occurredAtIso),
  );

  const groups = new Map<string, Transaction[]>();

  for (const tx of sorted) {
    const key = toDateKey(tx.occurredAtIso);
    const group = groups.get(key);
    if (group) {
      group.push(tx);
    } else {
      groups.set(key, [tx]);
    }
  }

  return Array.from(groups.entries()).map(([dateKey, data]) => ({
    title: formatDateHeader(dateKey),
    data,
  }));
};
