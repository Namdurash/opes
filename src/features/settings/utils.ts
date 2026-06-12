import type { Transaction } from '../../domain/transactions';

export type ExportFormat = 'json' | 'csv';

const CSV_COLUMNS: (keyof Transaction)[] = [
  'id',
  'title',
  'amount',
  'type',
  'occurredAtIso',
  'cardId',
  'mcc',
  'currencyCode',
  'currencySymbol',
  'balance',
  'hold',
  'comment',
];

const escapeCsvField = (value: unknown): string => {
  const str = value == null ? '' : String(value);
  // Quote fields containing a delimiter, quote, or newline; double inner quotes.
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
};

export const transactionsToCsv = (transactions: Transaction[]): string => {
  const header = CSV_COLUMNS.join(',');
  const rows = transactions.map(tx =>
    CSV_COLUMNS.map(column => escapeCsvField(tx[column])).join(','),
  );
  return [header, ...rows].join('\n');
};

export const transactionsToJson = (transactions: Transaction[]): string =>
  JSON.stringify(transactions, null, 2);
