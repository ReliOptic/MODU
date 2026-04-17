// Mock for expo-font
export const useFonts = jest.fn(() => [true, null]);
export const loadAsync = jest.fn(() => Promise.resolve());
export const isLoaded = jest.fn(() => true);
export const isLoading = jest.fn(() => false);
