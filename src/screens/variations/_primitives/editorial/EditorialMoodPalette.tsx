// Editorial primitive: EditorialMoodPalette — 4-chip mood selector.
// Chip selection animates via Reanimated Layout. No raw hex — palette tokens only.
// Fix 9: chip grid wrapped in LinearGradient (palette[50]→palette[100]),
//         chip borderColor gets 50% opacity suffix when not selected.
import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Animated, { Layout } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import type { PaletteSwatch } from '../../../../theme';
import { SectionLabel } from '../SectionLabel';
import { s, r } from '../../../../theme';

export interface EditorialMoodPaletteProps {
  readonly palette: PaletteSwatch;
  readonly prompt?: string;
}

const MOODS: ReadonlyArray<{
  readonly icon: 'leaf-outline' | 'sparkles-outline' | 'cloud-outline' | 'moon-outline';
  readonly label: string;
}> = [
  { icon: 'leaf-outline', label: '고요' },
  { icon: 'sparkles-outline', label: '설렘' },
  { icon: 'cloud-outline', label: '벅참' },
  { icon: 'moon-outline', label: '고단' },
];

export function EditorialMoodPalette({
  palette,
  prompt = '오늘, 어느 색에 가장 가까우세요?',
}: EditorialMoodPaletteProps): React.JSX.Element {
  const [selected, setSelected] = useState<number | null>(null);

  // Fix 9: 50% opacity border for unselected chips
  const unselectedBorder = `${palette[300]}80`;

  return (
    <View style={[styles.wrap, { borderColor: palette[300] }]}>
      <SectionLabel palette={palette}>지금의 색</SectionLabel>

      <Text style={[styles.prompt, { color: palette[900] }]}>{prompt}</Text>

      {/* Fix 9: chip grid wrapped in LinearGradient */}
      <LinearGradient
        colors={[palette[50], palette[100]]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gridGradient}
      >
        <View style={styles.grid}>
          {MOODS.map((mood, i) => {
            const isSelected = selected === i;
            return (
              <Pressable
                key={mood.label}
                onPress={() => setSelected(i)}
                accessibilityLabel={`무드 선택: ${mood.label}`}
                accessibilityHint="탭하여 오늘의 무드를 선택하세요"
                hitSlop={8}
                style={styles.chipPressable}
              >
                <Animated.View
                  layout={Layout.duration(120)}
                  style={[
                    styles.chip,
                    {
                      backgroundColor: isSelected ? palette.accent : palette[50],
                      borderColor: isSelected ? palette.accent : unselectedBorder,
                      transform: [{ scale: isSelected ? 1.04 : 1 }],
                    },
                  ]}
                >
                  <Ionicons
                    name={mood.icon}
                    size={22}
                    color={isSelected ? '#FFFFFF' : palette.accent}
                  />
                  <Text
                    style={[
                      styles.chipLabel,
                      { color: isSelected ? '#FFFFFF' : palette[700] },
                    ]}
                  >
                    {mood.label}
                  </Text>
                </Animated.View>
              </Pressable>
            );
          })}
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginHorizontal: s.lg,
    marginBottom: s.xl,
    borderRadius: r.lg,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  prompt: {
    fontFamily: 'Fraunces_400Regular',
    fontSize: 22,
    lineHeight: 28,
    letterSpacing: -0.6,
    paddingHorizontal: s.lg,
    marginTop: s.sm,
    marginBottom: s.lg,
  },
  // Fix 9: gradient wraps the chip grid
  gridGradient: {
    paddingBottom: s.lg,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: s.sm,
    paddingHorizontal: s.lg,
    paddingBottom: s.sm,
  },
  chipPressable: {
    flex: 1,
    minWidth: '44%',
  },
  chip: {
    paddingVertical: 18,
    paddingHorizontal: s.sm,
    borderRadius: r.md,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    gap: s.sm,
  },
  chipLabel: {
    fontFamily: 'Fraunces_400Regular',
    fontSize: 13,
    letterSpacing: -0.3,
  },
});
