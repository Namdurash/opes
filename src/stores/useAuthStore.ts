import { create } from 'zustand';
import { TokenStorageService, TokenStorageServiceContract } from '../services/auth';
import { UsersRepository, UsersRepositoryContract } from '../models/users';

export type AuthStatus = 'checking' | 'registered' | 'unregistered';

interface AuthStoreState {
  status: AuthStatus;
  bootstrap: () => Promise<void>;
  markRegistered: () => void;
}

interface AuthStoreDeps {
  usersRepository: UsersRepositoryContract;
  tokenStorageService: TokenStorageServiceContract;
}

export function createAuthStore(deps: AuthStoreDeps) {
  return create<AuthStoreState>(set => ({
    status: 'checking',
    bootstrap: async () => {
      set({ status: 'checking' });

      try {
        const [validToken, hasUser] = await Promise.all([
          deps.tokenStorageService.getValidToken(),
          deps.usersRepository.hasAnyUser(),
        ]);

        set({ status: validToken && hasUser ? 'registered' : 'unregistered' });
      } catch {
        set({ status: 'unregistered' });
      }
    },
    markRegistered: () => {
      set({ status: 'registered' });
    },
  }));
}

export const useAuthStore = createAuthStore({
  usersRepository: new UsersRepository(),
  tokenStorageService: new TokenStorageService(),
});
