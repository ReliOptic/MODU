// §6 + §8 에셋별 라우팅 컨테이너
// 그라데이션 배경 + 헤더(AssetSwitcher) + 동적 탭바 + 활성 탭 컨텐츠
import React, { useState, useMemo, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated from 'react-native-reanimated';
import { useAssetStore } from '../store/assetStore';
import { useAssetTransition } from '../hooks/useAssetTransition';
import { AssetSwitcher } from '../components/AssetSwitcher';
import { TabBar } from '../components/TabBar';
import { getPalette, widgetTokens } from '../theme';
import { HomeTab } from './HomeTab';
import { PlaceholderTab } from './PlaceholderTab';

export interface AssetScreenProps {
  onCreateNew: () => void;
}

export function AssetScreen({ onCreateNew }: AssetScreenProps) {
  const allAssets = useAssetStore((s) => s.assets);
  const currentAssetId = useAssetStore((s) => s.currentAssetId);
  const archive = useAssetStore((s) => s.archiveAsset);

  const current = useMemo(
    () => allAssets.find((a) => a.id === currentAssetId) ?? null,
    [allAssets, currentAssetId]
  );
  const assets = useMemo(
    () => allAssets.filter((a) => a.status !== 'archived'),
    [allAssets]
  );

  const { switchTo, outgoingStyle } = useAssetTransition();
  const [activeTabId, setActiveTabId] = useState<string>('home');

  // 에셋 전환 시 home 으로 리셋
  useEffect(() => {
    setActiveTabId('home');
  }, [currentAssetId]);

  const palette = useMemo(
    () => (current ? getPalette(current.palette) : getPalette('dawn')),
    [current]
  );

  // 현재 활성 탭 라벨
  const activeTab = useMemo(
    () => current?.tabs.find((t) => t.id === activeTabId) ?? null,
    [current, activeTabId]
  );

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
        {current && activeTabId !== 'home' && activeTab && (
          <PlaceholderTab tabLabel={activeTab.label} palette={current.palette} />
        )}
      </Animated.View>
      {current && (
        <TabBar
          tabs={current.tabs}
          activeTabId={activeTabId}
          onSelect={setActiveTabId}
          palette={current.palette}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: widgetTokens.baseBackground,
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  body: {
    flex: 1,
  },
});
