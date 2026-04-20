// Morph mood — place-driven resource list panel.
// Shows up to 2 items with hairline dividers.
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import type { PaletteSwatch } from '../../../../theme';
import type { MorphResourceItem } from '../../fertility/morphData';
import { s } from '../../../../theme';

export interface MorphResourcesProps {
  readonly palette: PaletteSwatch;
  readonly items: ReadonlyArray<MorphResourceItem>;
  readonly placeLabel?: string;
  readonly reduceMotion: boolean;
}

export function MorphResources({
  palette,
  items,
  placeLabel = '서울',
  reduceMotion,
}: MorphResourcesProps): React.JSX.Element {
  const entering = reduceMotion ? undefined : FadeIn.delay(60).duration(380);
  const visible = items.slice(0, 2);

  return (
    <Animated.View
      entering={entering}
      style={[
        styles.card,
        { backgroundColor: palette[100], borderColor: palette[200] },
      ]}
    >
      <View style={styles.eyebrowRow}>
        <View style={[styles.eyebrowDot, { backgroundColor: palette.accent }]} />
        <Text style={[styles.eyebrow, { color: palette[600] }]}>
          {placeLabel.toUpperCase()}
        </Text>
      </View>
      {visible.map((item, i) => (
        <View
          key={item.label}
          style={[
            styles.item,
            i > 0 && { borderTopWidth: 1, borderTopColor: palette[200] },
          ]}
        >
          <Text style={[styles.kind, { color: palette.accent }]}>{item.kind}</Text>
          <Text style={[styles.label, { color: palette[900] }]}>{item.label}</Text>
          {item.note !== undefined && (
            <Text style={[styles.note, { color: palette[600] }]}>{item.note}</Text>
          )}
        </View>
      ))}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: s.lg,
    borderRadius: 24,
    borderWidth: 1,
    paddingHorizontal: 22,
    paddingTop: 18,
    paddingBottom: 4,
  },
  eyebrowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  eyebrowDot: { width: 6, height: 6, borderRadius: 3 },
  eyebrow: {
    fontFamily: 'JetBrainsMono_400Regular',
    fontSize: 10,
    letterSpacing: 2.2,
  },
  item: {
    paddingVertical: 12,
    gap: 2,
  },
  kind: {
    fontFamily: 'JetBrainsMono_400Regular',
    fontSize: 9,
    letterSpacing: 2,
  },
  label: {
    fontFamily: 'Fraunces_400Regular',
    fontSize: 15,
    lineHeight: 20,
    letterSpacing: -0.2,
  },
  note: {
    fontFamily: 'Pretendard_400Regular',
    fontSize: 12,
    lineHeight: 16,
  },
});
