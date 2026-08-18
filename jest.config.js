module.exports = {
  preset: 'react-native',
  // Resolve react-native-worklets to its non-native build under jest, so reanimated v4
  // (pulled in via @gorhom/bottom-sheet) doesn't crash on "Worklets native not initialized".
  resolver: '<rootDir>/node_modules/react-native-worklets/jest/resolver.js',
  setupFiles: ['<rootDir>/jest.setup.js'],
  // Keep git-external trees out of jest entirely. `.claude/worktrees/` holds whole
  // checkouts that `.git/info/exclude` hides from git but jest happily scanned: their
  // suites ran beside the real ones, and their package.json / __mocks__ shadowed ours
  // in the Haste map. modulePathIgnorePatterns rather than testPathIgnorePatterns,
  // because two of the three symptoms came from module scanning, not test collection.
  modulePathIgnorePatterns: ['/\\.claude/'],
  // Native shims (reanimated/worklets timers, watermelondb loki worker) leave open
  // handles that keep jest from exiting; force exit once the suites finish so
  // `npm test` (the Definition-of-Done gate) doesn't hang.
  forceExit: true,
  // Stub static .svg asset imports. react-native-svg-transformer turns these
  // into components under Metro, but jest has no such transform.
  moduleNameMapper: {
    '\\.svg$': '<rootDir>/jest/svgMock.js',
  },
  transformIgnorePatterns: [
    'node_modules/(?!(@react-native|react-native|@react-navigation|react-native-safe-area-context|react-native-screens|react-native-gesture-handler|react-native-reanimated|react-native-worklets|@gorhom/bottom-sheet)/)',
  ],
};
