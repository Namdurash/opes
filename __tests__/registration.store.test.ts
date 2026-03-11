import { createRegistrationStore } from '../src/features/registration/state/useRegistrationStore';

describe('registration store', () => {
  test('requires card name when card field is visible', async () => {
    const usersRepository = {
      create: jest.fn(),
      hasAnyUser: jest.fn(),
      findByName: jest.fn(),
    };
    const cardsRepository = { create: jest.fn() };
    const tokenStorageService = {
      saveToken: jest.fn(),
      getValidToken: jest.fn(),
      clear: jest.fn(),
    };

    const store = createRegistrationStore({
      usersRepository,
      cardsRepository,
      tokenStorageService,
    });

    store.getState().setName('Alex');
    store.getState().setPassword('1234');
    store.getState().showCardField();

    const success = await store.getState().submit();

    expect(success).toBe(false);
    expect(store.getState().errorMessage).toBe('Card name is required.');
    expect(usersRepository.create).not.toHaveBeenCalled();
  });

  test('creates user, optional card, and token', async () => {
    const usersRepository = {
      create: jest.fn().mockResolvedValue({ id: 'user-1' }),
      hasAnyUser: jest.fn(),
      findByName: jest.fn(),
    };
    const cardsRepository = {
      create: jest.fn().mockResolvedValue({ id: 'card-1' }),
    };
    const tokenStorageService = {
      saveToken: jest.fn().mockResolvedValue({ token: 'token', expiresAt: 1 }),
      getValidToken: jest.fn(),
      clear: jest.fn(),
    };
    const onSuccess = jest.fn();

    const store = createRegistrationStore({
      usersRepository,
      cardsRepository,
      tokenStorageService,
      onSuccess,
    });

    store.getState().setName('Alex');
    store.getState().setPassword('secret');
    store.getState().showCardField();
    store.getState().setCardName('Main card');

    const success = await store.getState().submit();

    expect(success).toBe(true);
    expect(usersRepository.create).toHaveBeenCalledTimes(1);
    expect(usersRepository.create.mock.calls[0][0].name).toBe('Alex');
    expect(usersRepository.create.mock.calls[0][0].passwordHash).toBeDefined();
    expect(usersRepository.create.mock.calls[0][0].passwordHash).not.toBe('secret');
    expect(cardsRepository.create).toHaveBeenCalledWith({
      userId: 'user-1',
      cardName: 'Main card',
    });
    expect(tokenStorageService.saveToken).toHaveBeenCalledTimes(1);
    expect(tokenStorageService.saveToken.mock.calls[0][1]).toBe(5 * 24 * 60 * 60 * 1000);
    expect(onSuccess).toHaveBeenCalledTimes(1);
  });
});
