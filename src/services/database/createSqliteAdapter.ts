import { isSandboxBuild } from '../../shared/env';
import { databaseMigrations } from './migrations';
import { databaseSchema } from './schema';

/**
 * The shape of the WatermelonDB SQLite adapter constructor, kept generic so a test can
 * hand in a recording stand-in without a cast.
 */
export type SqliteAdapterConstructor<TAdapter> = new (
  options: Record<string, unknown>,
) => TAdapter;

/**
 * The database file name, and the only place either literal exists.
 *
 * `opes` is an installed app's existing database file. Renaming it — or letting the
 * sandbox build reach it — destroys data that cannot be recovered, so the sandbox gets
 * its own file and this resolver stays private to this module.
 */
const resolveDatabaseName = (): string => (isSandboxBuild() ? 'opes_sandbox' : 'opes');

/**
 * Builds the SQLite adapter the app runs on, options and all.
 *
 * The constructor is an argument rather than a module import because this is the one
 * place the database file name is decided: a test passes a recording constructor and
 * reads `dbName` straight off the options it received, so a name hardcoded past the
 * resolver is caught too.
 */
export const createSqliteAdapter = <TAdapter>(
  Adapter: SqliteAdapterConstructor<TAdapter>,
): TAdapter =>
  new Adapter({
    schema: databaseSchema,
    migrations: databaseMigrations,
    jsi: true,
    dbName: resolveDatabaseName(),
    onSetUpError: (error: unknown) => {
      throw error;
    },
  });
