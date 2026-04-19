// v2.1 §2.A — chevron-morph chapter carousel.
// Replaces ChapterGalleryScreen. Not a nav destination: gesture-revealed
// from AssetSwitcher chevron long-press. Each card is composed by the §9
// recipe for that chapter's AssetType (per-asset texture peek, not a skin).
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Platform,
  useWindowDimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { getPalette, typography, r, s } from '../theme';
import type { PaletteKey } from '../theme';
import { resolveRecipeKey, RECIPES, type Primitive } from '../theme/recipes';
import type { Asset } from '../types';

let Haptics: {
  selectionAsync: () => Promise<void>;
  impactAsync: (style: string) => Promise<void>;
  ImpactFeedbackStyle: { Light: string; Medium: string };
} | null = null;
if (Platform.OS !== 'web') {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  Haptics = require('expo-haptics');
}

const ZOOM_MS = 600;
const RITUAL_MS = 920;
const RITUAL_HOLD_MS = 640;
const ENTRY_EASE = Easing.bezier(0.32, 0.72, 0, 1);
const EXIT_OUT_EASE = Easing.bezier(0.4, 0, 1, 1);

export interface ChapterCarouselProps {
  readonly visible: boolean;
  readonly assets: readonly Asset[];
  readonly currentAssetId: string | null;
  readonly onClose: () => void;
  readonly onSelect: (id: string) => void;
  readonly onCreateNew: () => void;
}

