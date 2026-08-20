import Config from 'react-native-config';
import { isSandboxBuild } from './env';

// `test/setup.js` hands react-native-config out as a plain object, so OPES_ENV is an
// ordinary property a case can add and remove. That seam only works because AS-003
// has the flag re-read the key on every call instead of capturing it at module load.
const config = Config as Record<string, string | undefined>;

afterEach(() => {
  delete config.OPES_ENV;
});

describe('isSandboxBuild', () => {
  it('AC-001 — reports a normal build when react-native-config exposes no OPES_ENV key', () => {
    delete config.OPES_ENV;
    // The criterion's precondition is an ABSENT key, not an empty one — D-003 keeps
    // the declaration honest about that, so spell it out rather than assume it.
    expect(Object.prototype.hasOwnProperty.call(config, 'OPES_ENV')).toBe(false);

    // Called optionally on purpose: until env.ts exports the flag this reads
    // `undefined`, so what goes red is the criterion's own literal rather than a
    // TypeError about calling a missing export.
    expect(isSandboxBuild?.()).toBe(false);
  });
});
