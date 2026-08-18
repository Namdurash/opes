import { isSandboxBuild } from '../../shared/env';
import { MonobankService } from './api';
import { MonobankError } from './types';

let cached: { token: string; service: MonobankService } | null = null;

/**
 * The single door to Monobank — every sync trigger reaches the API through here.
 *
 * In the sandbox build the door is shut before the cache is even consulted, so no
 * MonobankService is ever constructed and there is nothing left that could reach the
 * network. The isolation is the absence of the call, not a token that fails.
 */
export const getMonobankService = (token: string): MonobankService => {
  if (isSandboxBuild()) {
    throw new MonobankError('FORBIDDEN', 'Monobank is unavailable in the sandbox build.');
  }

  if (!cached || cached.token !== token) {
    cached = { token, service: new MonobankService(token) };
  }
  return cached.service;
};

export const clearMonobankService = (): void => {
  cached = null;
};
