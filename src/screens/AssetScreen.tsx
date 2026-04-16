// §6 + §8 에셋별 라우팅 컨테이너
// 현재 에셋의 palette 배경 + 헤더(AssetSwitcher) + 탭 컨텐츠.
// expo-router/App entry는 별도 — AssetScreen은 logical container.
import React, { useState, useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated from 'react-native-reanimated';
import { useShallow } from 'zustand/react/shallow';
import { useAssetStore } from '../store/assetStore';
import { useAssetTransition } from '../hooks/useAssetTransition';
import { AssetSwitcher } from '../components/AssetSwitcher';
import { getPalette, widgetTokens } from '../theme';
import { HomeTab } from './HomeTab';

export interface AssetScreenProps {
  /** Formation 진입 콜백 */
  onCreateNew: () => void;
}

export function AssetScreen({ onCreateNew }: AssetScreenProps) {
  const allAssets = useAssetStore((s) => s.assets);
  const currentAssetId = useAssetStore((s) => s.currentAssetId);
  const current = useMemo(
    () => allAssets.find((a) => a.id === currentAssetId) ?? null,
    [allAssets, currentAssetId]
  );
  const assets = useMemo(
    () => allAssets.filter((a) => a.status !== 'archived'),
    [allAssets]
  );
  // useShallow 진입점 보장 (zustand v5)
  void useShallow;
  const archive = useAssetStore((s) => s.archiveAsset);
  const { switchTo, outgoingStyle } = useAssetTransition();
  const [activeTabId, setActiveTabId] = useState<string>('home');

  const palette = useMemo(() => (current ? getPalette(current.palette) : getPalette('dawn')), [current]);

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={[palette[50], palette[100], palette[50]]}
        locations={[0, 0.5, 1]}
        style={StyleSheet.absoluteFillObject}
      />
      <View style={styles.header}>
        <AssetSwitcher
          currentAsset={current}
          allAssets={assets}
          onSwitch={switchTo}
          onCreateNew={onCreateNew}
          onArchive={archive}
        />
      </View>
      <Animated.View style={[styles.body, outgoingStyle]}>
        {current && activeTabId === 'home' && <HomeTab asset={current} />}
        {/* TODO: 다른 탭 (calendar/mood/...) — phase 5/6 위젯 완성 후 라우팅 확장 */}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: widgetTokens.baseBackground,
  },
  header: {
    paddingTop: 60, // safe area + status bar
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  body: {
    flex: 1,
  },
});
