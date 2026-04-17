// Re-export the official async-storage mock so there is a single source of truth.
// This eliminates the module-level `store` that was shared across workers and
// caused inter-test pollution.
import mock from '@react-native-async-storage/async-storage/jest/async-storage-mock';
export default mock;
