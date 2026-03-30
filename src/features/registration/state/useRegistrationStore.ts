import { create } from 'zustand';
import { hashPassword } from '../../../shared/security/hashPassword';
import { TokenStorageService, TokenStorageServiceContract } from '../../../services/auth';
import { CardsRepository, CardsRepositoryContract } from '../../../models/cards';
import { UsersRepository, UsersRepositoryContract } from '../../../models/users';

const FIVE_DAYS_MS = 5 * 24 * 60 * 60 * 1000;

export interface RegistrationStoreState {
  name: string;
  password: string;
  cardName: string;
  isCardVisible: boolean;
  isSubmitting: boolean;
  errorMessage: string | null;
  setName: (value: string) => void;
  setPassword: (value: string) => void;
  setCardName: (value: string) => void;
  showCardField: () => void;
  submit: () => Promise<string | null>;
  reset: () => void;
}

interface RegistrationStoreDeps {
  usersRepository: UsersRepositoryContract;
  cardsRepository: CardsRepositoryContract;
  tokenStorageService: TokenStorageServiceContract;
  onSuccess?: () => void;
}

const validate = ({
  name,
  password,
  isCardVisible,
  cardName,
}: Pick<RegistrationStoreState, 'name' | 'password' | 'isCardVisible' | 'cardName'>): string | null => {
  if (!name.trim()) {
    return 'Name is required.';
  }

  if (!password.trim()) {
    return 'Password is required.';
  }

  if (isCardVisible && !cardName.trim()) {
    return 'Card name is required.';
  }

  return null;
};

export const createRegistrationStore = (deps: RegistrationStoreDeps) => {
  const initialState = {
    name: '',
    password: '',
    cardName: '',
    isCardVisible: false,
    isSubmitting: false,
    errorMessage: null as string | null,
  };

  return create<RegistrationStoreState>((set, get) => ({
    ...initialState,
    setName: value => set({ name: value, errorMessage: null }),
    setPassword: value => set({ password: value, errorMessage: null }),
    setCardName: value => set({ cardName: value, errorMessage: null }),
    showCardField: () => set({ isCardVisible: true }),
    submit: async () => {
      const current = get();
      const validationError = validate(current);

      if (validationError) {
        set({ errorMessage: validationError });
        return null;
      }

      set({ isSubmitting: true, errorMessage: null });

      try {
        const user = await deps.usersRepository.create({
          name: current.name.trim(),
          passwordHash: hashPassword(current.password.trim()),
        });

        if (current.isCardVisible) {
          await deps.cardsRepository.createCard({
            userId: user.id,
            title: current.cardName.trim(),
            moneyAmount: 0,
            type: 'storage',
            image: null,
          });
        }

        await deps.tokenStorageService.saveToken(user.id, FIVE_DAYS_MS);
        deps.onSuccess?.();

        set(initialState);

        return user.id;
      } catch {
        set({ errorMessage: 'Registration failed. Please try again.' });
        return null;
      } finally {
        set({ isSubmitting: false });
      }
    },
    reset: () => set(initialState),
  }));
};

export const useRegistrationStore = createRegistrationStore({
  usersRepository: new UsersRepository(),
  cardsRepository: new CardsRepository(),
  tokenStorageService: new TokenStorageService(),
});
