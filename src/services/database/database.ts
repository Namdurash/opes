import { Database } from '@nozbe/watermelondb';
import { DatabaseAdapter } from '@nozbe/watermelondb/adapters/type';
import { CardModel, UserModel } from './models';
import { databaseMigrations } from './migrations';
import { databaseSchema } from './schema';

const isJestEnvironment = typeof jest !== 'undefined';

const createAdapter = (): DatabaseAdapter => {
  if (isJestEnvironment) {
    // eslint-disable-next-line @typescript-eslint/no-var-requires,global-require
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

  // eslint-disable-next-line @typescript-eslint/no-var-requires,global-require
  const SQLiteAdapter = require('@nozbe/watermelondb/adapters/sqlite').default as new (
    options: Record<string, unknown>,
  ) => DatabaseAdapter;

  return new SQLiteAdapter({
    schema: databaseSchema,
    migrations: databaseMigrations,
    jsi: true,
    dbName: 'opes',
    onSetUpError: (error: unknown) => {
      throw error;
    },
  });
}

export const database = new Database({
  adapter: createAdapter(),
  modelClasses: [UserModel, CardModel],
});
