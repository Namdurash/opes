import { isSandboxBuild } from '../../shared/env';
import { MonobankService } from './api';
import { SandboxMonobankService } from './sandbox';
import type { MonobankApi } from './types';

let cached: { token: string; sandbox: boolean; service: MonobankApi } | null = null;

/**
 * The single door to Monobank — every sync trigger reaches the API through here.
 *
 * In the sandbox build the door hands back `SandboxMonobankService` instead of the
 * real `MonobankService` — same `MonobankApi` shape, so no caller above this factory
 * changes. The cache key carries the sandbox flag alongside the token: the flag can
 * flip between test cases while the token stays the same, and a token-only key would
 * hand back the wrong class.
 */
export const getMonobankService = (token: string): MonobankApi => {
  const sandbox = isSandboxBuild();

  if (!cached || cached.token !== token || cached.sandbox !== sandbox) {
    const service: MonobankApi = sandbox
      ? new SandboxMonobankService(token)
      : new MonobankService(token);
    cached = { token, sandbox, service };
  }

  return cached.service;
};

export const clearMonobankService = (): void => {
  cached = null;
};
