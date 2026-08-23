import type { MonobankApi, MonobankClientInfo, MonobankStatement } from '../types';
import { MonobankError, MONOBANK_UNAUTHORIZED_MESSAGE } from '../types';
import { transformClientInfo, transformStatements } from '../transformers';
import { SANDBOX_TEST_USERS } from './fixtures';
import type { SandboxTestUser } from './fixtures';

/**
 * Sandbox stand-in for `MonobankService`. Constructed with a token the same way the
 * real service is, but resolves it to a fixture user on every call rather than at
 * construction — so an unlisted token surfaces the same 401 wherever it is first
 * used, exactly as a real one would.
 *
 * Pure: no rate limiter, no timer, no module-level mutable state. Only the dates on
 * the returned statements move, and only because they are derived from the clock at
 * call time.
 */
export class SandboxMonobankService implements MonobankApi {
  constructor(private readonly token: string) {}

  async getClientInfo(): Promise<MonobankClientInfo> {
    const user = this.requireUser();
    return transformClientInfo(user.clientInfo);
  }

  async getStatements(
    _accountId: string,
    _from: Date,
    _to: Date,
  ): Promise<MonobankStatement[]> {
    const user = this.requireUser();
    return transformStatements(user.buildStatements(new Date()));
  }

  private requireUser(): SandboxTestUser {
    const user = SANDBOX_TEST_USERS.get(this.token);
    if (!user) {
      throw new MonobankError('UNAUTHORIZED', MONOBANK_UNAUTHORIZED_MESSAGE);
    }
    return user;
  }
}
