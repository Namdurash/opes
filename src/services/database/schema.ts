import { appSchema, tableSchema } from '@nozbe/watermelondb';

export const databaseSchema = appSchema({
  version: 5,
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
      ],
    }),
  ],
});
