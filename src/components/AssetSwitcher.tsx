// §6.3 에셋 드롭다운 — 헤더 좌측 + bottom sheet
// "현재에셋이름 ▾" 탭 → 시트 → 에셋 목록 (filled dot for active) + 새 만들기
import React, { useCallback, useMemo, useRef } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
} from 'react-native';
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
}

export function AssetSwitcher({
  currentAsset,
  allAssets,
  onSwitch,
  onCreateNew,
  onArchive,
}: AssetSwitcherProps) {
  const sheetRef = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => ['40%', '60%'], []);

  const open = useCallback(() => sheetRef.current?.snapToIndex(0), []);
  const close = useCallback(() => sheetRef.current?.close(), []);

  const renderBackdrop = useCallback(
    (props: React.ComponentProps<typeof BottomSheetBackdrop>) => (
      <BottomSheetBackdrop {...props} appearsOnIndex={0} disappearsOnIndex={-1} opacity={0.45} />
    ),
    []
  );

  const handleSwitch = useCallback(
    (id: string) => {
      close();
      // 시트 닫힘 애니와 겹치지 않도록 살짝 지연
      setTimeout(() => onSwitch(id), 180);
    },
    [close, onSwitch]
  );

  const handleCreate = useCallback(() => {
    close();
    setTimeout(() => onCreateNew(), 180);
  }, [close, onCreateNew]);

  const handleLongPress = useCallback(
    (id: string) => {
      if (!onArchive) return;
      onArchive(id);
    },
    [onArchive]
  );

  return (
    <>
      <Pressable
        onPress={open}
        accessibilityRole="button"
        accessibilityLabel="에셋 전환"
        style={styles.trigger}
      >
        <Text style={styles.triggerLabel} numberOfLines={1}>
          {currentAsset?.displayName ?? '에셋 만들기'}
        </Text>
        <Text style={styles.chevron}>▾</Text>
      </Pressable>

      <BottomSheet
        ref={sheetRef}
        index={-1}
        snapPoints={snapPoints}
        enablePanDownToClose
        backdropComponent={renderBackdrop}
      >
        <ScrollView style={styles.sheetBody}>
          {allAssets.map((a) => {
            const isActive = a.id === currentAsset?.id;
            const p = getPalette(a.palette);
            return (
              <Pressable
                key={a.id}
                onPress={() => handleSwitch(a.id)}
                onLongPress={() => handleLongPress(a.id)}
                style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
              >
                <View style={[styles.dot, isActive ? { backgroundColor: p.accent } : { borderWidth: 1.5, borderColor: p.accent }]} />
                <View style={styles.rowText}>
                  <Text style={styles.rowTitle}>{a.displayName}</Text>
                  {isActive && <Text style={styles.rowMeta}>현재 활성</Text>}
                </View>
              </Pressable>
            );
          })}
          <Separator style={{ marginVertical: 8 }} />
          <Pressable onPress={handleCreate} style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}>
            <Text style={styles.plus}>＋</Text>
            <Text style={[styles.rowTitle, { marginLeft: 12 }]}>새 에셋 만들기</Text>
          </Pressable>
          {/* §T-SW-08: 1개일 땐 전환 옵션 없이 새 만들기만 */}
        </ScrollView>
      </BottomSheet>
    </>
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
});
