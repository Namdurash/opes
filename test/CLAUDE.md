# Shared test harness

Everything that exists **for** tests but is not itself a test. No `*.test.ts` lives
here — the harness is exercised through the suites that use it, which is why it has
no tests of its own.

```
test/
  db/         # createTestDatabase — a throwaway WatermelonDB per test case
  doubles/    # typed stand-ins for repository contracts
  factories/  # complete domain objects from partial overrides
  setup.js    # jest setupFiles entry — native-module mocks
  index.ts    # barrel
```

## Rules

- **Product code never imports from here.** Enforced by lint, not by convention: an
  import from `test/` inside `src/` is an error.
- **The database helper builds from the product schema and migration list**, never a
  copy, so drift breaks the suite. It does not replay the migration chain — no
  version-1 snapshot exists in the repo, and inventing one is its own ticket.
- **One database per test case.** Isolation is a property of the helper, not of
  jest's concurrency settings; `maxWorkers` and `runInBand` stay untouched.
- **Doubles manufacture their methods** rather than listing them, so a contract can
  grow without any test being edited. An un-stubbed method rejects and names itself.
- **Factories return a complete domain object** and take `Partial<T>` overrides. Call
  sites spell out only what they assert on.

`test.roots` in [../.aif/project.json](../.aif/project.json) points here: the foundry
freezes this tree so an implementation cannot quietly edit the harness it is judged
against. That is also why `setup.js` lives here rather than at the repo root.
