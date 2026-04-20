// Editorial primitive: EditorialTimeline — vertical spine with animated items.
// Spine: 3-stop LinearGradient vertical. Items: FadeIn.delay per index.
// Fix 5: primary rows get a 44×44 halo outer View (6px ring via palette[100] bg).
// Reduce-motion: entering animation skipped when AccessibilityInfo reduce motion is on.
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import type { PaletteSwatch } from '../../../../theme';
import { SectionLabel } from '../SectionLabel';
import { s, r } from '../../../../theme';
import { useReduceMotion } from '../../../../hooks/useReduceMotion';

export interface TimelineItem {
  readonly time: string;
  readonly title: string;
  readonly note: string;
  readonly icon: string;
  readonly primary?: boolean;
}

export interface EditorialTimelineProps {
  readonly palette: PaletteSwatch;
  readonly items: ReadonlyArray<TimelineItem>;
  readonly sectionTitle: string;
}

export function EditorialTimeline({
  palette,
  items,
  sectionTitle,
}: EditorialTimelineProps): React.JSX.Element {
  const reduceMotion = useReduceMotion();

  return (
    <View style={styles.wrap}>
      <SectionLabel palette={palette}>{sectionTitle}</SectionLabel>

      <View style={styles.body}>
        {/* Vertical spine: 3-stop gradient */}
        <View style={styles.spineWrap} pointerEvents="none">
          <LinearGradient
            colors={[palette[100], palette.accent, palette[100]]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={StyleSheet.absoluteFillObject}
          />
        </View>

        {items.map((item, i) => (
          <Animated.View
            key={`${item.time}-${i}`}
            entering={reduceMotion ? undefined : FadeIn.delay(120 + i * 80).duration(400)}
            style={styles.row}
          >
            {/* Fix 5: primary rows get outer 44×44 halo ring */}
            {item.primary ? (
              <View
                style={[
                  styles.haloOuter,
                  { backgroundColor: palette[100] },
                ]}
              >
                <View
                  style={[
                    styles.iconCircle,
                    {
                      backgroundColor: palette.accent,
                      borderColor: palette.accent,
                    },
                  ]}
                >
                  <Ionicons
                    name={item.icon as any}
                    size={14}
                    color="#FFFFFF"
                  />
                </View>
              </View>
            ) : (
              <View
                style={[
                  styles.iconCircle,
                  {
                    backgroundColor: palette[50],
                    borderColor: palette.accent,
                  },
                ]}
              >
                <Ionicons
                  name={item.icon as any}
                  size={14}
                  color={palette.accent}
                />
              </View>
            )}

            {/* Text content */}
            <View style={styles.textCol}>
              <Text style={[styles.timeLabel, { color: palette[700] }]}>
                {item.time}
              </Text>
              <Text
                style={[
                  styles.itemTitle,
                  {
                    color: item.primary ? palette.accent : palette[900],
                    fontSize: item.primary ? 22 : 18,
                  },
                ]}
              >
                {item.title}
              </Text>
              <Text style={[styles.itemNote, { color: palette[700] }]}>
                {item.note}
              </Text>
            </View>
          </Animated.View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingBottom: s.xl,
  },
  body: {
    marginHorizontal: s.xl,
    marginTop: s.lg,
    position: 'relative',
  },
  spineWrap: {
    position: 'absolute',
    left: 15,
    top: 10,
    bottom: 10,
    width: 1,
  },
  row: {
    flexDirection: 'row',
    gap: s.lg,
    marginBottom: s.xl,
    alignItems: 'flex-start',
  },
  // Fix 5: outer halo for primary circles (simulates 6px ring)
  haloOuter: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    zIndex: 1,
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: r.full,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    zIndex: 1,
  },
  textCol: {
    flex: 1,
    paddingTop: 4,
    gap: 2,
  },
  timeLabel: {
    fontFamily: 'JetBrainsMono_400Regular',
    fontSize: 10,
    letterSpacing: 2.2,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  itemTitle: {
    fontFamily: 'Fraunces_400Regular',
    lineHeight: 26,
    letterSpacing: -0.6,
  },
  itemNote: {
    fontFamily: 'Pretendard_400Regular',
    fontSize: 13,
    lineHeight: 18,
    marginTop: 2,
  },
});
