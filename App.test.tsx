/**
 * @format
 */

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import type { Database } from '@nozbe/watermelondb';
import { createTestDatabase } from './test/db';

// The data layer reaches WatermelonDB through a module singleton, and importing
// that module is what used to open a real Loki database for the whole run — the
// handle that kept jest from exiting and forced `forceExit: true`. Replace the
// singleton's module rather than the barrel: the barrel also re-exports the schema
// and model classes that the test helper itself needs.
//
// `var`, not `let`: the jest.mock factory is hoisted above this declaration, and
// jest only lets a factory close over names beginning with `mock`.
var mockDatabase: Database;

jest.mock('./src/services/database/database', () => ({
  get database() {
    return mockDatabase;
  },
}));

import App from './App';
import { useUserStore } from './src/stores/useUserStore';

let teardown: () => Promise<void>;

beforeEach(() => {
  const testDatabase = createTestDatabase();
  mockDatabase = testDatabase.database;
  teardown = testDatabase.teardown;
});

afterEach(async () => {
  await teardown();
});

// WelcomeScreen (the initial route) runs real database work on mount via
// useUserStore.bootstrap() (hasAnyUser -> create). Resolve once that settles so no
// database work runs after the test tears down ("import after teardown").
const waitForBootstrap = (): Promise<void> =>
  new Promise(resolve => {
    if (useUserStore.getState().status !== 'bootstrapping') {
      resolve();
      return;
    }
    const unsubscribe = useUserStore.subscribe(state => {
      if (state.status !== 'bootstrapping') {
        unsubscribe();
        resolve();
      }
    });
  });

test('renders correctly', async () => {
  let tree!: ReturnType<typeof ReactTestRenderer.create>;

  await ReactTestRenderer.act(async () => {
    tree = ReactTestRenderer.create(<App />);
  });

  await ReactTestRenderer.act(async () => {
    await waitForBootstrap();
  });

  await ReactTestRenderer.act(async () => {
    tree.unmount();
  });
});
