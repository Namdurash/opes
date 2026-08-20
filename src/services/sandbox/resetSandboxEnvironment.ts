import { DatabaseMaintenanceRepository } from '../../models/maintenance';
import { isSandboxBuild } from '../../shared/env';
import { monobankAccountSelectionService } from '../monobank/MonobankAccountSelectionService';
import { monobankTokenService } from '../monobank/MonobankTokenService';

/** Raised when a sandbox-only action is reached from a normal build. */
export class SandboxOnlyError extends Error {
  constructor(message = 'This action is available only in the sandbox build.') {
    super(message);
    this.name = 'SandboxOnlyError';
  }
}

const databaseMaintenanceRepository = new DatabaseMaintenanceRepository();

/**
 * Returns the sandbox build to a first-launch state: every database row gone — including
 * the `users` row whose `checked_in` column is the onboarding flag — and the Monobank
 * token and account selection cleared out of key-value storage.
 *
 * Deliberately not atomic. A run interrupted part-way is recovered by running it again:
 * each step is idempotent, so a second run reaches the same end state as the first.
 */
export const resetSandboxEnvironment = async (): Promise<void> => {
  if (!isSandboxBuild()) {
    throw new SandboxOnlyError();
  }

  await databaseMaintenanceRepository.wipeAllData();
  monobankTokenService.clear();
  monobankAccountSelectionService.clear();
};
