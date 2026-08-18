import type { CardsRepositoryContract } from '../../src/models/cards/CardsRepository';

type CardsRepositoryStub = jest.Mocked<CardsRepositoryContract>;

/**
 * A stand-in for `CardsRepositoryContract` where only the method under test is
 * spelled out.
 *
 * Built on a Proxy rather than an object literal, and that is the whole point: a
 * literal has to name every method, so the nine-method stub was copied ten times
 * into one suite and adding a tenth contract method meant editing all ten. Here
 * a method is manufactured on first access, so the contract can grow and no test
 * changes.
 *
 * An un-overridden method REJECTS, naming itself. A test that reaches a method it
 * never stubbed has not said what it expects, and the alternative default —
 * resolving `undefined` — turns that into a confusing failure somewhere further
 * down, or into no failure at all.
 */
export const makeCardsRepositoryStub = (
  overrides: Partial<CardsRepositoryStub> = {},
): CardsRepositoryStub => {
  const manufactured = new Map<string, jest.Mock>();

  return new Proxy({} as CardsRepositoryStub, {
    get: (_target, property) => {
      if (typeof property !== 'string') {
        return undefined;
      }

      const override = (overrides as Record<string, unknown>)[property];
      if (override !== undefined) {
        return override;
      }

      // `await stub` and similar checks probe for `then`; answering with a mock
      // would make the stub look like a thenable and hang the caller.
      if (property === 'then') {
        return undefined;
      }

      const existing = manufactured.get(property);
      if (existing) {
        return existing;
      }

      const fallback = jest.fn(() =>
        Promise.reject(
          new Error(
            `CardsRepository.${property} was called but the test did not stub it`,
          ),
        ),
      );
      manufactured.set(property, fallback);
      return fallback;
    },

    // Keep `expect(stub.method).toHaveBeenCalled()` and spreading honest.
    has: (_target, property) =>
      typeof property === 'string' && property !== 'then',
  });
};
