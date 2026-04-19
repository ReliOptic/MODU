// v2.1 §9 — custom · morph mood. User-authored ambient flow.
// Soft frames + breathing for far/after proximity on user-defined assets.
import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
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

export function UserAuthoredMorph({
  tpo,
  blocks,
  palette,
}: VariationProps): React.JSX.Element {
  const density = useMemo(
    () => densityFor(tpo.proximity, 'morph'),
    [tpo.proximity],
  );
  const dim = tpo.visual.dim;
  const breath = density.breathingMultiplier;

  const restingTiles = useMemo(
    () => blocks.filter((b) => b.variant !== 'hero').slice(0, density.rowSlots),
    [blocks, density.rowSlots],
  );

  return (
    <ScrollView
      style={[styles.root, { opacity: dim }]}
      contentContainerStyle={[
        styles.scrollContent,
        { paddingTop: s.lg * breath, gap: s.lg * breath },
      ]}
      showsVerticalScrollIndicator={false}
    >
      <HeroFrame
        palette={palette}
        heroBonus={density.heroBonus}
        minScale={density.heroMinScale}
        cornerRadius={36}
        insetHorizontal={s.lg}
      >
        <MetaStrip palette={palette} tpo={tpo} />
        <View style={[styles.heroBody, { paddingBottom: s['2xl'] * breath }]}>
          <BleedingTitle
            palette={palette}
            text={tpo.copy.heroWord}
            size="display"
            tone="light"
          />
          <Text style={styles.whisper} numberOfLines={4}>
            {tpo.copy.whisper}
          </Text>
        </View>
      </HeroFrame>

      <SectionLabel palette={palette}>오늘은, 그저 쉼</SectionLabel>
      <View style={[styles.softStack, { gap: s.md * breath }]}>
        {restingTiles.map((b, i) => (
          <Animated.View
            key={b.id}
            entering={FadeIn.delay(i * 100).duration(440)}
          >
            <View
              style={[
                styles.softFrame,
                { backgroundColor: palette[100], borderColor: palette[200] },
              ]}
            >
              <BentoBlock block={b} palette={palette} tpo={tpo} span={[6, 2]} />
            </View>
          </Animated.View>
        ))}
      </View>

      <View
        style={[
          styles.closing,
          { backgroundColor: palette[100], borderColor: palette[200] },
        ]}
      >
        <Text style={[styles.closingEyebrow, { color: palette[700] }]}>
          오늘의 닫는 말
        </Text>
        <Text style={[styles.closingText, { color: palette[900] }]}>
          {tpo.proximity === 'after' ? '몸이 기억해요. 쉬어요.' : '당신의 속도로.'}
        </Text>
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
    paddingTop: s['2xl'],
    gap: s.md,
    alignItems: 'flex-start',
  },
  whisper: {
    fontFamily: 'Pretendard_400Regular',
    fontSize: 14,
    lineHeight: 22,
    color: 'rgba(255,255,255,0.88)',
    paddingHorizontal: s.lg,
  },
  softStack: { paddingHorizontal: s.lg },
  softFrame: { borderRadius: 28, borderWidth: 1, overflow: 'hidden' },
  closing: {
    marginHorizontal: s.lg,
    padding: s.xl,
    borderRadius: 28,
    borderWidth: 1,
    gap: s.sm,
  },
  closingEyebrow: {
    fontSize: 10,
    letterSpacing: 2.5,
    fontFamily: 'JetBrainsMono_400Regular',
  },
  closingText: {
    fontFamily: 'Fraunces_400Regular',
    fontSize: 22,
    lineHeight: 28,
    letterSpacing: -0.4,
  },
  tail: { height: 60 },
});
