import { create } from 'zustand';
import { UsersRepository, UsersRepositoryContract } from '../models/users';

export type UserStatus = 'bootstrapping' | 'ready';

interface UserStoreState {
  status: UserStatus;
  currentUserId: string | null;
  isCheckedIn: boolean;
  bootstrap: () => Promise<void>;
  markCheckedIn: () => Promise<void>;
}

interface UserStoreDeps {
  usersRepository: UsersRepositoryContract;
}

export const createUserStore = (deps: UserStoreDeps) => {
  return create<UserStoreState>((set, get) => ({
    status: 'bootstrapping',
    currentUserId: null,
    isCheckedIn: false,
    bootstrap: async () => {
      const hasUser = await deps.usersRepository.hasAnyUser();

      if (hasUser) {
        const user = await deps.usersRepository.findFirst();
        set({ status: 'ready', currentUserId: user?.id ?? null, isCheckedIn: user?.checkedIn ?? false });
      } else {
        const user = await deps.usersRepository.create({ name: 'local' });
        set({ status: 'ready', currentUserId: user.id, isCheckedIn: false });
      }
    },
    markCheckedIn: async () => {
      const { currentUserId } = get();
      if (!currentUserId) {
        return;
      }

      await deps.usersRepository.markCheckedIn(currentUserId);
      set({ isCheckedIn: true });
    },
  }));
};

export const useUserStore = createUserStore({
  usersRepository: new UsersRepository(),
});
