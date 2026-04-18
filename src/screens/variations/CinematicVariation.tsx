// Variation A — Cinematic Editorial (TPO-reactive).
// Full-bleed gradient hero + scrolling editorial sections. Section *order*
// and hero *height* both react to proximity. Single-column flow.
import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import type { RendererBlock, ResolvedTPO, TimelineDay } from '../../adapters';
import type { PaletteSwatch } from '../../theme';
import type { VariationProps } from './types';
import { proximityLabel } from './types';

interface CinematicStructure {
  readonly heroHeight: number;
  readonly heroTitleSize: number;
  readonly chapter: string;
  readonly chapterName: string;
}

function structureFor(p: ResolvedTPO['proximity']): CinematicStructure {
  switch (p) {
    case 'far':   return { heroHeight: 360, heroTitleSize: 56, chapter: '01', chapterName: '머무름' };
    case 'week':  return { heroHeight: 420, heroTitleSize: 64, chapter: '02', chapterName: '서곡' };
    case 'near':  return { heroHeight: 480, heroTitleSize: 72, chapter: '03', chapterName: '전야' };
    case 'dayof': return { heroHeight: 560, heroTitleSize: 96, chapter: '04', chapterName: '오늘' };
    case 'after': return { heroHeight: 320, heroTitleSize: 48, chapter: '05', chapterName: '이후의 기록' };
  }
}

export function CinematicVariation({ tpo, blocks, timeline, palette }: VariationProps): React.JSX.Element {
  const S = useMemo(() => structureFor(tpo.proximity), [tpo.proximity]);
  const dim = tpo.visual.dim;

  return (
    <ScrollView
      style={[styles.root, { backgroundColor: palette[50], opacity: dim }]}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      <CinematicHero palette={palette} tpo={tpo} structure={S} />
      <PullQuote palette={palette} tpo={tpo} chapter={S.chapter} />
      {blocks.length > 0 && <BlockListSection palette={palette} blocks={blocks} />}
      {timeline.length > 0 && <TimelineSection palette={palette} timeline={timeline} />}
      <ClosingNote palette={palette} tpo={tpo} />
      <View style={styles.tailSpacer} />
    </ScrollView>
  );
}

interface HeroProps {
  readonly palette: PaletteSwatch;
  readonly tpo: ResolvedTPO;
  readonly structure: CinematicStructure;
}

function CinematicHero({ palette, tpo, structure }: HeroProps): React.JSX.Element {
  return (
    <View style={[styles.hero, { height: structure.heroHeight }]}>
      <LinearGradient
        colors={[palette.gradient.start, palette.gradient.mid, palette.gradient.end]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.heroOverlay}>
        <Text style={styles.heroEyebrow}>
          MODU · {tpo.assetKey.toUpperCase()} · {proximityLabel(tpo.proximity)}
        </Text>
        <Text style={styles.heroBadge}>
          Chapter {structure.chapter} — {structure.chapterName}
        </Text>
      </View>
      <View style={styles.heroBody}>
        <Text
          style={[styles.heroTitle, { fontSize: structure.heroTitleSize, lineHeight: structure.heroTitleSize * 0.95 }]}
          numberOfLines={2}
        >
          {tpo.copy.heroWord}
        </Text>
        <Text style={styles.heroWhisper} numberOfLines={3}>{tpo.copy.whisper}</Text>
      </View>
    </View>
  );
}

interface PullQuoteProps {
  readonly palette: PaletteSwatch;
  readonly tpo: ResolvedTPO;
  readonly chapter: string;
}

function PullQuote({ palette, tpo, chapter }: PullQuoteProps): React.JSX.Element {
  return (
    <View style={styles.section}>
      <SectionLabel palette={palette}>{chapter} · 오늘의 호흡</SectionLabel>
      <Text style={[styles.pullQuote, { color: palette[900] }]}>
        {tpo.copy.headline}
        {' — '}
        <Text style={{ color: palette.accent }}>{tpo.copy.heroWord}</Text>
        {'의 자리로.'}
      </Text>
    </View>
  );
}

interface BlockListProps {
  readonly palette: PaletteSwatch;
  readonly blocks: readonly RendererBlock[];
}

function BlockListSection({ palette, blocks }: BlockListProps): React.JSX.Element {
  return (
    <View style={styles.section}>
      <SectionLabel palette={palette}>다가오는 흐름</SectionLabel>
      {blocks.slice(0, 5).map((b, i) => (
        <Animated.View
          key={b.id}
          entering={FadeIn.delay(i * 60).duration(380)}
          style={[styles.editorialRow, { borderColor: palette[200] }]}
        >
          <View style={[styles.editorialDot, { backgroundColor: palette.accent }]} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.editorialEyebrow, { color: palette[700] }]}>
              {b.variant.toUpperCase()}
            </Text>
            <Text style={[styles.editorialTitle, { color: palette[900] }]}>
              {b.widgetType.replace(/_/g, ' ').replace(/\./g, ' · ')}
            </Text>
          </View>
        </Animated.View>
      ))}
    </View>
  );
}

