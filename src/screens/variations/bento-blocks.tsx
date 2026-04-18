// Bento block tile renderer — RendererBlock × span → RN tile.
// Variants: hero | card | list | strip | grid | stat. Each gets a distinct
// visual treatment but shares typography + palette tokens.
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { DimensionValue } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import type { RendererBlock, ResolvedTPO } from '../../adapters';
import type { PaletteSwatch } from '../../theme';
import { proximityLabel } from './types';

export type BentoSpan = readonly [number, number];

const ROW_HEIGHT = 64;
const ROW_GAP = 10;

function spanWidth(cols: number): DimensionValue {
  const pct = Math.round((cols / 6) * 1000) / 10;
  return `${pct}%` as DimensionValue;
}

function widgetEyebrow(widgetType: string): string {
  return widgetType.replace(/_/g, ' ').replace(/\./g, ' · ').toUpperCase();
}

interface BentoBlockProps {
  readonly block: RendererBlock;
  readonly palette: PaletteSwatch;
  readonly tpo: ResolvedTPO;
  readonly span: BentoSpan;
}

export function BentoBlock({ block, palette, tpo, span }: BentoBlockProps): React.JSX.Element {
  const [c, r] = span;
  const minHeight = ROW_HEIGHT * r + ROW_GAP * (r - 1);
  const wrapperStyle = { width: spanWidth(c), minHeight };

  if (block.variant === 'hero') {
    return <HeroTile palette={palette} tpo={tpo} wrapperStyle={wrapperStyle} block={block} />;
  }
  if (block.variant === 'stat') {
    return <StatTile palette={palette} block={block} wrapperStyle={wrapperStyle} />;
  }
  if (block.variant === 'strip') {
    return <StripTile palette={palette} block={block} wrapperStyle={wrapperStyle} />;
  }
  if (block.variant === 'grid') {
    return <GridTile palette={palette} block={block} wrapperStyle={wrapperStyle} />;
  }
  if (block.variant === 'list') {
    return <ListTile palette={palette} block={block} wrapperStyle={wrapperStyle} />;
  }
  return <CardTile palette={palette} block={block} wrapperStyle={wrapperStyle} />;
}

interface VariantProps {
  readonly palette: PaletteSwatch;
  readonly block: RendererBlock;
  readonly wrapperStyle: { width: DimensionValue; minHeight: number };
}

function HeroTile({ palette, tpo, wrapperStyle, block }: VariantProps & { tpo: ResolvedTPO }): React.JSX.Element {
  return (
    <View style={[styles.tileWrap, wrapperStyle]}>
      <LinearGradient
        colors={[palette.gradient.start, palette.gradient.mid, palette.gradient.end]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.heroFill}
      >
        <Text style={styles.heroEyebrow}>
          {widgetEyebrow(block.widgetType)} · {proximityLabel(tpo.proximity)}
        </Text>
        <View style={styles.heroBody}>
          <Text style={styles.heroTitle} numberOfLines={2}>{tpo.copy.heroWord}</Text>
          <Text style={styles.heroSub} numberOfLines={3}>{tpo.copy.whisper}</Text>
        </View>
      </LinearGradient>
    </View>
  );
}

function StatTile({ palette, block, wrapperStyle }: VariantProps): React.JSX.Element {
  return (
    <View style={[styles.tileWrap, wrapperStyle]}>
      <View style={[styles.paperFill, { backgroundColor: palette[100] }]}>
        <Text style={[styles.eyebrow, { color: palette[700] }]}>{widgetEyebrow(block.widgetType)}</Text>
        <Text style={[styles.statValue, { color: palette.accent }]}>—</Text>
        <Text style={[styles.metaCaption, { color: palette[700] }]}>tap to log</Text>
      </View>
    </View>
  );
}

function StripTile({ palette, block, wrapperStyle }: VariantProps): React.JSX.Element {
  return (
    <View style={[styles.tileWrap, wrapperStyle]}>
      <View style={[styles.paperFill, { backgroundColor: palette[50] }]}>
        <Text style={[styles.eyebrow, { color: palette[700] }]}>{widgetEyebrow(block.widgetType)}</Text>
        <View style={styles.stripBars}>
          {[0.4, 0.6, 0.8, 1, 0.9, 0.7, 0.5].map((v, i) => (
            <View
              key={`${block.id}-bar-${i}`}
              style={{
                flex: 1,
                height: 28 * v + 6,
                borderRadius: 3,
                backgroundColor: palette.accent,
                opacity: 0.35 + v * 0.5,
              }}
            />
          ))}
        </View>
      </View>
    </View>
  );
}

