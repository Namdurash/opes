import { appSchema, tableSchema } from '@nozbe/watermelondb';

export const databaseSchema = appSchema({
  version: 6,
  tables: [
    tableSchema({
      name: 'users',
      columns: [
        { name: 'name', type: 'string' },
        { name: 'checked_in', type: 'boolean' },
        { name: 'created_at', type: 'number' },
      ],
    }),
    tableSchema({
      name: 'cards',
      columns: [
        { name: 'user_id', type: 'string', isIndexed: true },
        { name: 'card_name', type: 'string' },
        { name: 'title', type: 'string' },
        { name: 'money_amount', type: 'number' },
        { name: 'type', type: 'string' },
        { name: 'image', type: 'string', isOptional: true },
        { name: 'created_at', type: 'number' },
        { name: 'sort_order', type: 'number' },
        { name: 'monobank_account_id', type: 'string', isOptional: true },
        { name: 'currency_code', type: 'number', isOptional: true },
        { name: 'currency_symbol', type: 'string', isOptional: true },
        { name: 'iban', type: 'string', isOptional: true },
        { name: 'masked_pan', type: 'string', isOptional: true },
        { name: 'credit_limit', type: 'number', isOptional: true },
        { name: 'monobank_balance', type: 'number', isOptional: true },
      ],
    }),
    tableSchema({
      name: 'transactions',
      columns: [
        { name: 'title', type: 'string' },
        { name: 'amount', type: 'number' },
        { name: 'type', type: 'string' },
        { name: 'occurred_at_iso', type: 'string' },
        { name: 'card_id', type: 'string', isIndexed: true },
        { name: 'mcc', type: 'number' },
        { name: 'currency_code', type: 'number' },
        { name: 'currency_symbol', type: 'string' },
        { name: 'balance', type: 'number' },
        { name: 'hold', type: 'boolean' },
        { name: 'comment', type: 'string', isOptional: true },
      ],
    }),
  ],
});
