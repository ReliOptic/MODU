// 챕터 갤러리 — 수평 페이지네이션 3D 카드 캐러셀
// AssetScreen 에서 Modal 로 호스팅. long-press on AssetSwitcher chevron 으로 진입.
import React, { useCallback, useRef, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  Image,
  Modal,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  Platform,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { getPalette, typography, widgetTokens } from '../theme';
import type { Asset } from '../types';

// expo-haptics: native-only, safe to import (no-op on web via conditional)
let Haptics: { selectionAsync: () => Promise<void> } | null = null;
if (Platform.OS !== 'web') {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  Haptics = require('expo-haptics');
}

export interface ChapterGalleryScreenProps {
  visible: boolean;
  assets: Asset[];
  currentAssetId: string | null;
  onClose: () => void;
  onSelect: (id: string) => void;
  onCreateNew: () => void;
}

const ASSET_TYPE_LABELS: Record<string, string> = {
  fertility: '난임 동반자',
  cancer_caregiver: '항암 보호자',
  pet_care: '반려 동물',
  chronic: '만성 관리',
  custom: '내 챕터',
};

function humanizeType(type: string): string {
  return ASSET_TYPE_LABELS[type] ?? '내 챕터';
}

function daysSince(isoDate: string): number {
  return Math.max(0, Math.floor((Date.now() - new Date(isoDate).getTime()) / 86_400_000));
}

/* ───────────── Asset card ───────────── */

interface AssetCardProps {
  asset: Asset;
  cardWidth: number;
  cardHeight: number;
  onSelect: (id: string) => void;
  onClose: () => void;
}

function AssetCard({ asset, cardWidth, cardHeight, onSelect, onClose }: AssetCardProps) {
  const p = getPalette(asset.palette);
  const heroHeight = cardHeight * 0.6;
  const captionHeight = cardHeight * 0.4;

  const handleSelect = useCallback(() => {
    onSelect(asset.id);
    onClose();
  }, [asset.id, onSelect, onClose]);

  return (
    <View style={[styles.card, { width: cardWidth, height: cardHeight }]}>
      {/* Hero */}
      <View style={[styles.hero, { height: heroHeight }]}>
        <LinearGradient
          colors={[p.gradient.start, p.gradient.mid, p.gradient.end]}
          style={StyleSheet.absoluteFillObject}
        />
        {asset.photoUri ? (
          <Image
            source={{ uri: asset.photoUri }}
            style={StyleSheet.absoluteFillObject}
            resizeMode="cover"
          />
        ) : null}
        {/* Name overlay */}
        <View style={styles.heroLabel}>
          <Text style={styles.heroName} numberOfLines={2}>
            {asset.displayName}
          </Text>
        </View>
      </View>

      {/* Caption */}
      <View style={[styles.caption, { height: captionHeight, backgroundColor: p[50] }]}>
        <Text style={styles.captionType}>{humanizeType(asset.type)}</Text>
        <Text style={styles.captionDays}>함께한 지 {daysSince(asset.createdAt)}일</Text>
        <View style={styles.tagRow}>
          <View style={[styles.tag, { backgroundColor: p[100] }]}>
            <Text style={[styles.tagText, { color: p[700] }]}>
              {asset.widgets.length}개 위젯
            </Text>
          </View>
          {(asset.events?.length ?? 0) > 0 && (
            <View style={[styles.tag, { backgroundColor: p[100] }]}>
              <Text style={[styles.tagText, { color: p[700] }]}>
                {asset.events!.length}개 이벤트
              </Text>
            </View>
          )}
        </View>
        <Pressable
          onPress={handleSelect}
          accessibilityRole="button"
          accessibilityLabel={`${asset.displayName}으로 돌아가기`}
          hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
          style={({ pressed }) => [
            styles.returnBtn,
            { backgroundColor: p[500] },
            pressed && { opacity: 0.8 },
          ]}
        >
          <Text style={styles.returnBtnLabel}>이 챕터로 돌아가기</Text>
        </Pressable>
      </View>
    </View>
  );
}

/* ───────────── New chapter tile ───────────── */

interface NewTileProps {
  cardWidth: number;
  cardHeight: number;
  onPress: () => void;
}

function NewChapterTile({ cardWidth, cardHeight, onPress }: NewTileProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel="새 챕터 시작하기"
      hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
      style={({ pressed }) => [
        styles.card,
        styles.newTile,
        { width: cardWidth, height: cardHeight },
        pressed && { opacity: 0.7 },
      ]}
    >
      <Ionicons name="add-circle-outline" size={48} color={widgetTokens.textSecondary} />
      <Text style={styles.newTileLabel}>새 챕터 시작하기</Text>
    </Pressable>
  );
}

/* ───────────── Progress dots ───────────── */

interface DotsProps {
  count: number;
  activeIndex: number;
  assets: Asset[];
}

function ProgressDots({ count, activeIndex, assets }: DotsProps) {
  return (
    <View style={styles.dots}>
      {Array.from({ length: count }).map((_, i) => {
        const isActive = i === activeIndex;
        // For new-chapter tile (last slot beyond assets), use neutral color
        const accent =
          i < assets.length ? getPalette(assets[i].palette)[500] : 'rgba(255,255,255,0.35)';
        return (
          <View
            key={i}
            style={[
              styles.dot,
              isActive
                ? { backgroundColor: accent }
                : { backgroundColor: 'rgba(255,255,255,0.35)' },
            ]}
          />
        );
      })}
    </View>
  );
}

