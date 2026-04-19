// v2.1 §9 — pet_care · cinematic mood. Hero polaroid + collage satellites.
// Mood='cinematic' → big hero pet polaroid, fewer satellite tiles.
import React, { useMemo } from 'react';
import { ScrollView, View, Text, StyleSheet } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import type { VariationProps } from '../types';
import {
  HeroFrame,
  MetaStrip,
  BleedingTitle,
  SectionLabel,
  densityFor,
} from '../_primitives';
import { BentoBlock } from '../bento-blocks';
import { s } from '../../../theme';

export function GridCollageCinematic({
  tpo,
  blocks,
  palette,
}: VariationProps): React.JSX.Element {
  const density = useMemo(
    () => densityFor(tpo.proximity, 'cinematic'),
    [tpo.proximity],
  );
  const dim = tpo.visual.dim;

  const heroBlock = blocks.find((b) => b.variant === 'hero');
  const satellites = useMemo(
    () => blocks.filter((b) => b.variant !== 'hero').slice(0, 4),
    [blocks],
  );

  return (
    <ScrollView
      style={[styles.root, { opacity: dim }]}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      <HeroFrame
        palette={palette}
        heroBonus={density.heroBonus}
        minScale={density.heroMinScale}
      >
        <MetaStrip palette={palette} tpo={tpo} />
        <View style={styles.heroBody}>
          <BleedingTitle
            palette={palette}
            text={tpo.copy.heroWord}
            size="mega"
            tone="light"
          />
          <Text style={styles.whisper} numberOfLines={3}>
            {tpo.copy.whisper}
          </Text>
        </View>
      </HeroFrame>

      {heroBlock !== undefined && (
        <View style={styles.bigPolaroidWrap}>
          <View
            style={[
              styles.bigPolaroid,
              { backgroundColor: '#FFFFFF', borderColor: palette[200] },
            ]}
          >
            <BentoBlock
              block={heroBlock}
              palette={palette}
              tpo={tpo}
              span={[6, 5]}
            />
            <Text style={[styles.bigCaption, { color: palette[700] }]}>
              {tpo.assetKey.toUpperCase()} · {tpo.copy.heroWord}
            </Text>
          </View>
        </View>
      )}

      <SectionLabel palette={palette}>위성 기록</SectionLabel>
      <View style={styles.satellites}>
        {satellites.map((b, i) => (
          <Animated.View
            key={b.id}
            entering={FadeIn.delay(i * 80).duration(400)}
            style={styles.satelliteWrap}
          >
            <View
              style={[
                styles.satelliteFrame,
                {
                  backgroundColor: '#FFFFFF',
                  borderColor: palette[200],
                  transform: [{ rotate: `${(i % 2 === 0 ? -2 : 2)}deg` }],
                },
              ]}
            >
              <BentoBlock block={b} palette={palette} tpo={tpo} span={[6, 3]} />
            </View>
          </Animated.View>
        ))}
      </View>
      <View style={styles.tail} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scrollContent: { paddingBottom: 120 },
  heroBody: {
    paddingHorizontal: s.lg,
    paddingBottom: s['2xl'],
    paddingTop: s['2xl'],
    gap: s.lg,
  },
  whisper: {
    fontFamily: 'Pretendard_400Regular',
    fontSize: 15,
    lineHeight: 22,
    color: 'rgba(255,255,255,0.92)',
    paddingHorizontal: s.lg,
  },
  bigPolaroidWrap: { paddingHorizontal: s.lg, paddingTop: s.lg },
  bigPolaroid: {
    borderRadius: 10,
    borderWidth: 1,
    padding: s.md,
    paddingBottom: s.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
    elevation: 4,
    gap: s.sm,
    transform: [{ rotate: '-1.5deg' }],
  },
  bigCaption: {
    fontFamily: 'JetBrainsMono_400Regular',
    fontSize: 10,
    letterSpacing: 2,
    textAlign: 'center',
    paddingTop: s.xs,
  },
  satellites: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: s.md,
    gap: s.sm,
    marginTop: s.lg,
  },
  satelliteWrap: { width: '48%' },
  satelliteFrame: {
    borderRadius: 8,
    borderWidth: 1,
    padding: s.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  tail: { height: 60 },
});
