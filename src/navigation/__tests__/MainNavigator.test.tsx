// MainNavigator — Formation auto-open regression tests
//
// Test 1: Boot with 0 active assets → Formation auto-opens (firstBootRef guard: first boot)
// Test 2: Archive last asset after initial boot with assets → Formation does NOT reopen

import React from 'react';
import { render, waitFor, act } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ---------------------------------------------------------------------------
// Mock all native / complex child modules so MainNavigator can be mounted
// ---------------------------------------------------------------------------

jest.mock('expo-status-bar', () => ({ StatusBar: () => null }));

jest.mock('react-native-gesture-handler', () => ({
  GestureHandlerRootView: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

jest.mock('react-native-safe-area-context', () => ({
  SafeAreaProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

jest.mock('expo-linear-gradient', () => ({
  LinearGradient: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// Stub child screens — only Modal visibility logic matters
jest.mock('../../screens/AssetScreen', () => ({
  AssetScreen: () => null,
}));
jest.mock('../../screens/FormationFlow', () => ({
  FormationFlow: () => null,
}));
jest.mock('../../screens/ConsentScreen', () => ({
  ConsentScreen: () => null,
  // Consent already accepted — skip ConsentScreen, enter main flow
  readConsentRecord: jest.fn().mockResolvedValue({
    screen_version: 'v1.0.0-2026-04-17',
    accepted_at: new Date().toISOString(),
    items: ['local_default', 'sync_future', 'aggregate_research'],
  }),
}));

// ---------------------------------------------------------------------------
// Controllable asset store mock
// jest.mock factory must only reference variables prefixed with "mock" (case-insensitive)
// ---------------------------------------------------------------------------

type MockAsset = { status: string };
interface MockStoreState {
  assets: MockAsset[];
  initialized: boolean;
}

let mockStoreAssets: MockAsset[] = [];
let mockStoreInitialized = false;

jest.mock('../../store/assetStore', () => ({
  useAssetStore: (selector: (s: MockStoreState) => unknown) =>
    selector({ assets: mockStoreAssets, initialized: mockStoreInitialized }),
  initAssetStore: jest.fn(),
}));

jest.mock('../../store/formationStore', () => ({
  useFormationStore: (selector: (s: { reset: () => void }) => unknown) =>
    selector({ reset: jest.fn() }),
}));

// ---------------------------------------------------------------------------
// Import after all mocks are set up
// ---------------------------------------------------------------------------
import { MainNavigator } from '../MainNavigator';
import { Modal } from 'react-native';

// ---------------------------------------------------------------------------

beforeEach(async () => {
  await AsyncStorage.clear();
  jest.clearAllMocks();
  mockStoreAssets = [];
  mockStoreInitialized = false;
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('MainNavigator Formation auto-open', () => {
  it('opens Formation on first boot when there are no active assets', async () => {
    mockStoreAssets = [];
    mockStoreInitialized = true;

    const utils = render(<MainNavigator />);

    // Wait for readConsentRecord to resolve → consentDone=true, then auto-open effect fires
    await waitFor(() => {
      const modal = utils.UNSAFE_getByType(Modal);
      expect(modal.props.visible).toBe(true);
    });

    utils.unmount();
  });

  it('does NOT reopen Formation after user archives their last asset (firstBootRef guard)', async () => {
    // Boot with 1 active asset — auto-open condition not met (assets.length > 0)
    mockStoreAssets = [{ status: 'active' }];
    mockStoreInitialized = true;

    const utils = render(<MainNavigator />);

    // Wait for consent to resolve and component to settle
    await waitFor(() => {
      const modal = utils.UNSAFE_getByType(Modal);
      expect(modal.props.visible).toBe(false);
    });

    // User archives the last asset → filtered list becomes empty
    mockStoreAssets = [{ status: 'archived' }];

    await act(async () => {
      utils.rerender(<MainNavigator />);
    });

    // Formation must remain closed — the effect deps are [consentDone, initialized],
    // not [assets], so archiving never retriggers the auto-open logic.
    const modal = utils.UNSAFE_getByType(Modal);
    expect(modal.props.visible).toBe(false);

    utils.unmount();
  });
});
