import { appSchema, tableSchema } from '@nozbe/watermelondb';

export const databaseSchema = appSchema({
  version: 1,
  tables: [
    tableSchema({
      name: 'users',
      columns: [
        { name: 'name', type: 'string' },
        { name: 'password_hash', type: 'string' },
        { name: 'created_at', type: 'number' },
      ],
    }),
    tableSchema({
      name: 'cards',
      columns: [
        { name: 'user_id', type: 'string', isIndexed: true },
        { name: 'card_name', type: 'string' },
        { name: 'created_at', type: 'number' },
      ],
    }),
  ],
});
