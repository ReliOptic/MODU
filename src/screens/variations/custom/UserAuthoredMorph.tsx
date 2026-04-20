// v2.1 §9 custom · morph — user-authored asset ambient flow.
// Soft organic frames + breathing cadence for far/after proximity.
// Reduce-motion via useReduceMotion: disables FadeIn entering.
import React, { useMemo } from 'react';
import { ScrollView, View, Text, StyleSheet } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import type { VariationProps } from '../types';
import { useReduceMotion } from '../../../hooks/useReduceMotion';
import { densityFor, SectionLabel } from '../_primitives';
import { HeroFrame } from '../_primitives/HeroFrame';
import { MetaStrip } from '../_primitives/MetaStrip';
import { BleedingTitle } from '../_primitives/BleedingTitle';
import { BentoBlock } from '../bento-blocks';
import {
  MorphWhisper,
  MorphPartner,
  MorphRecovery,
} from '../_primitives/morph';
import { MORPH_SHAPES, MORPH_RECOVERY_ROWS } from '../fertility/morphData';
import { s } from '../../../theme';

export function UserAuthoredMorph({
  tpo,
  blocks,
  palette,
}: VariationProps): React.JSX.Element {
  const reduceMotion = useReduceMotion();
  const density = useMemo(
    () => densityFor(tpo.proximity, 'morph'),
    [tpo.proximity],
  );
  const shape = useMemo(() => MORPH_SHAPES[tpo.proximity], [tpo.proximity]);
  const breath = density.breathingMultiplier;
  const dim = tpo.visual.dim;

  const restingTiles = useMemo(
    () => blocks.filter((b) => b.variant !== 'hero').slice(0, density.rowSlots),
    [blocks, density.rowSlots],
  );

  return (
    <View style={[styles.rootWrap, { opacity: dim }]}>
      {/* P1.7: ambient mesh canvas */}
      <View style={StyleSheet.absoluteFillObject}>
        <View style={[styles.meshBackdrop, { backgroundColor: palette[200] }]} />
      </View>
    <ScrollView
      style={styles.root}
      contentContainerStyle={[
        styles.content,
        { paddingTop: s.lg * breath, gap: s.lg * breath },
      ]}
      showsVerticalScrollIndicator={false}
    >
      {/* Hero frame — organic gradient blob variant */}
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
          <Text style={styles.whisperText} numberOfLines={4}>
            {tpo.copy.whisper}
          </Text>
        </View>
      </HeroFrame>

      {/* Whisper shape card — proximity-reactive border radius */}
      {shape.whisperShape !== undefined && (
        <MorphWhisper
          palette={palette}
          tpo={tpo}
          whisperShape={shape.whisperShape}
          reduceMotion={reduceMotion}
        />
      )}

      {/* Resting tiles — soft frame */}
      {restingTiles.length > 0 && (
        <>
          <SectionLabel palette={palette}>오늘은, 그저 쉼</SectionLabel>
          <View style={[styles.tileStack, { gap: s.md * breath }]}>
            {restingTiles.map((b, i) => {
              const entering = reduceMotion
                ? undefined
                : FadeIn.delay(i * 100).duration(440);
              return (
                <Animated.View key={b.id} entering={entering}>
                  <View
                    style={[
                      styles.tileFrame,
                      {
                        backgroundColor: palette[100],
                        borderColor: palette[200],
                      },
                    ]}
                  >
                    <BentoBlock
                      block={b}
                      palette={palette}
                      tpo={tpo}
                      span={[6, 2]}
                    />
                  </View>
                </Animated.View>
              );
            })}
          </View>
        </>
      )}

      {/* Recovery panel — only after */}
      {shape.showRecovery && (
        <MorphRecovery
          palette={palette}
          rows={MORPH_RECOVERY_ROWS}
          reduceMotion={reduceMotion}
        />
      )}

      {/* Partner pill */}
      {shape.showPartner && (
        <MorphPartner
          palette={palette}
          tpo={tpo}
          reduceMotion={reduceMotion}
        />
      )}

      {/* Closing */}
      <View
        style={[
          styles.closing,
          {
            backgroundColor: palette[100],
            borderColor: palette[200],
          },
        ]}
      >
        <Text style={[styles.closingEyebrow, { color: palette[700] }]}>
          오늘의 닫는 말
        </Text>
        <Text style={[styles.closingText, { color: palette[900] }]}>
          {tpo.proximity === 'after' ? '몸이 기억해요. 쉬어요.' : '당신의 속도로.'}
        </Text>
      </View>

      <View style={{ height: 60 }} />
    </ScrollView></View>
  );
}

const styles = StyleSheet.create({
  rootWrap: { flex: 1 },
  meshBackdrop: { flex: 1, opacity: 0.3 },
  root: { flex: 1 },
  content: { paddingBottom: 120 },
  heroBody: {
    paddingHorizontal: s.lg,
    paddingTop: s['2xl'],
    gap: s.md,
    alignItems: 'flex-start',
  },
  whisperText: {
    fontFamily: 'Pretendard_400Regular',
    fontSize: 14,
    lineHeight: 22,
    color: 'rgba(255,255,255,0.88)',
    paddingHorizontal: s.lg,
  },
  tileStack: { paddingHorizontal: s.lg },
  tileFrame: { borderRadius: 28, borderWidth: 1, overflow: 'hidden' },
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
});
