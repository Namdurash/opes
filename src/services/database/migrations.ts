import { addColumns, createTable, schemaMigrations } from '@nozbe/watermelondb/Schema/migrations';

export const databaseMigrations = schemaMigrations({
  migrations: [
    {
      toVersion: 7,
      steps: [
        createTable({
          name: 'user_overrides',
          columns: [
            { name: 'transaction_id', type: 'string', isIndexed: true },
            { name: 'category_id', type: 'string' },
            { name: 'created_at', type: 'number' },
          ],
        }),
        createTable({
          name: 'merchant_rules',
          columns: [
            { name: 'merchant_name', type: 'string', isIndexed: true },
            { name: 'category_id', type: 'string' },
            { name: 'created_at', type: 'number' },
          ],
        }),
      ],
    },
    {
      toVersion: 6,
      steps: [
        createTable({
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
        addColumns({
          table: 'cards',
          columns: [
            { name: 'monobank_account_id', type: 'string', isOptional: true },
            { name: 'currency_code', type: 'number', isOptional: true },
            { name: 'currency_symbol', type: 'string', isOptional: true },
            { name: 'iban', type: 'string', isOptional: true },
            { name: 'masked_pan', type: 'string', isOptional: true },
            { name: 'credit_limit', type: 'number', isOptional: true },
            { name: 'monobank_balance', type: 'number', isOptional: true },
          ],
        }),
      ],
    },
    {
      toVersion: 5,
      steps: [
        addColumns({
          table: 'users',
          columns: [{ name: 'checked_in', type: 'boolean' }],
        }),
      ],
    },
    {
      toVersion: 4,
      steps: [],
    },
    {
      toVersion: 3,
      steps: [
        addColumns({
          table: 'cards',
          columns: [{ name: 'sort_order', type: 'number' }],
        }),
      ],
    },
    {
      toVersion: 2,
      steps: [
        addColumns({
          table: 'cards',
          columns: [
            { name: 'title', type: 'string' },
            { name: 'money_amount', type: 'number' },
            { name: 'type', type: 'string' },
            { name: 'image', type: 'string', isOptional: true },
          ],
        }),
      ],
    },
  ],
});
