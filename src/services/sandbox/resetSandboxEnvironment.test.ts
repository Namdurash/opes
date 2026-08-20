import type { Database } from '@nozbe/watermelondb';
import { createTestDatabase } from '../../../test/db';

// The reset wipes the database through the repository layer, which reaches
// WatermelonDB via a module singleton rather than an injected handle — so the only
// way to point it at a throwaway instance is to replace that module. The barrel is
// left alone: it also re-exports the schema and model classes the helper needs.
//
// `var`, not `let`: the jest.mock factory is hoisted above this declaration, and
// jest only lets a factory close over names beginning with `mock`.
var mockDatabase: Database;

jest.mock('../database/database', () => ({
  get database() {
    return mockDatabase;
  },
}));

import Config from 'react-native-config';
import { CardsRepository } from '../../models/cards';
import { TransactionsRepository } from '../../models/transactions';
import { UsersRepository } from '../../models/users';
import { monobankTokenService } from '../monobank/MonobankTokenService';
import { monobankAccountSelectionService } from '../monobank/MonobankAccountSelectionService';
import { makeTransaction } from '../../../test/factories';
import type { CardModel, TransactionModel, UserModel } from '../database/models';

type ResetSandboxEnvironment = () => Promise<void>;

/**
 * `src/services/sandbox/resetSandboxEnvironment.ts` does not exist yet and a bare
 * require of a missing module would abort each case before it reaches an assertion —
 * the suite would read as broken rather than as unimplemented. Resolve it defensively
 * instead and fall back to a reset that does nothing: the seeded row then survives
 * and the row-count assertion is what goes red. The stand-in can only ever leave a
 * case red; it can never turn one green.
 */
const inertReset: ResetSandboxEnvironment = async () => {};

const isModuleMissing = (error: unknown): boolean =>
  (error as { code?: string } | null)?.code === 'MODULE_NOT_FOUND' ||
  /Cannot find module/.test((error as Error | null)?.message ?? '');

const loadResetSandboxEnvironment = (): ResetSandboxEnvironment => {
  try {
    const loaded = require('./resetSandboxEnvironment') as {
      resetSandboxEnvironment?: ResetSandboxEnvironment;
    };
    return loaded.resetSandboxEnvironment ?? inertReset;
  } catch (error) {
    if (!isModuleMissing(error)) {
      throw error;
    }
    return inertReset;
  }
};

const config = Config as Record<string, string | undefined>;

const cardsRepository = new CardsRepository();
const transactionsRepository = new TransactionsRepository();
const usersRepository = new UsersRepository();

const countTransactions = (): Promise<number> =>
  mockDatabase.get<TransactionModel>('transactions').query().fetchCount();
const countCards = (): Promise<number> =>
  mockDatabase.get<CardModel>('cards').query().fetchCount();
const countUsers = (): Promise<number> =>
  mockDatabase.get<UserModel>('users').query().fetchCount();

let resetSandboxEnvironment: ResetSandboxEnvironment;
let teardown: () => Promise<void>;

beforeEach(() => {
  const testDatabase = createTestDatabase();
  mockDatabase = testDatabase.database;
  teardown = testDatabase.teardown;
  resetSandboxEnvironment = loadResetSandboxEnvironment();

  config.OPES_ENV = 'sandbox';
  monobankTokenService.clear();
  monobankAccountSelectionService.clear();
});

afterEach(async () => {
  delete config.OPES_ENV;
  monobankTokenService.clear();
  monobankAccountSelectionService.clear();
  await teardown();
});

describe('resetSandboxEnvironment wipes the database', () => {
  it('AC-007 — leaves no transaction row behind', async () => {
    await transactionsRepository.upsertBatch([makeTransaction({ id: 'tx-1' })]);
    // The seed is the criterion's `given`, and it is what makes the zero below
    // falsifiable: against a table that never held a row, zero proves nothing.
    expect(await countTransactions()).toBe(1);

    await resetSandboxEnvironment();

    expect(await countTransactions()).toBe(0);
  });

  it('AC-008 — leaves no card row behind', async () => {
    await cardsRepository.createCard({
      userId: 'user-1',
      title: 'Manual',
      moneyAmount: 100,
      type: 'storage',
    });
    expect(await countCards()).toBe(1);

    await resetSandboxEnvironment();

    expect(await countCards()).toBe(0);
  });
});

describe('resetSandboxEnvironment clears the key-value storage', () => {
  it('AC-009 — leaves no Monobank token behind', async () => {
    monobankTokenService.save('token-sandbox', 'Test Client');
    expect(monobankTokenService.get()).not.toBeNull();

    await resetSandboxEnvironment();

    expect(monobankTokenService.get()).toBeNull();
  });

  it('AC-010 — leaves no account selection behind', async () => {
    monobankAccountSelectionService.setSelectedAccountIds(['acc-1']);
    expect(monobankAccountSelectionService.getSelectedAccountIds()).toEqual(['acc-1']);

    await resetSandboxEnvironment();

    expect(monobankAccountSelectionService.getSelectedAccountIds()).toBeNull();
  });
});

describe('resetSandboxEnvironment run twice', () => {
  it('AC-012 — leaves no user row behind on a second run', async () => {
    // The cycle the ticket asks for: reset, walk back through onboarding, reset
    // again. The row written BETWEEN the two calls is what makes the second call's
    // work observable — a second run over an already-empty database would be
    // trivially green, and `users.checked_in` is the onboarding flag itself, so a
    // reset that leaves the row in place would carry the app straight past
    // onboarding while every other criterion here stayed green.
    await resetSandboxEnvironment();

    const user = await usersRepository.create({ name: 'Sandbox user' });
    await usersRepository.markCheckedIn(user.id);
    expect(await countUsers()).toBe(1);

    await resetSandboxEnvironment();

    expect(await countUsers()).toBe(0);
  });
});

describe('resetSandboxEnvironment outside a sandbox build', () => {
  it('AC-013 — raises SandboxOnlyError in a normal build', async () => {
    delete config.OPES_ENV;

    // try/catch rather than `.catch()`: this must hold whether the guard rejects or
    // throws before the first await, and `.catch()` would only ever see the first.
    let raised: unknown;
    try {
      await resetSandboxEnvironment();
    } catch (error) {
      raised = error;
    }

    // Read off the constructor rather than `instanceof`: the class does not exist
    // yet, and `instanceof undefined` would throw instead of failing an assertion.
    expect((raised as Error | undefined)?.constructor.name).toBe('SandboxOnlyError');
  });
});