function GridTile({ palette, block, wrapperStyle }: VariantProps): React.JSX.Element {
  const cells = Array.from({ length: 21 });
  return (
    <View style={[styles.tileWrap, wrapperStyle]}>
      <View style={[styles.paperFill, { backgroundColor: palette[50] }]}>
        <Text style={[styles.eyebrow, { color: palette[700] }]}>{widgetEyebrow(block.widgetType)}</Text>
        <View style={styles.gridCells}>
          {cells.map((_, i) => (
            <View
              key={`${block.id}-cell-${i}`}
              style={{
                width: '13%',
                aspectRatio: 1,
                margin: 1.5,
                borderRadius: 3,
                backgroundColor: i === 9 ? palette.accent : palette[200],
                opacity: i === 9 ? 1 : 0.55,
              }}
            />
          ))}
        </View>
      </View>
    </View>
  );
}

function ListTile({ palette, block, wrapperStyle }: VariantProps): React.JSX.Element {
  return (
    <View style={[styles.tileWrap, wrapperStyle]}>
      <View style={[styles.paperFill, { backgroundColor: palette[50] }]}>
        <Text style={[styles.eyebrow, { color: palette[700] }]}>{widgetEyebrow(block.widgetType)}</Text>
        {[0, 1, 2].map((i) => (
          <View key={`${block.id}-row-${i}`} style={styles.listRow}>
            <View style={[styles.listDot, { backgroundColor: palette.accent }]} />
            <View style={[styles.listLine, { backgroundColor: palette[200] }]} />
          </View>
        ))}
      </View>
    </View>
  );
}

function CardTile({ palette, block, wrapperStyle }: VariantProps): React.JSX.Element {
  return (
    <View style={[styles.tileWrap, wrapperStyle]}>
      <View style={[styles.paperFill, { backgroundColor: palette[100] }]}>
        <Text style={[styles.eyebrow, { color: palette[700] }]}>{widgetEyebrow(block.widgetType)}</Text>
        <Text style={[styles.cardTitle, { color: palette[900] }]}>{block.tab}</Text>
        <Text style={[styles.metaCaption, { color: palette[700] }]}>priority {block.priority}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  tileWrap: { padding: 5 },
  heroFill: {
    flex: 1,
    borderRadius: 20,
    padding: 18,
    justifyContent: 'space-between',
    overflow: 'hidden',
  },
  heroEyebrow: {
    fontSize: 10,
    letterSpacing: 2.2,
    color: 'rgba(255,255,255,0.85)',
    fontFamily: 'JetBrainsMono_400Regular',
  },
  heroBody: { gap: 8 },
  heroTitle: {
    fontFamily: 'Fraunces_400Regular',
    fontSize: 36,
    lineHeight: 38,
    color: '#fff',
    letterSpacing: -1,
  },
  heroSub: {
    fontFamily: 'Pretendard_400Regular',
    fontSize: 13,
    lineHeight: 18,
    color: 'rgba(255,255,255,0.92)',
  },
  paperFill: {
    flex: 1,
    borderRadius: 18,
    padding: 14,
    justifyContent: 'space-between',
    overflow: 'hidden',
  },
  eyebrow: {
    fontSize: 9,
    letterSpacing: 1.8,
    fontFamily: 'JetBrainsMono_400Regular',
  },
  statValue: {
    fontFamily: 'Fraunces_400Regular',
    fontSize: 38,
    lineHeight: 40,
    letterSpacing: -1,
  },
  cardTitle: {
    fontFamily: 'Fraunces_400Regular',
    fontSize: 18,
    lineHeight: 22,
    letterSpacing: -0.4,
  },
  metaCaption: {
    fontSize: 11,
    fontFamily: 'Pretendard_400Regular',
  },
  stripBars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 4,
    marginTop: 6,
  },
  gridCells: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 6,
  },
  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 6,
  },
  listDot: { width: 6, height: 6, borderRadius: 3 },
  listLine: { flex: 1, height: 4, borderRadius: 2 },
});
