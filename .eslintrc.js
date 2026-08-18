module.exports = {
  root: true,
  extends: '@react-native',
  rules: {
    // CLAUDE.md has said "never var" since the project started; until now nothing
    // checked it. Turned on here, with one honest exception below.
    'no-var': 'error',
  },
  overrides: [
    {
      // Product code must not reach into the shared test harness. test/ is
      // test-only by construction — it is frozen by the foundry and excluded from
      // the app's own reasoning — so an import from it inside src/ is a layering
      // mistake, not a shortcut. Test files inside src/ are exempt: using the
      // harness is exactly what they are for.
      files: ['src/**/*.ts', 'src/**/*.tsx', 'App.tsx', 'index.js'],
      excludedFiles: ['**/*.test.ts', '**/*.test.tsx'],
      rules: {
        'no-restricted-imports': [
          'error',
          {
            patterns: [
              {
                group: ['**/test', '**/test/*', '**/test/**'],
                message:
                  'Product code must not import from the shared test harness (test/). Move the helper into src/ if the app genuinely needs it.',
              },
            ],
          },
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
