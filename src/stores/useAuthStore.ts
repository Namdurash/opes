import { create } from 'zustand';
import { TokenStorageService, TokenStorageServiceContract } from '../services/auth';
import { UsersRepository, UsersRepositoryContract } from '../models/users';

export type AuthStatus = 'checking' | 'registered' | 'unregistered';

interface AuthStoreState {
  status: AuthStatus;
  currentUserId: string | null;
  bootstrap: () => Promise<void>;
  markRegistered: (userId: string) => void;
  signOut: () => Promise<void>;
}

interface AuthStoreDeps {
  usersRepository: UsersRepositoryContract;
  tokenStorageService: TokenStorageServiceContract;
}

export function createAuthStore(deps: AuthStoreDeps) {
  return create<AuthStoreState>(set => ({
    status: 'checking',
    currentUserId: null,
    bootstrap: async () => {
      set({ status: 'checking' });

      try {
        const validToken = await deps.tokenStorageService.getValidToken();

        if (!validToken) {
          set({ status: 'unregistered', currentUserId: null });
          return;
        }

        const user = await deps.usersRepository.findById(validToken.token);

        set({
          status: user ? 'registered' : 'unregistered',
          currentUserId: user?.id ?? null,
        });
      } catch {
        set({ status: 'unregistered', currentUserId: null });
      }
    },
    markRegistered: (userId: string) => {
      set({ status: 'registered', currentUserId: userId });
    },
    signOut: async () => {
      await deps.tokenStorageService.clear();
      set({ status: 'unregistered', currentUserId: null });
    },
  }));
}

export const useAuthStore = createAuthStore({
  usersRepository: new UsersRepository(),
  tokenStorageService: new TokenStorageService(),
});
