import { Database } from '@nozbe/watermelondb';
import { DatabaseAdapter } from '@nozbe/watermelondb/adapters/type';
import {
  CardModel,
  MerchantRuleModel,
  TransactionModel,
  UserModel,
  UserOverrideModel,
} from './models';
import { createSqliteAdapter } from './createSqliteAdapter';
import type { SqliteAdapterConstructor } from './createSqliteAdapter';
import { databaseMigrations } from './migrations';
import { databaseSchema } from './schema';

const isJestEnvironment = typeof jest !== 'undefined';

const createAdapter = (): DatabaseAdapter => {
  if (isJestEnvironment) {
    const LokiJSAdapter = require('@nozbe/watermelondb/adapters/lokijs').default as new (
      options: Record<string, unknown>,
    ) => DatabaseAdapter;

    return new LokiJSAdapter({
      schema: databaseSchema,
      migrations: databaseMigrations,
      useWebWorker: false,
      useIncrementalIndexedDB: false,
    });
  }

  // No test ever takes this branch — jest picks LokiJS above — so it holds nothing but
  // the module resolution that cannot run in-process. Every option, including the
  // database file name, lives in createSqliteAdapter.ts, where it is asserted on.
  const SQLiteAdapter = require('@nozbe/watermelondb/adapters/sqlite')
    .default as SqliteAdapterConstructor<DatabaseAdapter>;

  return createSqliteAdapter(SQLiteAdapter);
};

export const database = new Database({
  adapter: createAdapter(),
  modelClasses: [
    UserModel,
    CardModel,
    TransactionModel,
    UserOverrideModel,
    MerchantRuleModel,
  ],
});
