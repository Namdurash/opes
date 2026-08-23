import Config from 'react-native-config';
// Imported from the module rather than the categorization barrel on purpose: the
// barrel also re-exports CategorizationService, which pulls in the repositories and
// through them the real WatermelonDB singleton. Nothing here touches a database.
import { resolveCategoryByMcc } from '../../categorization/mccMapping';
import { clearMonobankService, getMonobankService } from '../serviceInstance';
import { MonobankError } from '../types';
import type { MonobankStatement } from '../types';

const config = Config as Record<string, string | undefined>;

/** The one token the fixture map holds. */
const TEST_TOKEN = 'test-user-1';

/** A test user has exactly one account; the fake ignores this argument anyway. */
const ACCOUNT_ID = 'sandbox-acc-1';

const DAY_MS = 24 * 60 * 60 * 1000;

interface StatementCall {
  /** The `to` bound handed to the call — "the call moment" the criteria speak of. */
  to: Date;
  statements: MonobankStatement[];
}

const loadStatements = async (): Promise<StatementCall> => {
  const to = new Date();
  const from = new Date(to.getTime() - DAY_MS);
  const statements = await getMonobankService(TEST_TOKEN).getStatements(
    ACCOUNT_ID,
    from,
    to,
  );
  return { to, statements };
};

const isSameCalendarDay = (left: Date, right: Date): boolean =>
  left.getFullYear() === right.getFullYear() &&
  left.getMonth() === right.getMonth() &&
  left.getDate() === right.getDate();

const calendarMonthKey = (date: Date): string =>
  `${date.getFullYear()}-${date.getMonth()}`;

beforeEach(() => {
  config.OPES_ENV = 'sandbox';
  clearMonobankService();
});

afterEach(() => {
  delete config.OPES_ENV;
  clearMonobankService();
});

describe('SandboxMonobankService token resolution', () => {
  it('AC-002 — raises the production UNAUTHORIZED error for a token that is not a test user', async () => {
    // Exact and case-sensitive: TEST-USER-1 is not test-user-1. The token is resolved
    // per call, so an unlisted one surfaces here, where a real 401 would.
    const error: unknown = await getMonobankService('TEST-USER-1')
      .getClientInfo()
      .then(
        () => null,
        (reason: unknown) => reason,
      );

    expect(error).toBeInstanceOf(MonobankError);
    expect((error as MonobankError).code).toBe('UNAUTHORIZED');
  });
});

describe('SandboxMonobankService statements', () => {
  it('AC-008 — returns the whole fixture set, ignoring the requested range', async () => {
    // The range asked for is one day; the fixtures span three months. A fake that
    // honoured `from`/`to` would answer with four.
    const { statements } = await loadStatements();

    expect(statements).toHaveLength(44);
  });

  it('AC-009 — dates 4 of them on the day of the call', async () => {
    const { to, statements } = await loadStatements();

    const today = statements.filter(statement => isSameCalendarDay(statement.time, to));

    expect(today).toHaveLength(4);
  });

  it('AC-010 — dates none of them after the call moment', async () => {
    const { to, statements } = await loadStatements();

    // Zero is trivially true of an empty answer; say out loud that there was one.
    expect(statements.length).toBeGreaterThan(0);

    const future = statements.filter(
      statement => statement.time.getTime() > to.getTime(),
    );

    expect(future).toHaveLength(0);
  });

  it('AC-011 — spreads them across 3 distinct calendar months', async () => {
    const { statements } = await loadStatements();

    const months = new Set(statements.map(statement => calendarMonthKey(statement.time)));

    expect(months.size).toBe(3);
  });

  it('AC-012 — carries a donations MCC on 4 of them', async () => {
    const { statements } = await loadStatements();

    const donations = statements.filter(
      statement => resolveCategoryByMcc(statement.mcc) === 'donations',
    );

    expect(donations).toHaveLength(4);
  });
});
