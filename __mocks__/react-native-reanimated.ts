// react-native-reanimated v4 mock for Jest.
// v4 ships mock.js at the package root which re-exports src/mock.ts.
// We use that official mock and add worklet-related globals that the test
// environment needs but that the mock does not stub by default.

// Stub worklet globals before the mock module runs.
(global as any).__reanimatedWorkletInit = jest.fn();
if (typeof (global as any)._WORKLET === 'undefined') {
  (global as any)._WORKLET = false;
}
if (typeof (global as any).__reanimatedModuleProxy === 'undefined') {
  (global as any).__reanimatedModuleProxy = {};
}

const mock = require('react-native-reanimated/mock');

module.exports = {
  ...mock,
  __reanimatedWorkletInit: jest.fn(),
  _WORKLET: false,
};
