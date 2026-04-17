// ConsentScreen unit tests
// - initial: all unchecked, button disabled
// - partial check: button still disabled
// - all checked: button enabled → tap → emit called + storage written
// - re-entry: storage present → readConsentRecord returns record (skip logic)
// - emit calls: consent_screen_shown on mount + 3x consent_decision_recorded on accept

import React from 'react';
import { render, fireEvent, act, waitFor } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { ConsentScreen, readConsentRecord, CONSENT_STORAGE_KEY, CONSENT_SCREEN_VERSION } from '../ConsentScreen';
import { emit } from '../../lib/events';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

jest.mock('expo-linear-gradient', () => ({
  LinearGradient: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

jest.mock('../../lib/events', () => ({
  emit: jest.fn(),
}));

const mockEmit = emit as jest.MockedFunction<typeof emit>;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function renderConsent(onAccepted = jest.fn()) {
  return render(<ConsentScreen onAccepted={onAccepted} />);
}

beforeEach(async () => {
  await AsyncStorage.clear();
  jest.clearAllMocks();
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('ConsentScreen', () => {
  it('emits consent_screen_shown on mount', () => {
    renderConsent();
    expect(mockEmit).toHaveBeenCalledWith('consent_screen_shown', {
      screen_version: CONSENT_SCREEN_VERSION,
    });
  });

  it('初期状態: all checkboxes unchecked, Begin button disabled', () => {
    const { getByRole, getAllByRole } = renderConsent();
    const checkboxes = getAllByRole('checkbox');
    expect(checkboxes).toHaveLength(3);
    checkboxes.forEach((cb) => {
      expect(cb.props.accessibilityState.checked).toBe(false);
    });
    const button = getByRole('button');
    expect(button.props.accessibilityState.disabled).toBe(true);
  });

  it('partial check (1/3): button still disabled', () => {
    const { getAllByRole, getByRole } = renderConsent();
    const checkboxes = getAllByRole('checkbox');
    fireEvent.press(checkboxes[0]);
    const button = getByRole('button');
    expect(button.props.accessibilityState.disabled).toBe(true);
  });

  it('partial check (2/3): button still disabled', () => {
    const { getAllByRole, getByRole } = renderConsent();
    const checkboxes = getAllByRole('checkbox');
    fireEvent.press(checkboxes[0]);
    fireEvent.press(checkboxes[1]);
    const button = getByRole('button');
    expect(button.props.accessibilityState.disabled).toBe(true);
  });

  it('all 3 checked: button enabled', () => {
    const { getAllByRole, getByRole } = renderConsent();
    const checkboxes = getAllByRole('checkbox');
    fireEvent.press(checkboxes[0]);
    fireEvent.press(checkboxes[1]);
    fireEvent.press(checkboxes[2]);
    const button = getByRole('button');
    expect(button.props.accessibilityState.disabled).toBe(false);
  });

  it('tap Begin: emits 3x consent_decision_recorded + writes storage + calls onAccepted', async () => {
    const onAccepted = jest.fn();
    const { getAllByRole, getByRole } = renderConsent(onAccepted);
    const checkboxes = getAllByRole('checkbox');
    fireEvent.press(checkboxes[0]);
    fireEvent.press(checkboxes[1]);
    fireEvent.press(checkboxes[2]);

    await act(async () => {
      fireEvent.press(getByRole('button'));
    });

    // 3 consent_decision_recorded calls (after mount emit which is consent_screen_shown)
    const decisionCalls = mockEmit.mock.calls.filter(
      ([name]) => name === 'consent_decision_recorded'
    );
    expect(decisionCalls).toHaveLength(3);

    const items = decisionCalls.map(([, props]) => (props as { item: string }).item);
    expect(items).toContain('local_default');
    expect(items).toContain('sync_future');
    expect(items).toContain('aggregate_research');

    // All decisions are 'acknowledged'
    decisionCalls.forEach(([, props]) => {
      expect((props as { decision: string }).decision).toBe('acknowledged');
    });

    // Storage written
    const raw = await AsyncStorage.getItem(CONSENT_STORAGE_KEY);
    expect(raw).not.toBeNull();
    const record = JSON.parse(raw!);
    expect(record.screen_version).toBe(CONSENT_SCREEN_VERSION);
    expect(record.items).toContain('local_default');

    // Navigation callback fired
    expect(onAccepted).toHaveBeenCalledTimes(1);
  });

  it('tap Begin disabled: does nothing when not all checked', async () => {
    const onAccepted = jest.fn();
    const { getByRole } = renderConsent(onAccepted);
    await act(async () => {
      fireEvent.press(getByRole('button'));
    });
    // Only the mount emit (consent_screen_shown), no decision events
    const decisionCalls = mockEmit.mock.calls.filter(
      ([name]) => name === 'consent_decision_recorded'
    );
    expect(decisionCalls).toHaveLength(0);
    expect(onAccepted).not.toHaveBeenCalled();
  });

  it('checkbox toggle: pressing checked item unchecks it', () => {
    const { getAllByRole } = renderConsent();
    const checkboxes = getAllByRole('checkbox');
    fireEvent.press(checkboxes[0]);
    expect(checkboxes[0].props.accessibilityState.checked).toBe(true);
    fireEvent.press(checkboxes[0]);
    expect(checkboxes[0].props.accessibilityState.checked).toBe(false);
  });

  it('writeConsentRecord reject: onAccepted NOT called + emit NOT called', async () => {
    // Simulate AsyncStorage failure during setItem using mockImplementationOnce
    // so the original implementation is preserved for subsequent tests.
    const originalSetItem = AsyncStorage.setItem;
    AsyncStorage.setItem = jest.fn().mockRejectedValueOnce(new Error('disk full')) as typeof AsyncStorage.setItem;

    const onAccepted = jest.fn();
    const { getAllByRole, getByRole } = renderConsent(onAccepted);
    const checkboxes = getAllByRole('checkbox');
    fireEvent.press(checkboxes[0]);
    fireEvent.press(checkboxes[1]);
    fireEvent.press(checkboxes[2]);

    await act(async () => {
      fireEvent.press(getByRole('button'));
    });

    // No consent_decision_recorded emitted (storage failed before emit)
    const decisionCalls = mockEmit.mock.calls.filter(
      ([name]) => name === 'consent_decision_recorded'
    );
    expect(decisionCalls).toHaveLength(0);

    // onAccepted must NOT be called
    expect(onAccepted).not.toHaveBeenCalled();

    // Restore original setItem so subsequent tests are not affected
    AsyncStorage.setItem = originalSetItem;
  });
});

// ---------------------------------------------------------------------------
// readConsentRecord — re-entry / skip logic
// ---------------------------------------------------------------------------

describe('readConsentRecord', () => {
  it('returns null when no storage entry', async () => {
    const result = await readConsentRecord();
    expect(result).toBeNull();
  });

  it('returns record when storage entry exists', async () => {
    const record = {
      screen_version: CONSENT_SCREEN_VERSION,
      accepted_at: new Date().toISOString(),
      items: ['local_default', 'sync_future', 'aggregate_research'],
    };
    await AsyncStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(record));

    const result = await readConsentRecord();
    expect(result).not.toBeNull();
    expect(result!.screen_version).toBe(CONSENT_SCREEN_VERSION);
    expect(result!.items).toHaveLength(3);
  });

  it('returns null on malformed storage data', async () => {
    await AsyncStorage.setItem(CONSENT_STORAGE_KEY, 'not-json{{{');
    const result = await readConsentRecord();
    expect(result).toBeNull();
  });
});
