// Editorial primitive: EditorialResources — place-based resource list.
// Returns null when items is empty.
// Fix 14: replace item.kind.toUpperCase() with KR label map RESOURCE_KIND_LABEL.
//         ResourceKind extended to include 'community' per reference JSX.
import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { PaletteSwatch } from '../../../../theme';
import { SectionLabel } from '../SectionLabel';
import { s, r } from '../../../../theme';

export type ResourceKind = 'subsidy' | 'clinic' | 'community' | 'pharmacy';

export interface ResourceItem {
  readonly kind: ResourceKind;
  readonly label: string;
  readonly note?: string;
}

export interface EditorialResourcesProps {
  readonly palette: PaletteSwatch;
  readonly placeLabel: string;
  readonly items: ReadonlyArray<ResourceItem>;
}

const KIND_ICON: Readonly<Record<ResourceKind, React.ComponentProps<typeof Ionicons>['name']>> = {
  subsidy: 'sparkles-outline',
  clinic: 'home-outline',
  community: 'calendar-outline',
  pharmacy: 'medical-outline',
};

// Fix 14: KR-only label map, no .toUpperCase() debug string
const RESOURCE_KIND_LABEL: Readonly<Record<ResourceKind, string>> = {
  clinic: '병원',
  subsidy: '지원',
  community: '커뮤니티',
  pharmacy: '약국',
};

export function EditorialResources({
  palette,
  placeLabel,
  items,
}: EditorialResourcesProps): React.JSX.Element | null {
  if (items.length === 0) return null;

  return (
    <View style={styles.wrap}>
      <SectionLabel palette={palette}>
        {'이곳에서 · '}
        {placeLabel}
      </SectionLabel>

      <View style={styles.list}>
        {items.map((item, i) => (
          <Pressable
            key={`${item.kind}-${i}`}
            accessibilityLabel={item.label}
            accessibilityHint="탭하여 상세 정보를 확인하세요"
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            style={[
              styles.row,
              {
                backgroundColor: palette[50],
                borderColor: palette[300],
                borderRadius: r.md,
              },
            ]}
          >
            {/* Icon tile */}
            <View style={[styles.iconTile, { backgroundColor: palette[100], borderRadius: r.sm }]}>
              <Ionicons name={KIND_ICON[item.kind]} size={16} color={palette.accent} />
            </View>

            {/* Text */}
            <View style={styles.textCol}>
              {/* Fix 14: KR label, not kind.toUpperCase() */}
              <Text style={[styles.kindEyebrow, { color: palette[700] }]}>
                {RESOURCE_KIND_LABEL[item.kind]}
              </Text>
              <Text style={[styles.itemLabel, { color: palette[900] }]}>{item.label}</Text>
              {item.note !== undefined && item.note.length > 0 ? (
                <Text style={[styles.itemNote, { color: palette[700] }]}>{item.note}</Text>
              ) : null}
            </View>

            {/* Chevron */}
            <Ionicons name="chevron-forward" size={12} color={palette[500]} />
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingBottom: s.xl,
  },
  list: {
    marginHorizontal: s.xl,
    marginTop: s.md,
    gap: s.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s.md,
    padding: s.md,
    borderWidth: StyleSheet.hairlineWidth,
  },
  iconTile: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  textCol: {
    flex: 1,
    gap: 2,
  },
  kindEyebrow: {
    fontFamily: 'JetBrainsMono_400Regular',
    fontSize: 9,
    letterSpacing: 2.2,
  },
  itemLabel: {
    fontFamily: 'Fraunces_400Regular',
    fontSize: 15,
    lineHeight: 20,
    letterSpacing: -0.3,
  },
  itemNote: {
    fontFamily: 'Pretendard_400Regular',
    fontSize: 12,
    lineHeight: 16,
  },
});
