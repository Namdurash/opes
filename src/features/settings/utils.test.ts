import { transactionsToCsv, transactionsToJson } from './utils';
import type { Transaction } from '../../domain/transactions';
import { makeTransaction } from '../../../test/factories';

// Only what this suite asserts on differs from the shared default.
const makeTx = (overrides: Partial<Transaction> = {}): Transaction =>
  makeTransaction({
    title: 'Coffee',
    amount: -55,
    mcc: 5814,
    balance: 1000,
    ...overrides,
  });

describe('transactionsToCsv', () => {
  it('writes a header row followed by one row per transaction', () => {
    const csv = transactionsToCsv([makeTx({ id: 'a' }), makeTx({ id: 'b' })]);
    const lines = csv.split('\n');

    expect(lines[0]).toBe(
      'id,title,amount,type,occurredAtIso,cardId,mcc,currencyCode,currencySymbol,balance,hold,comment',
    );
    expect(lines).toHaveLength(3);
    expect(lines[1].startsWith('a,Coffee,-55,expense,')).toBe(true);
  });

  it('quotes and escapes fields containing commas, quotes, or newlines', () => {
    // Assert against the whole document: a quoted field may itself contain a
    // newline, so splitting on '\n' would wrongly cut a row in two.
    const csv = transactionsToCsv([
      makeTx({ id: 'a', title: 'ATB, "the" store', comment: 'line1\nline2' }),
    ]);

    expect(csv).toContain('"ATB, ""the"" store"');
    expect(csv).toContain('"line1\nline2"');
  });

  it('renders an empty comment as an empty field', () => {
    const row = transactionsToCsv([makeTx({ comment: null })]).split('\n')[1];
    expect(row.endsWith(',')).toBe(true);
  });
});

describe('transactionsToJson', () => {
  it('produces parseable JSON of the transactions', () => {
    const transactions = [makeTx({ id: 'a' })];
    const parsed = JSON.parse(transactionsToJson(transactions));
    expect(parsed).toEqual(transactions);
  });
});
