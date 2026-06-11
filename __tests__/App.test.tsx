/**
 * @format
 */

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import App from '../App';
import { useUserStore } from '../src/stores/useUserStore';

// WelcomeScreen (the initial route) runs real WatermelonDB work on mount via
// useUserStore.bootstrap() (hasAnyUser -> create). Resolve once that settles so
// no LokiJS work runs after the test tears down ("import after teardown").
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