/* ───────────── Main screen ───────────── */

export function ChapterGalleryScreen({
  visible,
  assets,
  currentAssetId: _currentAssetId,
  onClose,
  onSelect,
  onCreateNew,
}: ChapterGalleryScreenProps) {
  const { width } = useWindowDimensions();
  const cardWidth = Math.min(width - 48, 360);
  const cardHeight = cardWidth * 1.3;
  const snapInterval = cardWidth + 16;

  const [activeIndex, setActiveIndex] = useState(0);
  const lastIndexRef = useRef(0);

  const handleScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const offsetX = e.nativeEvent.contentOffset.x;
      const idx = Math.round(offsetX / snapInterval);
      if (idx !== lastIndexRef.current) {
        lastIndexRef.current = idx;
        setActiveIndex(idx);
        if (Platform.OS !== 'web' && Haptics) {
          Haptics.selectionAsync().catch(() => undefined);
        }
      }
    },
    [snapInterval]
  );

  const handleCreateNew = useCallback(() => {
    onCreateNew();
    onClose();
  }, [onCreateNew, onClose]);

  // items = assets + sentinel for new tile
  const totalCount = assets.length + 1;

  const renderItem = useCallback(
    ({ item, index }: { item: Asset | null; index: number }) => {
      if (index === assets.length || item === null) {
        return (
          <View style={[styles.itemWrapper, { paddingLeft: index === 0 ? (width - cardWidth) / 2 : 8 }]}>
            <NewChapterTile
              cardWidth={cardWidth}
              cardHeight={cardHeight}
              onPress={handleCreateNew}
            />
          </View>
        );
      }
      return (
        <View style={[styles.itemWrapper, { paddingLeft: index === 0 ? (width - cardWidth) / 2 : 8 }]}>
          <AssetCard
            asset={item}
            cardWidth={cardWidth}
            cardHeight={cardHeight}
            onSelect={onSelect}
            onClose={onClose}
          />
        </View>
      );
    },
    [assets.length, cardWidth, cardHeight, width, handleCreateNew, onSelect, onClose]
  );

  // Build data array: assets + null sentinel for new tile
  const data: (Asset | null)[] = [...assets, null];

  const isNative = Platform.OS !== 'web';

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle={isNative ? 'pageSheet' : 'overFullScreen'}
      onRequestClose={onClose}
      transparent={!isNative}
    >
      <View style={[styles.root, !isNative && styles.rootWeb]}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>내 챕터</Text>
          <Pressable
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel="갤러리 닫기"
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            style={styles.closeBtn}
          >
            <Ionicons name="close" size={22} color={widgetTokens.textPrimary} />
          </Pressable>
        </View>

        {/* Carousel */}
        <View style={styles.carousel}>
          <FlatList
            data={data}
            keyExtractor={(_, i) => String(i)}
            renderItem={renderItem}
            horizontal
            pagingEnabled={false}
            snapToInterval={snapInterval}
            snapToAlignment="start"
            decelerationRate="fast"
            showsHorizontalScrollIndicator={false}
            onScroll={handleScroll}
            scrollEventThrottle={16}
            contentContainerStyle={{ paddingRight: (width - cardWidth) / 2 }}
            getItemLayout={(_, index) => ({
              length: snapInterval,
              offset: snapInterval * index,
              index,
            })}
          />
        </View>

        {/* Progress dots */}
        <ProgressDots count={totalCount} activeIndex={activeIndex} assets={assets} />
      </View>
    </Modal>
  );
}

/* ───────────── Styles ───────────── */

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingTop: 20,
  },
  rootWeb: {
    backgroundColor: 'rgba(10,10,12,0.92)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
    position: 'relative',
  },
  headerTitle: {
    ...typography.displayLarge,
    color: widgetTokens.textPrimary,
    textAlign: 'center',
  },
  closeBtn: {
    position: 'absolute',
    right: 20,
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  carousel: {
    flex: 1,
    justifyContent: 'center',
  },
  itemWrapper: {
    paddingRight: 0,
  },
  card: {
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.18,
    shadowRadius: 40,
    elevation: 16,
  },
  hero: {
    width: '100%',
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  heroLabel: {
    padding: 16,
    backgroundColor: 'rgba(0,0,0,0)',
  },
  heroName: {
    ...typography.displayLarge,
    fontSize: 22,
    color: '#FFFFFF',
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  caption: {
    width: '100%',
    padding: 16,
    justifyContent: 'space-between',
  },
  captionType: {
    ...typography.caption1,
    color: widgetTokens.textSecondary,
    marginBottom: 2,
  },
  captionDays: {
    ...typography.body,
    color: widgetTokens.textPrimary,
    marginBottom: 8,
  },
  tagRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 10,
  },
  tag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  tagText: {
    ...typography.caption2,
    fontWeight: '600',
  },
  returnBtn: {
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  returnBtnLabel: {
    ...typography.subhead,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  newTile: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: widgetTokens.textTertiary,
    backgroundColor: '#F6F4FA',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  newTileLabel: {
    ...typography.subhead,
    color: widgetTokens.textSecondary,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 20,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
});
