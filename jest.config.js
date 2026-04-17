/** @type {import('jest').Config} */
const expoPreset = require('jest-expo/jest-preset');

module.exports = {
  ...expoPreset,
  testMatch: [
    '<rootDir>/src/__tests__/**/*.test.ts',
    '<rootDir>/src/**/__tests__/**/*.test.ts',
    '<rootDir>/src/__tests__/**/*.test.tsx',
    '<rootDir>/src/**/__tests__/**/*.test.tsx',
  ],
  testPathIgnorePatterns: ['/node_modules/', '/modu/'],
  transformIgnorePatterns: [
    ...(expoPreset.transformIgnorePatterns ?? []),
  ],
  moduleNameMapper: {
    ...(expoPreset.moduleNameMapper ?? {}),
    '^react-native-reanimated$': '<rootDir>/__mocks__/react-native-reanimated.ts',
    '^@react-native-async-storage/async-storage$':
      '<rootDir>/__mocks__/@react-native-async-storage/async-storage.ts',
    '^expo-router$': '<rootDir>/__mocks__/expo-router.ts',
    '^expo-font$': '<rootDir>/__mocks__/expo-font.ts',
    '^expo-constants$': '<rootDir>/__mocks__/expo-constants.ts',
  },
  setupFiles: [
    ...(expoPreset.setupFiles ?? []),
    '<rootDir>/__mocks__/setup.ts',
  ],
  setupFilesAfterEnv: [
    '<rootDir>/__mocks__/setupAfterEnv.ts',
  ],
};
