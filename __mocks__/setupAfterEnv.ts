// setupFilesAfterEnv — runs after the test framework is installed.
// Clears AsyncStorage state before each test to prevent inter-test pollution.
import AsyncStorage from '@react-native-async-storage/async-storage';

beforeEach(async () => {
  await AsyncStorage.clear();
});
