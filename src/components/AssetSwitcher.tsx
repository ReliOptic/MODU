// §6.3 에셋 드롭다운 — 헤더 좌측
// 네이티브: @gorhom/bottom-sheet 사용
// 웹: inline dropdown (BottomSheet의 web 제스처 미지원 우회)
import React, { useCallback, useMemo, useRef, useState, useEffect } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  Platform,
} from 'react-native';

// expo-haptics: native-only. Web resolves to a no-op shim.
let Haptics: {
  selectionAsync: () => Promise<void>;
  impactAsync: (style: string) => Promise<void>;
  ImpactFeedbackStyle: { Light: string };
} | null = null;
if (Platform.OS !== 'web') {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  Haptics = require('expo-haptics');
}
import BottomSheet, { BottomSheetBackdrop } from '@gorhom/bottom-sheet';
import type { Asset } from '../types';
import { getPalette, typography, widgetTokens } from '../theme';
import { Separator } from './ui';

export interface AssetSwitcherProps {
  currentAsset: Asset | null;
  allAssets: Asset[]; // active only
  onSwitch: (assetId: string) => void;
  onCreateNew: () => void;
  onArchive?: (assetId: string) => void;
  onOpenGallery?: () => void;
}

export function AssetSwitcher(props: AssetSwitcherProps) {
  if (Platform.OS === 'web') return <AssetSwitcherWeb {...props} />;
  return <AssetSwitcherNative {...props} />;
}

/* ───────────────────────────── Native (iOS/Android) ─────────────────────────── */

function AssetSwitcherNative({
  currentAsset,
  allAssets,
  onSwitch,
  onCreateNew,
  onArchive,
  onOpenGallery,
}: AssetSwitcherProps) {
  const sheetRef = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => ['40%', '60%'], []);

  const open = useCallback(() => sheetRef.current?.snapToIndex(0), []);
  const close = useCallback(() => sheetRef.current?.close(), []);

  const renderBackdrop = useCallback(
    (p: React.ComponentProps<typeof BottomSheetBackdrop>) => (
      <BottomSheetBackdrop {...p} appearsOnIndex={0} disappearsOnIndex={-1} opacity={0.45} />
    ),
    []
  );

  const handleSwitch = useCallback(
    (id: string) => {
      close();
      setTimeout(() => onSwitch(id), 180);
    },
    [close, onSwitch]
  );
  const handleCreate = useCallback(() => {
    close();
    setTimeout(() => onCreateNew(), 180);
  }, [close, onCreateNew]);
  const handleLongPress = useCallback(
    (id: string) => onArchive?.(id),
    [onArchive]
  );

  return (
    <>
      <TriggerButton currentAsset={currentAsset} onPress={open} onLongPress={onOpenGallery} />
      <BottomSheet
        ref={sheetRef}
        index={-1}
        snapPoints={snapPoints}
        enablePanDownToClose
        backdropComponent={renderBackdrop}
      >
        <ScrollView style={styles.sheetBody}>
          <AssetList
            allAssets={allAssets}
            currentAsset={currentAsset}
            onSwitch={handleSwitch}
            onLongPress={handleLongPress}
          />
          <Separator style={{ marginVertical: 8 }} />
          <CreateRow onPress={handleCreate} />
        </ScrollView>
      </BottomSheet>
    </>
  );
}

/* ────────────────────────────────── Web fallback ────────────────────────────── */

function AssetSwitcherWeb({
  currentAsset,
  allAssets,
  onSwitch,
  onCreateNew,
  onArchive,
  onOpenGallery,
}: AssetSwitcherProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<View | null>(null);

  useEffect(() => {
    if (!open || Platform.OS !== 'web') return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    const onClick = (e: MouseEvent) => {
      const node = rootRef.current as unknown as HTMLElement | null;
      if (node && e.target instanceof Node && !node.contains(e.target)) {
        setOpen(false);
      }
    };

    window.addEventListener('keydown', onKey);
    window.addEventListener('mousedown', onClick);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('mousedown', onClick);
    };
  }, [open]);

  const handleSwitch = useCallback((id: string) => {
    setOpen(false);
    setTimeout(() => onSwitch(id), 50);
  }, [onSwitch]);
  const handleCreate = useCallback(() => {
    setOpen(false);
    setTimeout(() => onCreateNew(), 50);
  }, [onCreateNew]);
  const handleLongPress = useCallback((id: string) => onArchive?.(id), [onArchive]);

  return (
    <View ref={rootRef} style={styles.webRoot}>
      <TriggerButton currentAsset={currentAsset} onPress={() => setOpen((v) => !v)} onLongPress={onOpenGallery} />
      {open && (
        <View
          style={styles.webMenu}
          accessibilityRole="menu"
          accessibilityLabel="에셋 전환"
        >
          <Text style={styles.webMenuTitle}>에셋 전환</Text>
          <ScrollView style={styles.webMenuScroll}>
            <AssetList
              allAssets={allAssets}
              currentAsset={currentAsset}
              onSwitch={handleSwitch}
              onLongPress={handleLongPress}
            />
            <Separator style={{ marginVertical: 6 }} />
            <CreateRow onPress={handleCreate} />
          </ScrollView>
        </View>
      )}
    </View>
  );
}

