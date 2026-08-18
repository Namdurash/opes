// The one import nothing in the repo may make: react-test-renderer is deprecated
// upstream and was replaced wholesale by @testing-library/react-native. Banning it
// is what stops it drifting back in one suite at a time.
const noReactTestRenderer = {
  group: ['react-test-renderer', 'react-test-renderer/**'],
  message:
    'react-test-renderer is deprecated. Use @testing-library/react-native (render, screen, renderHook).',
};

// Product code must not reach into the shared test harness. test/ is test-only by
// construction — frozen by the foundry, outside the app's own reasoning — so an
// import from it inside src/ is a layering mistake, not a shortcut.
const noTestHarness = {
  group: ['**/test', '**/test/*', '**/test/**'],
  message:
    'Product code must not import from the shared test harness (test/). Move the helper into src/ if the app genuinely needs it.',
};

module.exports = {
  root: true,
  extends: '@react-native',
  rules: {
    // CLAUDE.md has said "never var" since the project started; until now nothing
    // checked it. Turned on here, with one honest exception below.
    'no-var': 'error',
    'no-restricted-imports': ['error', { patterns: [noReactTestRenderer] }],
  },
  overrides: [
    {
      // Test files inside src/ are exempt from the harness ban — using the harness
      // is exactly what they are for. The renderer ban still applies, which is why
      // both patterns are repeated: an override replaces a rule's options rather
      // than merging into them.
      files: ['src/**/*.ts', 'src/**/*.tsx', 'App.tsx', 'index.js'],
      excludedFiles: ['**/*.test.ts', '**/*.test.tsx'],
      rules: {
        'no-restricted-imports': [
          'error',
          { patterns: [noReactTestRenderer, noTestHarness] },
        ],
      },
    },
    {
      // jest hoists jest.mock factories above every declaration, and a factory may
      // only close over names that already exist at that point — which `let` and
      // `const` do not, being in their temporal dead zone. `var` is not a style
      // slip in these files, it is the only thing that works.
      files: [
        '**/*.test.ts',
        '**/*.test.tsx',
        'test/**/*.js',
        'test/**/*.ts',
        'jest.config.js',
      ],
      rules: {
        'no-var': 'off',
      },
    },
  ],
};
