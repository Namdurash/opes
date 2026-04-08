import type { Transaction } from '../../domain/transactions';
import type { MonobankStatement } from '../monobank/types';

export const mapStatementToTransaction = (
  statement: MonobankStatement,
  cardId: string,
): Transaction => ({
  id: statement.id,
  title: statement.description,
  amount: statement.amount,
  type: statement.amount < 0 ? 'expense' : 'income',
  occurredAtIso: statement.time.toISOString(),
  cardId,
  mcc: statement.mcc,
  currencyCode: statement.currencyCode,
  currencySymbol: statement.currencySymbol,
  balance: statement.balance,
  hold: statement.hold,
  comment: statement.comment ?? null,
});
