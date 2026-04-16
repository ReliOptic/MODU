// 동적 하단 탭바 — 에셋별 tabs[] 4개. iOS 표준 84pt + blur (§7.3 tabBar)
// active = palette accent, inactive = textTertiary
import React from 'react';
import { View, Text, Pressable, StyleSheet, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { TabConfig, TabIcon } from '../types';
import { typography, widgetTokens, getPalette, PaletteKey } from '../theme';

export interface TabBarProps {
  tabs: TabConfig[];
  activeTabId: string;
  onSelect: (tabId: string) => void;
  palette: PaletteKey;
}

const ICON_MAP: Record<TabIcon, keyof typeof Ionicons.glyphMap> = {
  house: 'home-outline',
  calendar: 'calendar-outline',
  'face.smile': 'happy-outline',
  'person.2': 'people-outline',
  checklist: 'checkbox-outline',
  lightbulb: 'bulb-outline',
  pawprint: 'paw-outline',
  gear: 'settings-outline',
  'chart.line': 'stats-chart-outline',
  'square.grid': 'grid-outline',
};

const ICON_MAP_FILLED: Record<TabIcon, keyof typeof Ionicons.glyphMap> = {
  house: 'home',
  calendar: 'calendar',
  'face.smile': 'happy',
  'person.2': 'people',
  checklist: 'checkbox',
  lightbulb: 'bulb',
  pawprint: 'paw',
  gear: 'settings',
  'chart.line': 'stats-chart',
  'square.grid': 'grid',
};

export function TabBar({ tabs, activeTabId, onSelect, palette }: TabBarProps) {
  const insets = useSafeAreaInsets();
  const p = getPalette(palette);
  const useBlur = Platform.OS !== 'web';

  return (
    <View style={[styles.wrap, { paddingBottom: Math.max(insets.bottom, 8) }]}>
      {useBlur && (
        <BlurView
          intensity={widgetTokens.tabBar.blurIntensity}
          tint={widgetTokens.tabBar.blurTint}
          style={StyleSheet.absoluteFillObject}
        />
      )}
      {!useBlur && <View style={[StyleSheet.absoluteFillObject, styles.solid]} />}
      <View style={styles.row}>
        {tabs.map((t) => {
          const isActive = t.id === activeTabId;
          const iconName = isActive ? ICON_MAP_FILLED[t.icon] : ICON_MAP[t.icon];
          return (
            <Pressable
              key={t.id}
              onPress={() => onSelect(t.id)}
              accessibilityRole="tab"
              accessibilityState={{ selected: isActive }}
              accessibilityLabel={t.label}
              style={({ pressed }) => [styles.cell, pressed && { opacity: 0.7 }]}
            >
              <Ionicons
                name={iconName}
                size={24}
                color={isActive ? p[500] : widgetTokens.textTertiary}
              />
              <Text
                style={[
                  styles.label,
                  { color: isActive ? p[500] : widgetTokens.textTertiary, fontWeight: isActive ? '600' : '400' },
                ]}
                numberOfLines={1}
              >
                {t.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    borderTopWidth: widgetTokens.tabBar.borderTopWidth,
    borderTopColor: widgetTokens.tabBar.borderTopColor,
    overflow: 'hidden',
  },
  solid: {
    backgroundColor: widgetTokens.tabBar.backgroundColor,
  },
  row: {
    flexDirection: 'row',
    height: widgetTokens.tabBar.barHeight,
    paddingHorizontal: 8,
  },
  cell: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  label: {
    ...typography.caption2,
  },
});
