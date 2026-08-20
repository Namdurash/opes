import Config from 'react-native-config';

type AdapterOptions = Record<string, unknown>;

/**
 * The options object the stand-in constructor was last handed. Both criteria are
 * read off this rather than off the private name resolver, so a name hardcoded past
 * the resolver goes red too.
 */
let recordedOptions: AdapterOptions | null = null;

/**
 * Stands in for the SQLite adapter constructor and keeps what it was given. D-004
 * makes `createSqliteAdapter` generic over the constructed type, which is what lets
 * this go in at the call site with no cast.
 */
class RecordingAdapter {
  constructor(options: AdapterOptions) {
    recordedOptions = options;
  }
}

type CreateSqliteAdapter = (Adapter: new (options: AdapterOptions) => unknown) => unknown;

/**
 * `createSqliteAdapter.ts` does not exist yet and a bare require of a missing module
 * would abort the case before it reaches an assertion — the suite would read as
 * broken rather than as unimplemented. Resolve it defensively instead and fall back
 * to a stand-in that constructs nothing: `recordedOptions` then stays null and the
 * dbName assertion is what goes red. The stand-in can only ever leave a case red; it
 * can never turn one green.
 */
const inert: CreateSqliteAdapter = () => undefined;

const isModuleMissing = (error: unknown): boolean =>
  (error as { code?: string } | null)?.code === 'MODULE_NOT_FOUND' ||
  /Cannot find module/.test((error as Error | null)?.message ?? '');

const loadCreateSqliteAdapter = (): CreateSqliteAdapter => {
  try {
    const loaded = require('./createSqliteAdapter') as {
      createSqliteAdapter?: CreateSqliteAdapter;
    };
    return loaded.createSqliteAdapter ?? inert;
  } catch (error) {
    if (!isModuleMissing(error)) {
      throw error;
    }
    return inert;
  }
};

const config = Config as Record<string, string | undefined>;

let createSqliteAdapter: CreateSqliteAdapter;

beforeEach(() => {
  recordedOptions = null;
  createSqliteAdapter = loadCreateSqliteAdapter();
});

afterEach(() => {
  delete config.OPES_ENV;
});

describe('createSqliteAdapter', () => {
  it('AC-002 — hands the adapter constructor the database name opes in a normal build', () => {
    delete config.OPES_ENV;

    createSqliteAdapter(RecordingAdapter);

    // The one property whose cost of error is irreversible: an existing install's
    // database file is named `opes` and must stay named `opes`, character for
    // character.
    expect(recordedOptions?.dbName).toBe('opes');
  });

  it('AC-003 — hands the adapter constructor the database name opes_sandbox in a sandbox build', () => {
    config.OPES_ENV = 'sandbox';

    createSqliteAdapter(RecordingAdapter);

    expect(recordedOptions?.dbName).toBe('opes_sandbox');
  });
});
