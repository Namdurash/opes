/* eslint-env jest */
// Mock native modules that aren't available in the jest environment.
// react-native-gesture-handler pulls in RNGestureHandlerModule (a native
// TurboModule); its official jest setup registers the mocks. This also covers
// @gorhom/bottom-sheet, which depends on gesture-handler.
import 'react-native-gesture-handler/jestSetup';

// react-native-reanimated ships ESM and needs native worklets; use its official
// jest mock so suites that pull it in (via @gorhom/bottom-sheet) can render.
jest.mock('react-native-reanimated', () => require('react-native-reanimated/mock'));
