// §6 + §8 Asset routing container.
// Phase 3B: home tab now routes through the renderer-agnostic VARIATION_REGISTRY
// driven by ResolvedTPO + RendererBlock[] + TimelineDay[]. Other tabs unchanged.
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated from 'react-native-reanimated';
import { useAssetStore } from '../store/assetStore';
import { useTPOStore } from '../store/tpoStore';
import { useMoodJournalStore } from '../store/moodJournalStore';
import { useAssetTransition } from '../hooks/useAssetTransition';
import {
  fromMoodEntries,
  groupByDay,
  resolveTPO,
  widgetsToBlocks,
  type TPOInputState,
} from '../adapters';
import { AssetSwitcher } from '../components/AssetSwitcher';
import { TabBar } from '../components/TabBar';
import { ChapterRitualOverlay } from '../components/ChapterRitualOverlay';
import { DemoControlPanel } from '../components/DemoControlPanel';
import { VariationPicker } from '../components/VariationPicker';
import { getPalette, widgetTokens } from '../theme';
import { PlaceholderTab } from './PlaceholderTab';
import { CalendarTab } from './tabs/CalendarTab';
import { MoodTab } from './tabs/MoodTab';
import { PartnerTab } from './tabs/PartnerTab';
import { ChecklistTab } from './tabs/ChecklistTab';
import { InsightTab } from './tabs/InsightTab';
import { ShareTab } from './tabs/ShareTab';
import { ChapterGalleryScreen } from './ChapterGalleryScreen';
import { VARIATION_REGISTRY } from './variations';

export interface AssetScreenProps {
  onCreateNew: () => void;
}

export function AssetScreen({ onCreateNew }: AssetScreenProps) {
  const allAssets = useAssetStore((s) => s.assets);
  const currentAssetId = useAssetStore((s) => s.currentAssetId);
  const archive = useAssetStore((s) => s.archiveAsset);

  const tpoLocale = useTPOStore((s) => s.locale);
  const tpoPlaceId = useTPOStore((s) => s.placeId);
  const tpoRoleOverride = useTPOStore((s) => s.role);
  const tpoNowOverride = useTPOStore((s) => s.nowOverride);
  const variationId = useTPOStore((s) => s.variationId);
  const setVariationId = useTPOStore((s) => s.setVariationId);

  const moodEntriesByAsset = useMoodJournalStore((s) => s.entriesByAsset);
  const hydrateMood = useMoodJournalStore((s) => s.hydrate);

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

  useEffect(() => {
    if (currentAssetId) hydrateMood(currentAssetId);
  }, [currentAssetId, hydrateMood]);

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

  // Asset 전환 시 home 으로 리셋
  useEffect(() => {
    setActiveTabId('home');
  }, [currentAssetId]);

  const palette = useMemo(
    () => (current ? getPalette(current.palette) : getPalette('dawn')),
    [current]
  );

  // ---- Adapter pipeline (Phase 3B) -----------------------------------------
  // Recompute resolved TPO whenever asset, TPO inputs, or wall-clock minute
  // changes. We tick once on mount + on TPO field changes; not on every render.
  const tpoState: TPOInputState = useMemo(
    () => ({
      locale: tpoLocale,
      placeId: tpoPlaceId,
      role: tpoRoleOverride,
      nowOverride: tpoNowOverride,
    }),
    [tpoLocale, tpoPlaceId, tpoRoleOverride, tpoNowOverride]
  );

  const resolvedTPO = useMemo(
    () => (current ? resolveTPO(current, tpoState, new Date()) : null),
    [current, tpoState]
  );

  const blocks = useMemo(
    () => (current ? widgetsToBlocks(current.widgets) : []),
    [current]
  );

  const timeline = useMemo(() => {
    if (!current) return [];
    const entries = moodEntriesByAsset[current.id] ?? [];
    return groupByDay(fromMoodEntries(entries), 'local');
  }, [current, moodEntriesByAsset]);

  function renderTabContent(): React.ReactNode {
    if (!current) return null;
    if (activeTabId === 'home') {
      if (!resolvedTPO) return null;
      const Variation = VARIATION_REGISTRY[variationId];
      return (
        <Variation
          tpo={resolvedTPO}
          blocks={blocks}
          timeline={timeline}
          palette={palette}
        />
      );
    }
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
        {activeTabId === 'home' && (
          <View style={styles.pickerSlot}>
            <VariationPicker
              value={variationId}
              onChange={(id) => { void setVariationId(id); }}
              palette={palette}
            />
          </View>
        )}
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
    gap: 12,
    // Dropdown inside AssetSwitcher needs to paint on top of body + tab bar.
    position: 'relative',
    zIndex: 200,
    elevation: 200,
  },
  pickerSlot: {
    paddingHorizontal: 4,
  },
  body: {
    flex: 1,
  },
});