/* ─────────────────────────────────── 공통 sub UI ────────────────────────────── */

function TriggerButton({
  currentAsset,
  onPress,
  onLongPress,
}: {
  currentAsset: Asset | null;
  onPress: () => void;
  onLongPress?: () => void;
}) {
  // §2.A gesture grammar: tap → dropdown, long-press (≥280ms) → carousel.
  // Selection haptic at 120ms tells the user "we heard the hold"; impact('light')
  // fires at commit (onLongPress). Timers cancel on release/out so a brief tap
  // never feels a hold.
  const earlyHapticRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearEarly = useCallback(() => {
    if (earlyHapticRef.current) {
      clearTimeout(earlyHapticRef.current);
      earlyHapticRef.current = null;
    }
  }, []);

  const handlePressIn = useCallback(() => {
    if (!onLongPress) return;
    clearEarly();
    earlyHapticRef.current = setTimeout(() => {
      Haptics?.selectionAsync().catch(() => undefined);
    }, 120);
  }, [onLongPress, clearEarly]);

  const handleLongPress = useCallback(() => {
    clearEarly();
    if (onLongPress) {
      Haptics?.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => undefined);
      onLongPress();
    }
  }, [onLongPress, clearEarly]);

  return (
    <Pressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={clearEarly}
      onLongPress={onLongPress ? handleLongPress : undefined}
      delayLongPress={280}
      accessibilityRole="button"
      accessibilityLabel="에셋 전환"
      accessibilityHint="길게 눌러 챕터 캐러셀 열기"
      style={styles.trigger}
    >
      <Text style={styles.triggerLabel} numberOfLines={1}>
        {currentAsset?.displayName ?? '에셋 만들기'}
      </Text>
      <Text style={styles.chevron}>▾</Text>
    </Pressable>
  );
}

function AssetList({
  allAssets,
  currentAsset,
  onSwitch,
  onLongPress,
}: {
  allAssets: Asset[];
  currentAsset: Asset | null;
  onSwitch: (id: string) => void;
  onLongPress: (id: string) => void;
}) {
  return (
    <>
      {allAssets.map((a) => {
        const isActive = a.id === currentAsset?.id;
        const p = getPalette(a.palette);
        return (
          <Pressable
            key={a.id}
            onPress={() => onSwitch(a.id)}
            onLongPress={() => onLongPress(a.id)}
            style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
          >
            <View
              style={[
                styles.dot,
                isActive
                  ? { backgroundColor: p.accent }
                  : { borderWidth: 1.5, borderColor: p.accent },
              ]}
            />
            <View style={styles.rowText}>
              <Text style={styles.rowTitle}>{a.displayName}</Text>
              {isActive && <Text style={styles.rowMeta}>현재 활성</Text>}
            </View>
          </Pressable>
        );
      })}
    </>
  );
}

function CreateRow({ onPress }: { onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
    >
      <Text style={styles.plus}>＋</Text>
      <Text style={[styles.rowTitle, { marginLeft: 12 }]}>새 에셋 만들기</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 4,
    paddingVertical: 6,
  },
  triggerLabel: {
    ...typography.headline,
    color: widgetTokens.textPrimary,
    maxWidth: 220,
  },
  chevron: {
    ...typography.headline,
    marginLeft: 4,
    color: widgetTokens.textSecondary,
  },
  sheetBody: {
    paddingHorizontal: 16,
    paddingTop: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 14,
    borderRadius: 12,
  },
  rowPressed: {
    backgroundColor: 'rgba(60,60,67,0.06)',
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  rowText: {
    flex: 1,
  },
  rowTitle: {
    ...typography.body,
    color: widgetTokens.textPrimary,
  },
  rowMeta: {
    ...typography.caption1,
    color: widgetTokens.textSecondary,
    marginTop: 2,
  },
  plus: {
    ...typography.title1,
    color: widgetTokens.textSecondary,
    width: 24,
    textAlign: 'center',
  },
  /* Web fallback — anchored to trigger, stays inside MobileFrame */
  webRoot: {
    position: 'relative',
    ...(Platform.OS === 'web' ? { zIndex: 100 } : {}),
  },
  webMenu: {
    position: 'absolute',
    top: '100%',
    left: 0,
    marginTop: 8,
    width: 280,
    maxWidth: 360,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingVertical: 8,
    paddingHorizontal: 8,
    ...(Platform.OS === 'web'
      ? ({ boxShadow: '0 8px 24px rgba(0,0,0,0.18)' } as unknown as object)
      : {
          shadowColor: '#000',
          shadowOpacity: 0.18,
          shadowRadius: 24,
          shadowOffset: { width: 0, height: 8 },
        }),
  },
  webMenuScroll: {
    maxHeight: 360,
  },
  webMenuTitle: {
    ...typography.footnote,
    color: widgetTokens.textTertiary,
    paddingHorizontal: 12,
    paddingTop: 4,
    paddingBottom: 6,
    fontWeight: '600',
  },
});
