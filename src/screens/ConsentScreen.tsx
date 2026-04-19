// Onboarding consent screen — shown once before Formation.
// Three required acknowledgment items; "Begin" button disabled until all checked.
// en-US + ko-KR co-rendered on a single screen (ADR-0014).
// Emits consent_screen_shown + three consent_decision_recorded events (S4/E4) on accept.
// Persists acceptance to AsyncStorage so subsequent launches skip this screen.
// Hidden B2G: no institutional or government language in user-facing copy.

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { emit } from '../lib/events';
import { palettes, typography, widgetTokens } from '../theme';
import type { ConsentItem } from '../types/events';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Storage key for persisted consent record. */
export const CONSENT_STORAGE_KEY = '@modu/consent:v1';

/** Screen version string — bump when copy or items change. */
export const CONSENT_SCREEN_VERSION = 'v1.0.0-2026-04-17';

// ---------------------------------------------------------------------------
// Consent item definitions
// ---------------------------------------------------------------------------

interface ConsentItemDef {
  id: ConsentItem;
  enTitle: string;
  enBody: string;
  koTitle: string;
  koBody: string;
}

const CONSENT_ITEMS: ConsentItemDef[] = [
  {
    id: 'local_default',
    enTitle: 'Your data stays on this device',
    enBody:
      'MODU stores your entries on this device by default. Nothing leaves without you asking.',
    koTitle: '기록은 이 기기에 저장됩니다',
    koBody:
      'MODU는 기본적으로 당신의 기록을 이 기기에만 저장합니다. 동의 없이 외부로 나가지 않습니다.',
  },
  {
    id: 'sync_future',
    enTitle: 'Sync is off by default',
    enBody:
      'You can turn on sync between your devices later. Off by default.',
    koTitle: '기기 간 동기화는 기본 OFF',
    koBody:
      '향후 기기 간 sync를 원할 때 켤 수 있습니다. 기본은 OFF입니다.',
  },
  {
    id: 'aggregate_research',
    enTitle: 'Research contribution is opt-in',
    enBody:
      'You can contribute anonymized aggregate signals to MODU\'s research later. Off by default.',
    koTitle: '연구 기여는 선택 사항',
    koBody:
      '향후 MODU 연구를 위한 익명 집계에 기여할지 선택할 수 있습니다. 기본은 OFF입니다.',
  },
];

// ---------------------------------------------------------------------------
// Stored record shape
// ---------------------------------------------------------------------------

export interface ConsentRecord {
  screen_version: string;
  accepted_at: string;
  items: ConsentItem[];
}

/** Read persisted consent record; returns null if not yet stored. */
export async function readConsentRecord(): Promise<ConsentRecord | null> {
  try {
    const raw = await AsyncStorage.getItem(CONSENT_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as ConsentRecord) : null;
  } catch {
    return null;
  }
}

/** Persist a consent record. */
async function writeConsentRecord(record: ConsentRecord): Promise<void> {
  await AsyncStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(record));
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export interface ConsentScreenProps {
  onAccepted: () => void;
}

export function ConsentScreen({ onAccepted }: ConsentScreenProps) {
  const insets = useSafeAreaInsets();
  const [checked, setChecked] = useState<Record<ConsentItem, boolean>>({
    local_default: false,
    sync_future: false,
    aggregate_research: false,
  });
  const allChecked = Object.values(checked).every(Boolean);
  // Guard: emit consent_screen_shown only once per mount, even in StrictMode.
  const shownRef = useRef(false);

  // Emit consent_screen_shown once on mount
  useEffect(() => {
    if (shownRef.current) return;
    shownRef.current = true;
    emit('consent_screen_shown', { screen_version: CONSENT_SCREEN_VERSION });
  }, []);

  const toggle = useCallback((id: ConsentItem) => {
    setChecked((prev) => ({ ...prev, [id]: !prev[id] }));
  }, []);

  const handleAccept = useCallback(async () => {
    if (!allChecked) return;
    const now = new Date().toISOString();

    // Persist FIRST — if this fails, we must not emit or navigate (audit consistency).
    const record: ConsentRecord = {
      screen_version: CONSENT_SCREEN_VERSION,
      accepted_at: now,
      items: CONSENT_ITEMS.map((i) => i.id),
    };
    try {
      await writeConsentRecord(record);
    } catch (err) {
      console.warn('[ConsentScreen] Failed to persist consent record — aborting accept', err);
      return;
    }

    // Emit S4/E4 audit events only after storage succeeds.
    for (const item of CONSENT_ITEMS) {
      emit('consent_decision_recorded', {
        item: item.id,
        decision: 'acknowledged',
        decided_at: now,
      });
    }

    onAccepted();
  }, [allChecked, onAccepted]);

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={[palettes.mist[50], palettes.dawn[50], '#FFFFFF']}
        locations={[0, 0.5, 1]}
        style={StyleSheet.absoluteFillObject}
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + 32, paddingBottom: insets.bottom + 24 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.brand}>MODU</Text>
          <Text style={styles.titleKo}>시작 전에 알려드립니다</Text>
          <Text style={styles.titleEn}>Before we begin</Text>
          <Text style={styles.subtitleKo}>
            아래 세 가지를 확인하고 동의하시면 시작할 수 있습니다.
          </Text>
          <Text style={styles.subtitleEn}>
            Please review and acknowledge the three items below to continue.
          </Text>
        </View>

        {/* Consent items */}
        <View style={styles.itemsContainer}>
          {CONSENT_ITEMS.map((item) => (
            <ConsentItemRow
              key={item.id}
              item={item}
              checked={checked[item.id]}
              onToggle={() => toggle(item.id)}
            />
          ))}
        </View>

        {/* Legal placeholder */}
        <Text style={styles.legalNote}>
          This acknowledgment is not a waiver of rights. Full privacy details
          will be available in Settings.{'\n'}
          이 동의는 권리 포기가 아닙니다. 전체 개인정보 안내는 설정에서 확인할
          수 있습니다.
        </Text>

        {/* CTA */}
        <Pressable
          onPress={handleAccept}
          disabled={!allChecked}
          accessibilityRole="button"
          accessibilityLabel="시작하기 / Begin"
          accessibilityState={{ disabled: !allChecked }}
          style={({ pressed }) => [
            styles.ctaWrapper,
            !allChecked && styles.ctaDisabled,
            pressed && allChecked && { opacity: 0.88 },
          ]}
        >
          {allChecked ? (
            <LinearGradient
              colors={[palettes.mist.heroGradient.top, palettes.mist.heroGradient.mid]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[StyleSheet.absoluteFillObject, styles.ctaRadius]}
            />
          ) : null}
          <Text style={[styles.ctaLabel, !allChecked && styles.ctaLabelDisabled]}>
            시작하기 / Begin
          </Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

