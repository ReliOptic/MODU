// Morph mood — vertical timeline spine. Proximity-keyed event sets.
// Gradient rail line; primary events get filled dot + accent text.
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import type { PaletteSwatch } from '../../../../theme';
import type { MorphTimelineItem } from '../../fertility/morphData';
import { s } from '../../../../theme';

export interface MorphTimelineProps {
  readonly palette: PaletteSwatch;
  readonly items: ReadonlyArray<MorphTimelineItem>;
  readonly sectionTitle?: string;
  readonly reduceMotion: boolean;
}

export function MorphTimeline({
  palette,
  items,
  sectionTitle = '오늘의 흐름',
  reduceMotion,
}: MorphTimelineProps): React.JSX.Element {
  return (
    <View
      style={[
        styles.card,
        { backgroundColor: palette[100], borderColor: palette[200] },
      ]}
    >
      {/* Section eyebrow */}
      <View style={styles.eyebrowRow}>
        <View style={[styles.eyebrowLine, { backgroundColor: palette.accent }]} />
        <Text style={[styles.eyebrow, { color: palette[600] }]}>
          {sectionTitle.toUpperCase()}
        </Text>
      </View>

      {/* Rail + items */}
      <View style={styles.rail}>
        {/* Gradient rail line */}
        <LinearGradient
          colors={[palette[200], palette.accent, palette[200]]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={styles.railLine}
        />

        {items.map((item, i) => {
          const entering = reduceMotion
            ? undefined
            : FadeIn.delay(i * 60 + 100).duration(340);
          return (
            <Animated.View
              key={`${item.time}-${i}`}
              entering={entering}
              style={styles.row}
            >
              {/* Dot */}
              <View
                style={[
                  styles.dot,
                  {
                    backgroundColor: item.primary ? palette.accent : palette[100],
                    borderColor: palette.accent,
                    width: item.primary ? 14 : 9,
                    height: item.primary ? 14 : 9,
                    borderRadius: item.primary ? 7 : 4.5,
                    marginTop: item.primary ? 1 : 3.5,
                  },
                ]}
              />
              {/* Text */}
              <View style={styles.textBlock}>
                <Text style={[styles.time, { color: palette[600] }]}>
                  {item.time}
                </Text>
                <View style={styles.titleRow}>
                  <Ionicons
                    name={item.iconName as React.ComponentProps<typeof Ionicons>['name']}
                    size={16}
                    color={item.primary ? palette.accent : palette[600]}
                  />
                  <Text
                    style={[
                      styles.title,
                      { color: item.primary ? palette.accent : palette[900] },
                    ]}
                  >
                    {item.title}
                  </Text>
                </View>
                {item.note !== undefined && (
                  <Text style={[styles.note, { color: palette[600] }]}>
                    {item.note}
                  </Text>
                )}
              </View>
            </Animated.View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: s.lg,
    borderRadius: 26,
    borderWidth: 1,
    padding: 22,
  },
  eyebrowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 18,
  },
  eyebrowLine: {
    width: 16,
    height: 1,
  },
  eyebrow: {
    fontFamily: 'JetBrainsMono_400Regular',
    fontSize: 10,
    letterSpacing: 2.2,
  },
  rail: {
    position: 'relative',
    paddingLeft: 22,
  },
  railLine: {
    position: 'absolute',
    left: 4,
    top: 8,
    bottom: 8,
    width: 1.5,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 14,
  },
  dot: {
    borderWidth: 1.5,
    flexShrink: 0,
  },
  textBlock: {
    flex: 1,
    gap: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  time: {
    fontFamily: 'JetBrainsMono_400Regular',
    fontSize: 9,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  title: {
    fontFamily: 'Fraunces_400Regular',
    fontSize: 17,
    lineHeight: 22,
    letterSpacing: -0.3,
  },
  note: {
    fontFamily: 'Pretendard_400Regular',
    fontSize: 11,
    lineHeight: 15,
  },
});
