import { createSignInStore } from '../src/features/sign-in/state/useSignInStore';
import { hashPassword } from '../src/shared/security/hashPassword';

describe('sign-in store', () => {
  test('requires name and password', async () => {
    const usersRepository = {
      create: jest.fn(),
      hasAnyUser: jest.fn(),
      findByName: jest.fn(),
    };
    const tokenStorageService = {
      saveToken: jest.fn(),
      getValidToken: jest.fn(),
      clear: jest.fn(),
    };

    const store = createSignInStore({
      usersRepository,
      tokenStorageService,
    });

    const success = await store.getState().submit();

    expect(success).toBe(false);
    expect(store.getState().errorMessage).toBe('Name is required.');
    expect(usersRepository.findByName).not.toHaveBeenCalled();
  });

  test('rejects invalid credentials', async () => {
    const usersRepository = {
      create: jest.fn(),
      hasAnyUser: jest.fn(),
      findByName: jest.fn().mockResolvedValue({
        id: 'user-1',
        name: 'Alex',
        passwordHash: hashPassword('secret'),
      }),
    };
    const tokenStorageService = {
      saveToken: jest.fn(),
      getValidToken: jest.fn(),
      clear: jest.fn(),
    };

    const store = createSignInStore({
      usersRepository,
      tokenStorageService,
    });

    store.getState().setName('Alex');
    store.getState().setPassword('wrong');

    const success = await store.getState().submit();

    expect(success).toBe(false);
    expect(store.getState().errorMessage).toBe('Invalid name or password.');
    expect(tokenStorageService.saveToken).not.toHaveBeenCalled();
  });

  test('saves token on successful sign-in', async () => {
    const usersRepository = {
      create: jest.fn(),
      hasAnyUser: jest.fn(),
      findByName: jest.fn().mockResolvedValue({
        id: 'user-1',
        name: 'Alex',
        passwordHash: hashPassword('secret'),
      }),
    };
    const tokenStorageService = {
      saveToken: jest.fn().mockResolvedValue({ token: 'token', expiresAt: 1 }),
      getValidToken: jest.fn(),
      clear: jest.fn(),
    };
    const onSuccess = jest.fn();

    const store = createSignInStore({
      usersRepository,
      tokenStorageService,
      onSuccess,
    });

    store.getState().setName('Alex');
    store.getState().setPassword('secret');

    const success = await store.getState().submit();

    expect(success).toBe(true);
    expect(usersRepository.findByName).toHaveBeenCalledWith('Alex');
    expect(tokenStorageService.saveToken).toHaveBeenCalledTimes(1);
    expect(tokenStorageService.saveToken.mock.calls[0][1]).toBe(5 * 24 * 60 * 60 * 1000);
    expect(onSuccess).toHaveBeenCalledTimes(1);
  });
});
