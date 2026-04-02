import { addColumns, schemaMigrations } from '@nozbe/watermelondb/Schema/migrations';

export const databaseMigrations = schemaMigrations({
  migrations: [
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