export function ChapterCarousel({
  visible,
  assets,
  currentAssetId,
  onClose,
  onSelect,
  onCreateNew,
}: ChapterCarouselProps) {
  const { width, height } = useWindowDimensions();
  const cardWidth = Math.min(width - s.lg * 2, 360);
  const cardHeight = Math.min(height * 0.78, cardWidth * 1.42);
  const snapInterval = cardWidth + s.md;

  const overlayOpacity = useSharedValue(0);
  const contentScale = useSharedValue(1.06);
  const contentOpacity = useSharedValue(0);

  const [shouldRender, setShouldRender] = useState(visible);
  const switchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hapticTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const onExitComplete = useCallback(() => {
    setShouldRender(false);
  }, []);

  const initialIndex = useMemo(() => {
    const idx = assets.findIndex((a) => a.id === currentAssetId);
    return idx < 0 ? 0 : idx;
  }, [assets, currentAssetId]);

  const [activeIndex, setActiveIndex] = useState(initialIndex);
  const lastIndexRef = useRef(initialIndex);
  const listRef = useRef<FlatList<Asset | null>>(null);

  useEffect(() => {
    if (visible) {
      cancelAnimation(overlayOpacity);
      cancelAnimation(contentScale);
      cancelAnimation(contentOpacity);
      setShouldRender(true);
      overlayOpacity.value = withTiming(1, { duration: ZOOM_MS, easing: ENTRY_EASE });
      contentScale.value = withTiming(1, { duration: ZOOM_MS, easing: ENTRY_EASE });
      contentOpacity.value = withTiming(1, { duration: ZOOM_MS, easing: ENTRY_EASE });
    } else {
      overlayOpacity.value = withTiming(0, { duration: ZOOM_MS, easing: ENTRY_EASE }, (finished) => {
        if (finished) runOnJS(onExitComplete)();
      });
      contentScale.value = withTiming(1.06, { duration: ZOOM_MS, easing: ENTRY_EASE });
      contentOpacity.value = withTiming(0, { duration: ZOOM_MS, easing: ENTRY_EASE });
    }
  }, [visible, overlayOpacity, contentScale, contentOpacity, onExitComplete]);

  useEffect(() => {
    return () => {
      if (hapticTimeoutRef.current) clearTimeout(hapticTimeoutRef.current);
      if (switchTimeoutRef.current) clearTimeout(switchTimeoutRef.current);
    };
  }, []);

  const overlayStyle = useAnimatedStyle(() => ({ opacity: overlayOpacity.value }));
  const contentStyle = useAnimatedStyle(() => ({
    opacity: contentOpacity.value,
    transform: [{ scale: contentScale.value }],
  }));

  const handleScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const idx = Math.round(e.nativeEvent.contentOffset.x / snapInterval);
      if (idx !== lastIndexRef.current) {
        lastIndexRef.current = idx;
        setActiveIndex(idx);
        if (Haptics) Haptics.selectionAsync().catch(() => undefined);
      }
    },
    [snapInterval]
  );

  const commitSwitch = useCallback(
    (id: string) => {
      if (id === currentAssetId) {
        onClose();
        return;
      }
      if (switchTimeoutRef.current !== null) return;
      if (Haptics) {
        if (hapticTimeoutRef.current) clearTimeout(hapticTimeoutRef.current);
        hapticTimeoutRef.current = setTimeout(() => {
          Haptics?.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => undefined);
        }, RITUAL_HOLD_MS);
      }
      overlayOpacity.value = withTiming(0, {
        duration: RITUAL_MS,
        easing: EXIT_OUT_EASE,
      });
      contentOpacity.value = withTiming(0, {
        duration: RITUAL_MS,
        easing: EXIT_OUT_EASE,
      });
      if (switchTimeoutRef.current) clearTimeout(switchTimeoutRef.current);
      switchTimeoutRef.current = setTimeout(() => {
        onSelect(id);
        onClose();
      }, RITUAL_MS - 140);
    },
    [currentAssetId, onClose, onSelect, overlayOpacity, contentOpacity]
  );

  const handleCreate = useCallback(() => {
    onClose();
    setTimeout(onCreateNew, 180);
  }, [onClose, onCreateNew]);

  const totalCount = assets.length + 1;

  const renderItem = useCallback(
    ({ item, index }: { item: Asset | null; index: number }) => (
      <View
        style={[
          styles.itemWrapper,
          {
            width: cardWidth,
            marginLeft: index === 0 ? (width - cardWidth) / 2 : s.md / 2,
            marginRight: index === totalCount - 1 ? (width - cardWidth) / 2 : s.md / 2,
          },
        ]}
      >
        {item === null ? (
          <NewChapterTile
            cardWidth={cardWidth}
            cardHeight={cardHeight}
            onPress={handleCreate}
          />
        ) : (
          <ChapterCard
            asset={item}
            active={item.id === currentAssetId}
            cardWidth={cardWidth}
            cardHeight={cardHeight}
            onPress={() => commitSwitch(item.id)}
          />
        )}
      </View>
    ),
    [cardWidth, cardHeight, width, totalCount, currentAssetId, commitSwitch, handleCreate]
  );

  const data: (Asset | null)[] = useMemo(() => [...assets, null], [assets]);

  if (!shouldRender) return null;

  return (
    <Animated.View
      style={[StyleSheet.absoluteFillObject, styles.root, overlayStyle]}
      pointerEvents={visible ? 'auto' : 'none'}
    >
      <Animated.View style={[styles.content, contentStyle]}>
        <View style={styles.header}>
          <Text style={styles.title}>내 챕터</Text>
          <Pressable
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel="캐러셀 닫기"
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            style={styles.closeBtn}
          >
            <Ionicons name="close" size={22} color="#FFFFFF" />
          </Pressable>
        </View>

        <FlatList
          ref={listRef}
          data={data}
          keyExtractor={(_, i) => String(i)}
          renderItem={renderItem}
          horizontal
          snapToInterval={snapInterval}
          snapToAlignment="start"
          decelerationRate="fast"
          showsHorizontalScrollIndicator={false}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          initialScrollIndex={initialIndex}
          getItemLayout={(_, index) => ({
            length: snapInterval,
            offset: snapInterval * index,
            index,
          })}
          contentContainerStyle={styles.listContent}
        />

        <ProgressDots count={totalCount} activeIndex={activeIndex} assets={assets} />
      </Animated.View>
    </Animated.View>
  );
}

// ─── Per-chapter card ────────────────────────────────────────────────────────

interface ChapterCardProps {
  readonly asset: Asset;
  readonly active: boolean;
  readonly cardWidth: number;
  readonly cardHeight: number;
  readonly onPress: () => void;
}

