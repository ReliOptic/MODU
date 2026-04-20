// §3.4 reduce-motion hook test.
// Mocks AccessibilityInfo.isReduceMotionEnabled returning true
// and asserts useReduceMotion() returns true.
// Uses jest.spyOn to avoid spreading react-native (triggers native module errors).
import { renderHook, act } from '@testing-library/react-native';
import { AccessibilityInfo } from 'react-native';
import { useReduceMotion } from '../hooks/useReduceMotion';

describe('useReduceMotion', () => {
  beforeEach(() => {
    jest
      .spyOn(AccessibilityInfo, 'addEventListener')
      .mockReturnValue({ remove: jest.fn() } as any);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('returns true when OS reduce-motion is enabled', async () => {
    jest
      .spyOn(AccessibilityInfo, 'isReduceMotionEnabled')
      .mockResolvedValue(true);

    const { result } = renderHook(() => useReduceMotion());

    expect(result.current).toBe(false); // initial state before promise resolves

    await act(async () => {});

    expect(result.current).toBe(true);
  });

  it('returns false when OS reduce-motion is disabled', async () => {
    jest
      .spyOn(AccessibilityInfo, 'isReduceMotionEnabled')
      .mockResolvedValue(false);

    const { result } = renderHook(() => useReduceMotion());

    await act(async () => {});

    expect(result.current).toBe(false);
  });
});
