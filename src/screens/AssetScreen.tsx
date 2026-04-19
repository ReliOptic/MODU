// §6 + §8 Asset routing container.
// Phase 3B: home tab now routes through the renderer-agnostic VARIATION_REGISTRY
// driven by ResolvedTPO + RendererBlock[] + TimelineDay[]. Other tabs unchanged.
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
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
import { getPalette, widgetTokens } from '../theme';
import { PlaceholderTab } from './PlaceholderTab';
import { CalendarTab } from './tabs/CalendarTab';
import { MoodTab } from './tabs/MoodTab';
import { PartnerTab } from './tabs/PartnerTab';
import { ChecklistTab } from './tabs/ChecklistTab';
import { InsightTab } from './tabs/InsightTab';
import { ShareTab } from './tabs/ShareTab';
import { ChapterCarousel } from './ChapterCarousel';
import { VARIATION_REGISTRY, selectVariation, resolveRecipeKey } from './variations';

const SCENE_EASE = Easing.bezier(0.32, 0.72, 0, 1);

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

  // §2.A — scene recedes 1.0→0.78 opacity 1→0.5 when carousel opens.
  const sceneScale = useSharedValue(1);
  const sceneOpacity = useSharedValue(1);

  useEffect(() => {
    sceneScale.value = withTiming(galleryOpen ? 0.78 : 1, {
      duration: 600,
      easing: SCENE_EASE,
    });
    sceneOpacity.value = withTiming(galleryOpen ? 0.5 : 1, {
      duration: 600,
      easing: SCENE_EASE,
    });
  }, [galleryOpen, sceneScale, sceneOpacity]);

  const sceneStyle = useAnimatedStyle(() => ({
    transform: [{ scale: sceneScale.value }],
    opacity: sceneOpacity.value,
  }));

  const openGallery = useCallback(() => setGalleryOpen(true), []);
  const closeGallery = useCallback(() => setGalleryOpen(false), []);
  const handleGallerySelect = useCallback(
    (id: string) => {
      setGalleryOpen(false);
      switchTo(id);
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
      // 2-axis dispatch: AssetType → primitive (R14), TPO funnel → mood.
      // Both are system-driven; there is no user picker.
      const recipeKey = resolveRecipeKey(current.type);
      const variationId = selectVariation(resolvedTPO);
      const Variation = VARIATION_REGISTRY[recipeKey][variationId];
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
    <View style={[styles.root, { backgroundColor: widgetTokens.baseBackground }]}>
      {/* v2.1 §3.1 L0 skin — subtle bgMesh over iOS systemBackground.
          Replaces the pastel {50,100,50} wash that flattened hero dominance. */}
      <LinearGradient
        colors={[palette.bgMesh[0] ?? 'transparent', palette.bgMesh[1] ?? 'transparent', 'transparent']}
        locations={[0, 0.6, 1]}
        style={StyleSheet.absoluteFillObject}
        pointerEvents="none"
      />
      <Animated.View style={[styles.scene, sceneStyle]} pointerEvents={galleryOpen ? 'none' : 'auto'}>
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
      </Animated.View>
      {pending && (
        <ChapterRitualOverlay
          visible={phase === 'ritual'}
          palette={pending.palette}
          label={pending.label}
        />
      )}
      <ChapterCarousel
        visible={galleryOpen}
        assets={assets}
        currentAssetId={currentAssetId}
        onClose={closeGallery}
        onSelect={handleGallerySelect}
        onCreateNew={handleGalleryCreateNew}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  scene: {
    flex: 1,
    zIndex: 1,
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 12,
    // Dropdown inside AssetSwitcher needs to paint on top of body + tab bar.
    position: 'relative',
    zIndex: 200,
    elevation: 200,
  },
  body: {
    flex: 1,
  },
});
