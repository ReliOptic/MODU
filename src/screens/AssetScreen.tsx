// §6 + §8 에셋별 라우팅 컨테이너
// 그라데이션 배경 + 헤더(AssetSwitcher) + 동적 탭바 + 활성 탭 컨텐츠
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated from 'react-native-reanimated';
import { useAssetStore } from '../store/assetStore';
import { useAssetTransition } from '../hooks/useAssetTransition';
import { AssetSwitcher } from '../components/AssetSwitcher';
import { TabBar } from '../components/TabBar';
import { ChapterRitualOverlay } from '../components/ChapterRitualOverlay';
import { DemoControlPanel } from '../components/DemoControlPanel';
import { getPalette, widgetTokens } from '../theme';
import { HomeTab } from './HomeTab';
import { PlaceholderTab } from './PlaceholderTab';
import { CalendarTab } from './tabs/CalendarTab';
import { MoodTab } from './tabs/MoodTab';
import { PartnerTab } from './tabs/PartnerTab';
import { ChecklistTab } from './tabs/ChecklistTab';
import { InsightTab } from './tabs/InsightTab';
import { ShareTab } from './tabs/ShareTab';
import { ChapterGalleryScreen } from './ChapterGalleryScreen';

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

  const { switchTo, outgoingStyle, phase, pending } = useAssetTransition();
  const [activeTabId, setActiveTabId] = useState<string>('home');
  const [galleryOpen, setGalleryOpen] = useState(false);

  const openGallery = useCallback(() => setGalleryOpen(true), []);
  const closeGallery = useCallback(() => setGalleryOpen(false), []);
  const handleGallerySelect = useCallback(
    (id: string) => {
      setGalleryOpen(false);
      setTimeout(() => switchTo(id), 180);
    },
    [switchTo]
  );
  const handleGalleryCreateNew = useCallback(() => {
    setGalleryOpen(false);
    setTimeout(() => onCreateNew(), 180);
  }, [onCreateNew]);

  function renderTabContent() {
    if (!current) return null;
    if (activeTabId === 'home') return <HomeTab asset={current} />;
    switch (activeTabId) {
      case 'calendar': return <CalendarTab asset={current} />;
      case 'mood':     return <MoodTab asset={current} />;
      case 'partner':  return <PartnerTab asset={current} />;
      case 'checklist': return <ChecklistTab asset={current} />;
      case 'insight':  return <InsightTab asset={current} />;
      case 'share':    return <ShareTab asset={current} />;
      default: {
        const fallbackTab = current.tabs.find((t) => t.id === activeTabId);
        return fallbackTab ? (
          <PlaceholderTab tabLabel={fallbackTab.label} palette={current.palette} />
        ) : null;
      }
    }
  }

  // 에셋 전환 시 home 으로 리셋
  useEffect(() => {
    setActiveTabId('home');
  }, [currentAssetId]);

  const palette = useMemo(
    () => (current ? getPalette(current.palette) : getPalette('dawn')),
    [current]
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
          onOpenGallery={openGallery}
        />
      </View>
      <Animated.View style={[styles.body, outgoingStyle as unknown as object]}>
        {renderTabContent()}
      </Animated.View>
      {current && (
        <TabBar
          tabs={current.tabs}
          activeTabId={activeTabId}
          onSelect={setActiveTabId}
          palette={current.palette}
        />
      )}
      {pending && (
        <ChapterRitualOverlay
          visible={phase === 'ritual'}
          palette={pending.palette}
          label={pending.label}
        />
      )}
      <ChapterGalleryScreen
        visible={galleryOpen}
        assets={assets}
        currentAssetId={currentAssetId}
        onClose={closeGallery}
        onSelect={handleGallerySelect}
        onCreateNew={handleGalleryCreateNew}
      />
      {/* Demo mode floating panel — investor 시연용 */}
      <DemoControlPanel />
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
    // Dropdown inside AssetSwitcher needs to paint on top of body + tab bar.
    // Without this, the absolute overlay gets covered by siblings rendered later.
    position: 'relative',
    zIndex: 200,
    elevation: 200,
  },
  body: {
    flex: 1,
  },
});