function ChapterCard({ asset, active, cardWidth, cardHeight, onPress }: ChapterCardProps) {
  const palette = getPalette(asset.palette);
  const recipeKey = resolveRecipeKey(asset.type);
  const primitive: Primitive = RECIPES[recipeKey].primitive;

  const scale = useSharedValue(active ? 1 : 0.94);
  const opacity = useSharedValue(active ? 1 : 0.7);

  useEffect(() => {
    scale.value = withTiming(active ? 1 : 0.94, { duration: 220, easing: ENTRY_EASE });
    opacity.value = withTiming(active ? 1 : 0.7, { duration: 220, easing: ENTRY_EASE });
  }, [active, scale, opacity]);

  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const phaseLabel = phaseLabelFor(asset);

  return (
    <Animated.View style={[styles.card, { width: cardWidth, height: cardHeight }, cardStyle]}>
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={`${asset.displayName} 챕터 열기`}
        style={StyleSheet.absoluteFill}
      >
        <LinearGradient
          colors={[palette.heroGradient.top, palette.heroGradient.mid, palette.heroGradient.bottom]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0.8, y: 1 }}
          style={StyleSheet.absoluteFillObject}
        />
        {asset.photoUri ? (
          <Image
            source={{ uri: asset.photoUri }}
            style={[StyleSheet.absoluteFillObject, { opacity: 0.92 }]}
            resizeMode="cover"
          />
        ) : null}

        <TexturePeek primitive={primitive} palette={asset.palette} />

        <LinearGradient
          colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.6)']}
          locations={[0.5, 1]}
          style={styles.captionScrim}
          pointerEvents="none"
        />

        <View style={styles.titleBleed}>
          <Text style={styles.titleLine} numberOfLines={2}>
            {asset.displayName}
          </Text>
        </View>

        <View style={styles.captionRow}>
          <Text style={styles.phaseLabel} numberOfLines={1}>
            {phaseLabel}
          </Text>
          {active ? <Text style={styles.activePill}>현재</Text> : null}
        </View>
      </Pressable>
    </Animated.View>
  );
}

function phaseLabelFor(asset: Asset): string {
  const days = Math.max(0, Math.floor((Date.now() - new Date(asset.createdAt).getTime()) / 86_400_000));
  if (days === 0) return '오늘 시작';
  if (days < 7) return `${days}일째`;
  if (days < 30) return `${Math.floor(days / 7)}주째`;
  return `${Math.floor(days / 30)}개월째`;
}

// ─── §9 per-primitive texture peek ────────────────────────────────────────────

function TexturePeek({ primitive, palette }: { primitive: Primitive; palette: PaletteKey }) {
  const p = getPalette(palette);
  const tint = `${p.accent}55`;
  const strong = `${p.accent}AA`;

  switch (primitive) {
    case 'timeline-spine':
      return (
        <View style={styles.peekLower} pointerEvents="none">
          <View style={[styles.spine, { backgroundColor: strong }]} />
          {[0, 1, 2, 3, 4].map((i) => (
            <View
              key={i}
              style={[
                styles.spineDot,
                { top: 18 + i * 22, backgroundColor: i === 2 ? '#FFFFFF' : tint },
              ]}
            />
          ))}
        </View>
      );
    case 'phase-rails':
      return (
        <View style={styles.peekMid} pointerEvents="none">
          {[0, 1, 2, 3].map((i) => (
            <View
              key={i}
              style={[
                styles.phaseBar,
                {
                  backgroundColor: i === 1 ? strong : tint,
                  width: `${22 + i * 4}%`,
                  marginTop: i * 6,
                },
              ]}
            />
          ))}
        </View>
      );
    case 'grid-collage':
      return (
        <View style={styles.peekLowerGrid} pointerEvents="none">
          {[0, 1, 2, 3].map((i) => (
            <View
              key={i}
              style={[
                styles.polaroid,
                {
                  backgroundColor: tint,
                  transform: [{ rotate: `${(i - 2) * 2}deg` }],
                  left: 8 + i * 36,
                  bottom: 12 + (i % 2) * 10,
                },
              ]}
            />
          ))}
        </View>
      );
    case 'heatmap-canvas':
      return (
        <View style={styles.peekLower} pointerEvents="none">
          {Array.from({ length: 21 }).map((_, i) => {
            const intensity = Math.abs(Math.sin(i * 0.7));
            return (
              <View
                key={i}
                style={[
                  styles.heatCell,
                  {
                    backgroundColor: intensity > 0.6 ? strong : intensity > 0.3 ? tint : `${p.accent}22`,
                    left: 12 + (i % 7) * 22,
                    bottom: 12 + Math.floor(i / 7) * 22,
                  },
                ]}
              />
            );
          })}
        </View>
      );
    case 'user-determined':
    default:
      return (
        <View style={styles.peekLower} pointerEvents="none">
          <View style={[styles.userWash, { backgroundColor: tint }]} />
        </View>
      );
  }
}

