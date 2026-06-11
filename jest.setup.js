/* eslint-env jest */
// Mock native modules that aren't available in the jest environment.
// react-native-gesture-handler pulls in RNGestureHandlerModule (a native
// TurboModule); its official jest setup registers the mocks. This also covers
// @gorhom/bottom-sheet, which depends on gesture-handler.
import 'react-native-gesture-handler/jestSetup';

// react-native-reanimated ships ESM and needs native worklets; use its official
// jest mock so suites that pull it in (via @gorhom/bottom-sheet) can render.
jest.mock('react-native-reanimated', () => require('react-native-reanimated/mock'));

// react-native-image-picker ships untransformed TS source and a native module;
// stub the picker entry points the app imports.
jest.mock('react-native-image-picker', () => ({
  __esModule: true,
  launchImageLibrary: jest.fn(() => Promise.resolve({ didCancel: true })),
  launchCamera: jest.fn(() => Promise.resolve({ didCancel: true })),
}));

// react-native-linear-gradient is a native view; render a plain host element so
// screens that use it (Screen, TransactionListItem) mount under jest.
jest.mock('react-native-linear-gradient', () => {
  const React = require('react');
  const LinearGradient = ({ children, ...props }) =>
    React.createElement('LinearGradient', props, children);
  return { __esModule: true, default: LinearGradient };
});

// react-native-config inlines env values at build time on device; under jest it
// has no native backing, so expose an empty config object.
jest.mock('react-native-config', () => ({ __esModule: true, default: {} }));
