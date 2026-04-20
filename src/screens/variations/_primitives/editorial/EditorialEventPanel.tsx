// Editorial primitive: EditorialEventPanel — gradient card with 3-column stats grid.
// Uses palette.heroGradient via LinearGradient. White text throughout.
// Fix 7: shadow wrapper View (iOS bug: no shadow on LinearGradient directly).
// Fix 8: Fraunces title fontSize 52, lineHeight 50.
// Fix 15: margins marginHorizontal:20, marginTop:24, marginBottom:36.
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import type { PaletteSwatch } from '../../../../theme';
import type { ResolvedTPO } from '../../../../adapters';
import { r } from '../../../../theme';

export interface EditorialEventPanelProps {
  readonly palette: PaletteSwatch;
  readonly tpo: ResolvedTPO;
  readonly eventLabel: string;
  readonly title: string;
  readonly stats: ReadonlyArray<{ readonly key: string; readonly value: string }>;
}

export function EditorialEventPanel({
  palette,
  tpo: _tpo,
  eventLabel,
  title,
  stats,
}: EditorialEventPanelProps): React.JSX.Element {
  return (
    // Fix 15: marginHorizontal 20, marginTop 24, marginBottom 36
    // Fix 7: shadow on wrapper View, NOT on LinearGradient (iOS shadow bug)
    <View
      style={[
        styles.shadowWrap,
        {
          shadowColor: palette.accent,
          borderRadius: r.lg,
        },
      ]}
    >
      <LinearGradient
        colors={[
          palette.heroGradient.top,
          palette.heroGradient.mid,
          palette.heroGradient.bottom,
        ]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.card, { borderRadius: r.lg }]}
      >
        {/* Header row: event label + calendar icon */}
        <View style={styles.headerRow}>
          <Text style={styles.eventLabel}>{eventLabel}</Text>
          <Ionicons
            name="calendar-outline"
            size={18}
            color="rgba(255,255,255,0.85)"
          />
        </View>

        {/* Fix 8: Fraunces 52pt title, lineHeight 50 */}
        <Text style={styles.title}>{title}</Text>

        {/* Hairline divider */}
        <View style={styles.divider} />

        {/* 3-column stats grid */}
        <View style={styles.statsRow}>
          {stats.map((stat) => (
            <View key={stat.key} style={styles.statCell}>
              <Text style={styles.statKey}>{stat.key}</Text>
              <Text style={styles.statValue}>{stat.value}</Text>
            </View>
          ))}
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  shadowWrap: {
    // Fix 15: margins
    marginHorizontal: 20,
    marginTop: 24,
    marginBottom: 36,
    // Fix 7: shadow props on wrapper
    shadowOpacity: 0.20,
    shadowRadius: 40,
    shadowOffset: { width: 0, height: 20 },
    elevation: 8,
  },
  card: {
    paddingHorizontal: 28,
    paddingTop: 32,
    paddingBottom: 28,
    overflow: 'hidden',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  eventLabel: {
    fontFamily: 'JetBrainsMono_400Regular',
    fontSize: 10,
    letterSpacing: 2.8,
    textTransform: 'uppercase',
    color: 'rgba(255,255,255,0.88)',
  },
  title: {
    fontFamily: 'Fraunces_400Regular',
    // Fix 8: 52pt, lineHeight 50
    fontSize: 52,
    lineHeight: 50,
    letterSpacing: -1.4,
    color: '#FFFFFF',
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(255,255,255,0.28)',
    marginTop: 20,
    marginBottom: 20,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 20,
  },
  statCell: {
    flex: 1,
  },
  statKey: {
    fontFamily: 'JetBrainsMono_400Regular',
    fontSize: 9,
    letterSpacing: 2.2,
    textTransform: 'uppercase',
    color: 'rgba(255,255,255,0.75)',
    marginBottom: 6,
  },
  statValue: {
    fontFamily: 'Fraunces_400Regular',
    fontSize: 20,
    letterSpacing: -0.6,
    color: '#FFFFFF',
  },
});
