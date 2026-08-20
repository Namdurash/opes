import Config from 'react-native-config';
import { isSandboxBuild } from '../../shared/env';
import { MonobankService } from './api';
import { clearMonobankService, getMonobankService } from './serviceInstance';

// react-native-config is an ordinary object under jest (test/setup.js), so the build
// flag is a property a case raises and lowers rather than something baked in.
const config = Config as Record<string, string | undefined>;

const CLIENT_INFO = {
  clientId: 'client-1',
  name: 'Test Client',
  webHookUrl: '',
  permissions: 'psfj',
  accounts: [],
  jars: [],
};

const originalFetch = global.fetch;
let fetchSpy: jest.Mock;

beforeEach(() => {
  delete config.OPES_ENV;

  fetchSpy = jest.fn(() => Promise.reject(new Error('fetch was called')));
  global.fetch = fetchSpy as unknown as typeof fetch;

  // The factory caches, and the cached service carries its rate limiter with it;
  // without this a case would read the previous one's answer.
  clearMonobankService();
});

afterEach(() => {
  global.fetch = originalFetch;
  delete config.OPES_ENV;
  clearMonobankService();
});

describe('getMonobankService', () => {
  it('AC-001 — hands back a real MonobankService in a non-sandbox build', async () => {
    // The criterion's precondition is a NON-sandbox build. Establish it through the
    // product's own reader rather than assuming the absent key means what we think.
    expect(isSandboxBuild()).toBe(false);

    const service = getMonobankService('any-token');
    expect(service instanceof MonobankService).toBe(true);

    // Which class the factory constructs matters because of where that class sends
    // its traffic, so the claim is carried through to the HTTP boundary rather than
    // stopping at the type: a normal build reaches the real host. Kept from OPES-59,
    // where it stood on its own — without it, a change that quietly routed production
    // traffic into the sandbox fake would still find this suite green.
    fetchSpy.mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve(CLIENT_INFO),
    });
    await service.getClientInfo();
    expect(String(fetchSpy.mock.calls[0]?.[0])).toContain('api.monobank.ua');

    // Both assertions above are only worth making if the factory could have answered
    // otherwise for this very token. Ask for the same string under the sandbox flag
    // and then once more under the normal one: a factory whose cache is keyed on the
    // token alone hands the sandbox answer straight back to the normal build, and
    // this criterion is false while everything above it still holds.
    config.OPES_ENV = 'sandbox';
    expect(getMonobankService('any-token') instanceof MonobankService).toBe(false);

    delete config.OPES_ENV;
    expect(getMonobankService('any-token') instanceof MonobankService).toBe(true);
  });
});
