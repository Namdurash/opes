import { create } from 'zustand';
import { hashPassword } from '../../../shared/security/hashPassword';
import { TokenStorageService, TokenStorageServiceContract } from '../../../services/auth';
import { UsersRepository, UsersRepositoryContract } from '../../../models/users';

const FIVE_DAYS_MS = 5 * 24 * 60 * 60 * 1000;

export interface SignInStoreState {
  name: string;
  password: string;
  isSubmitting: boolean;
  errorMessage: string | null;
  setName: (value: string) => void;
  setPassword: (value: string) => void;
  submit: () => Promise<boolean>;
  reset: () => void;
}

interface SignInStoreDeps {
  usersRepository: UsersRepositoryContract;
  tokenStorageService: TokenStorageServiceContract;
  onSuccess?: () => void;
}

function validate({
  name,
  password,
}: Pick<SignInStoreState, 'name' | 'password'>): string | null {
  if (!name.trim()) {
    return 'Name is required.';
  }

  if (!password.trim()) {
    return 'Password is required.';
  }

  return null;
}

export function createSignInStore(deps: SignInStoreDeps) {
  const initialState = {
    name: '',
    password: '',
    isSubmitting: false,
    errorMessage: null as string | null,
  };

  return create<SignInStoreState>((set, get) => ({
    ...initialState,
    setName: value => set({ name: value, errorMessage: null }),
    setPassword: value => set({ password: value, errorMessage: null }),
    submit: async () => {
      const current = get();
      const validationError = validate(current);

      if (validationError) {
        set({ errorMessage: validationError });
        return false;
      }

      set({ isSubmitting: true, errorMessage: null });

      try {
        const user = await deps.usersRepository.findByName(current.name.trim());
        const passwordHash = hashPassword(current.password.trim());

        if (!user || user.passwordHash !== passwordHash) {
          set({ errorMessage: 'Invalid name or password.' });
          return false;
        }

        await deps.tokenStorageService.saveToken(undefined, FIVE_DAYS_MS);
        deps.onSuccess?.();
        set(initialState);

        return true;
      } catch {
        set({ errorMessage: 'Sign in failed. Please try again.' });
        return false;
      } finally {
        set({ isSubmitting: false });
      }
    },
    reset: () => set(initialState),
  }));
}

export const useSignInStore = createSignInStore({
  usersRepository: new UsersRepository(),
  tokenStorageService: new TokenStorageService(),
});