interface TimelineProps {
  readonly palette: PaletteSwatch;
  readonly timeline: readonly TimelineDay[];
}

function TimelineSection({ palette, timeline }: TimelineProps): React.JSX.Element {
  return (
    <View style={styles.section}>
      <SectionLabel palette={palette}>지난 기록</SectionLabel>
      {timeline.slice(0, 3).map((day, i) => (
        <View key={day.dateKey} style={[styles.editorialRow, { borderColor: palette[200] }]}>
          <View style={[styles.editorialDot, { backgroundColor: palette[400] }]} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.editorialEyebrow, { color: palette[700] }]}>{day.dateKey}</Text>
            <Text style={[styles.editorialTitle, { color: palette[900] }]} numberOfLines={2}>
              {day.entries[0]?.text ?? `${day.entries.length}개 기록`}
            </Text>
          </View>
        </View>
      ))}
    </View>
  );
}

interface ClosingProps {
  readonly palette: PaletteSwatch;
  readonly tpo: ResolvedTPO;
}

function ClosingNote({ palette, tpo }: ClosingProps): React.JSX.Element {
  const message = tpo.proximity === 'after' ? '몸이 기억해요. 쉬어요.'
    : tpo.proximity === 'dayof' ? '한 호흡씩, 천천히.'
      : '당신의 속도로.';
  return (
    <LinearGradient
      colors={[palette.gradient.start, palette.gradient.mid, palette.gradient.end]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.closing}
    >
      <Text style={styles.closingEyebrow}>오늘의 닫는 말</Text>
      <Text style={styles.closingTitle}>{message}</Text>
    </LinearGradient>
  );
}

function SectionLabel({ palette, children }: { palette: PaletteSwatch; children: React.ReactNode }): React.JSX.Element {
  return (
    <View style={styles.sectionLabelRow}>
      <View style={[styles.sectionLabelLine, { backgroundColor: palette.accent }]} />
      <Text style={[styles.sectionLabelText, { color: palette.accent }]}>{children}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scrollContent: { paddingBottom: 120 },
  hero: { width: '100%', overflow: 'hidden', justifyContent: 'flex-end', padding: 24 },
  heroOverlay: { position: 'absolute', top: 24, left: 24, right: 24, gap: 8 },
  heroEyebrow: {
    fontSize: 10, letterSpacing: 3,
    color: 'rgba(255,255,255,0.85)',
    fontFamily: 'JetBrainsMono_400Regular',
  },
  heroBadge: {
    fontSize: 10, letterSpacing: 2.5,
    color: 'rgba(255,255,255,0.78)',
    fontFamily: 'JetBrainsMono_400Regular',
  },
  heroBody: { gap: 12 },
  heroTitle: {
    fontFamily: 'Fraunces_400Regular',
    color: '#fff', letterSpacing: -1.5,
  },
  heroWhisper: {
    fontFamily: 'Pretendard_400Regular',
    fontSize: 14, lineHeight: 20,
    color: 'rgba(255,255,255,0.92)',
  },
  section: { paddingHorizontal: 24, paddingVertical: 24, gap: 14 },
  sectionLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  sectionLabelLine: { width: 24, height: 1 },
  sectionLabelText: {
    fontSize: 10, letterSpacing: 3,
    fontFamily: 'JetBrainsMono_400Regular',
  },
  pullQuote: {
    fontFamily: 'Fraunces_400Regular',
    fontSize: 28, lineHeight: 34, letterSpacing: -0.6,
  },
  editorialRow: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 14,
    paddingVertical: 12, borderTopWidth: 1,
  },
  editorialDot: { width: 10, height: 10, borderRadius: 5, marginTop: 6 },
  editorialEyebrow: {
    fontSize: 9, letterSpacing: 2.2,
    fontFamily: 'JetBrainsMono_400Regular', marginBottom: 4,
  },
  editorialTitle: {
    fontFamily: 'Fraunces_400Regular',
    fontSize: 17, lineHeight: 22, letterSpacing: -0.4,
  },
  closing: { paddingHorizontal: 24, paddingVertical: 48, gap: 16 },
  closingEyebrow: {
    fontSize: 10, letterSpacing: 3,
    color: 'rgba(255,255,255,0.85)',
    fontFamily: 'JetBrainsMono_400Regular',
  },
  closingTitle: {
    fontFamily: 'Fraunces_400Regular',
    fontSize: 26, lineHeight: 32, letterSpacing: -0.5, color: '#fff',
  },
  tailSpacer: { height: 60 },
});
