import { addColumns, schemaMigrations } from '@nozbe/watermelondb/Schema/migrations';

export const databaseMigrations = schemaMigrations({
  migrations: [
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
