import { database } from '../../services/database';

export interface DatabaseMaintenanceRepositoryContract {
  wipeAllData(): Promise<void>;
}

/**
 * Database-wide maintenance, kept in the repository layer because it is the only layer
 * allowed to write the database. Callers above it — the sandbox reset, today — compose
 * this with whatever else they clear and own no SQL of their own.
 */
export class DatabaseMaintenanceRepository implements DatabaseMaintenanceRepositoryContract {
  /**
   * Drops every row in every table, leaving the schema in place.
   *
   * Wrapped in `database.write` because `unsafeResetDatabase` asserts it is running
   * inside a writer.
   */
  async wipeAllData(): Promise<void> {
    await database.write(async () => {
      await database.unsafeResetDatabase();
    });
  }
}