// ---------------------------------------------------------------------------
// ConsentItemRow
// ---------------------------------------------------------------------------

interface ConsentItemRowProps {
  item: ConsentItemDef;
  checked: boolean;
  onToggle: () => void;
}

function ConsentItemRow({ item, checked, onToggle }: ConsentItemRowProps) {
  return (
    <Pressable
      onPress={onToggle}
      accessibilityRole="checkbox"
      accessibilityLabel={`${item.koTitle} / ${item.enTitle}`}
      accessibilityState={{ checked }}
      style={({ pressed }) => [styles.itemRow, pressed && { opacity: 0.82 }]}
    >
      <View style={[styles.checkbox, checked && styles.checkboxChecked]}>
        {checked && <Text style={styles.checkmark}>✓</Text>}
      </View>
      <View style={styles.itemText}>
        <Text style={styles.itemTitleKo}>{item.koTitle}</Text>
        <Text style={styles.itemBodyKo}>{item.koBody}</Text>
        <Text style={styles.itemTitleEn}>{item.enTitle}</Text>
        <Text style={styles.itemBodyEn}>{item.enBody}</Text>
      </View>
    </Pressable>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: palettes.mist[50],
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
  },
  header: {
    marginBottom: 28,
  },
  brand: {
    fontFamily: 'Fraunces-LightItalic',
    fontSize: 36,
    fontWeight: '300',
    letterSpacing: -1.2,
    color: widgetTokens.textPrimary,
    marginBottom: 20,
  },
  titleKo: {
    ...typography.title1,
    color: widgetTokens.textPrimary,
    marginBottom: 2,
  },
  titleEn: {
    ...typography.headline,
    color: widgetTokens.textSecondary,
    fontWeight: '400',
    marginBottom: 12,
  },
  subtitleKo: {
    ...typography.subhead,
    color: widgetTokens.textSecondary,
    marginBottom: 2,
  },
  subtitleEn: {
    ...typography.footnote,
    color: widgetTokens.textTertiary,
  },
  itemsContainer: {
    gap: Platform.OS === 'web' ? 12 : 12,
    marginBottom: 20,
  },
  itemRow: {
    flexDirection: 'row',
    backgroundColor: widgetTokens.cardV2.backgroundColor,
    borderRadius: widgetTokens.cardV2.borderRadius,
    borderColor: widgetTokens.cardV2.borderColor,
    borderWidth: widgetTokens.cardV2.borderWidth,
    padding: 16,
    gap: 12,
    alignItems: 'flex-start',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: palettes.mist[300],
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
    flexShrink: 0,
  },
  checkboxChecked: {
    backgroundColor: palettes.mist[500],
    borderColor: palettes.mist[500],
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '700',
  },
  itemText: {
    flex: 1,
    gap: 2,
  },
  itemTitleKo: {
    ...typography.headline,
    color: widgetTokens.textPrimary,
    marginBottom: 2,
  },
  itemBodyKo: {
    ...typography.subhead,
    color: widgetTokens.textSecondary,
    marginBottom: 8,
  },
  itemTitleEn: {
    ...typography.footnote,
    color: widgetTokens.textSecondary,
    fontWeight: '600',
    marginBottom: 1,
  },
  itemBodyEn: {
    ...typography.footnote,
    color: widgetTokens.textTertiary,
  },
  legalNote: {
    ...typography.caption1,
    color: widgetTokens.textTertiary,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 17,
  },
  ctaWrapper: {
    height: 56,
    borderRadius: 28,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palettes.mist[200],
  },
  ctaRadius: {
    borderRadius: 28,
  },
  ctaDisabled: {
    backgroundColor: palettes.mist[100],
  },
  ctaLabel: {
    ...typography.headline,
    color: '#FFFFFF',
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  ctaLabelDisabled: {
    color: palettes.mist[300],
  },
});
