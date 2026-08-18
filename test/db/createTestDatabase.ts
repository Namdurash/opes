import { Database } from '@nozbe/watermelondb';
import type { DatabaseAdapter } from '@nozbe/watermelondb/adapters/type';
import {
  CardModel,
  MerchantRuleModel,
  TransactionModel,
  UserModel,
  UserOverrideModel,
} from '../../src/services/database/models';
import { databaseMigrations } from '../../src/services/database/migrations';
import { databaseSchema } from '../../src/services/database/schema';

/** The bit of the non-worker LokiJS adapter's innards teardown needs. */
interface LokiDriver {
  loki?: { close: (onDone: () => void) => void };
}

export interface TestDatabase {
  database: Database;
  teardown: () => Promise<void>;
}

/**
 * A throwaway WatermelonDB instance for one test case.
 *
 * Built from the PRODUCT schema and the PRODUCT migration list — never a copy —
 * so a field or version that drifts apart from `src/services/database/schema.ts`
 * breaks the suite instead of hiding in a fixture. The migration chain is not
 * replayed: the repository keeps only the current schema (no version-1 snapshot
 * exists), so migrations stay unverified here. That gap is deliberate and
 * belongs to its own ticket.
 *
 * One instance per test CASE, not per file: LokiJS holds its rows in memory for
 * the lifetime of the adapter, so sharing an instance would let one case observe
 * another's writes. Isolation is a property of this helper, which is why nothing
 * here touches jest's concurrency settings — separate worker processes already
 * have separate memory.
 */
export const createTestDatabase = (): TestDatabase => {
  const LokiJSAdapter =
    require('@nozbe/watermelondb/adapters/lokijs').default as new (
      options: Record<string, unknown>,
    ) => DatabaseAdapter;

  const adapter = new LokiJSAdapter({
    schema: databaseSchema,
    migrations: databaseMigrations,
    useWebWorker: false,
    useIncrementalIndexedDB: false,
  });

  if (adapter.schema.version !== databaseSchema.version) {
    throw new Error(
      `test database opened at schema version ${adapter.schema.version}, but the product schema is at ${databaseSchema.version}`,
    );
  }

  const database = new Database({
    adapter,
    modelClasses: [
      UserModel,
      CardModel,
      TransactionModel,
      UserOverrideModel,
      MerchantRuleModel,
    ],
  });

  const teardown = async (): Promise<void> => {
    await database.write(async () => {
      await database.unsafeResetDatabase();
    });

    // Dropping the rows is not enough to let the process exit. WatermelonDB
    // starts Loki with `autosave: true, autosaveInterval: 500`, and that
    // setInterval keeps the event loop alive for the rest of the run — it is the
    // handle that made `forceExit: true` necessary in the first place.
    // `loki.close()` disables autosave and drains the save queue; reaching it
    // through `_driver` is the same route the adapter's own `testClone` takes.
    const driver = (adapter as unknown as { _driver?: LokiDriver })._driver;
    await new Promise<void>(resolve => {
      if (!driver?.loki) {
        resolve();
        return;
      }
      driver.loki.close(() => resolve());
    });
  };

  return { database, teardown };
};