// ─── New-chapter tile ────────────────────────────────────────────────────────

function NewChapterTile({
  cardWidth,
  cardHeight,
  onPress,
}: {
  cardWidth: number;
  cardHeight: number;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel="새 챕터 시작하기"
      style={({ pressed }) => [
        styles.card,
        styles.newTile,
        { width: cardWidth, height: cardHeight },
        pressed && { opacity: 0.7 },
      ]}
    >
      <Ionicons name="add-circle-outline" size={48} color="rgba(255,255,255,0.72)" />
      <Text style={styles.newTileLabel}>새 챕터 시작하기</Text>
    </Pressable>
  );
}

// ─── Progress dots ────────────────────────────────────────────────────────────

function ProgressDots({
  count,
  activeIndex,
  assets,
}: {
  count: number;
  activeIndex: number;
  assets: readonly Asset[];
}) {
  return (
    <View style={styles.dots}>
      {Array.from({ length: count }).map((_, i) => {
        const isActive = i === activeIndex;
        const accent =
          i < assets.length ? getPalette(assets[i].palette).accent : 'rgba(255,255,255,0.4)';
        return (
          <View
            key={i}
            style={[
              styles.dot,
              isActive ? { backgroundColor: accent } : { backgroundColor: 'rgba(255,255,255,0.28)' },
            ]}
          />
        );
      })}
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    backgroundColor: 'rgba(14,14,16,0.55)',
    zIndex: 500,
  },
  content: {
    flex: 1,
    paddingTop: Platform.OS === 'ios' ? 56 : 32,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: s.lg,
    paddingBottom: s.md,
  },
  title: {
    ...typography.displayLarge,
    color: '#FFFFFF',
    textAlign: 'center',
  },
  closeBtn: {
    position: 'absolute',
    right: s.lg,
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    alignItems: 'center',
  },
  itemWrapper: {
    justifyContent: 'center',
  },
  card: {
    borderRadius: r.lg,
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 24 },
    shadowOpacity: 0.3,
    shadowRadius: 40,
    elevation: 16,
  },
  titleBleed: {
    position: 'absolute',
    top: s.xl,
    left: s.lg,
    right: -32,
    overflow: 'hidden',
  },
  titleLine: {
    ...typography.displayLarge,
    color: '#FFFFFF',
    fontSize: 32,
    lineHeight: 36,
    fontWeight: '700',
    textShadowColor: 'rgba(0,0,0,0.35)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },
  captionScrim: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '50%',
  },
  captionRow: {
    position: 'absolute',
    left: s.lg,
    right: s.lg,
    bottom: s.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  phaseLabel: {
    ...typography.caption1,
    color: 'rgba(255,255,255,0.9)',
    letterSpacing: 1.4,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  activePill: {
    ...typography.caption2,
    color: '#FFFFFF',
    fontWeight: '700',
    paddingHorizontal: s.md,
    paddingVertical: 4,
    borderRadius: r.full,
    backgroundColor: 'rgba(255,255,255,0.22)',
    overflow: 'hidden',
  },
  peekLower: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 64,
    height: 140,
  },
  peekMid: {
    position: 'absolute',
    left: s.lg,
    right: s.lg,
    top: '48%',
    height: 60,
  },
  peekLowerGrid: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 48,
    height: 120,
  },
  spine: {
    position: 'absolute',
    left: s.xl,
    top: 12,
    bottom: 12,
    width: 2,
    borderRadius: 1,
  },
  spineDot: {
    position: 'absolute',
    left: s.xl - 5,
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  phaseBar: {
    height: 8,
    borderRadius: 4,
  },
  polaroid: {
    position: 'absolute',
    width: 48,
    height: 48,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.24)',
  },
  heatCell: {
    position: 'absolute',
    width: 16,
    height: 16,
    borderRadius: 3,
  },
  userWash: {
    position: 'absolute',
    left: s.lg,
    right: s.lg,
    bottom: s.lg,
    height: 72,
    borderRadius: r.md,
  },
  newTile: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: 'rgba(255,255,255,0.32)',
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: s.md,
  },
  newTileLabel: {
    ...typography.subhead,
    color: 'rgba(255,255,255,0.78)',
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    paddingVertical: s.lg,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
});

export default ChapterCarousel;
