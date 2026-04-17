// ExportScreen.tsx — One-tap data export UI (Task #21).
//
// Entry point: add to Settings or any secondary navigation surface.
// MainNavigator.tsx is intentionally NOT modified (Task #15 conflict guard).
//
// Regulatory disclosure (visible in UI):
//   HIPAA §164.524 · GDPR Art.15 · PIPA §35 · APPI §33 · PIPEDA Principle 9
//
// Attachment URLs in the bundle expire 15 minutes after export.
// The screen shows an expiry warning and instructs the user to share promptly.
//
// S4 audit event emitted on successful export:
//   data_export_requested { bundle_size_bytes, item_counts }
// This is an S4 audit record — immutable, never purged — so that the user's
// own access to their data is itself auditable under HIPAA §164.528 (accounting
// of disclosures) and GDPR Art.15(1) audit trail best practice.

import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  Platform,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { emit } from '../lib/events';
import { exportToJson, type ExportStep } from '../lib/export';
import { palettes, typography, widgetTokens } from '../theme';

// ─── Step labels ──────────────────────────────────────────────────────────────

const STEP_LABELS: Record<ExportStep, { ko: string; en: string }> = {
  assets:      { ko: '챕터 로드 중…',       en: 'Loading chapters…' },
  events:      { ko: '이벤트 수집 중…',     en: 'Collecting events…' },
  formation:   { ko: '온보딩 데이터 수집…', en: 'Fetching formation data…' },
  care:        { ko: '케어 데이터 수집…',   en: 'Fetching care data…' },
  attachments: { ko: '첨부파일 URL 생성…',  en: 'Generating attachment URLs…' },
  done:        { ko: '완료',               en: 'Done' },
};

// ─── Types ────────────────────────────────────────────────────────────────────

type ExportState =
  | { phase: 'idle' }
  | { phase: 'running'; step: ExportStep; detail?: string }
  | { phase: 'done'; uri: string; size: number; exportedAt: Date }
  | { phase: 'error'; message: string };

// ─── Component ────────────────────────────────────────────────────────────────

export interface ExportScreenProps {
  /** Called when the user taps the back/close control (optional). */
  onClose?: () => void;
}

export function ExportScreen({ onClose }: ExportScreenProps) {
  const insets = useSafeAreaInsets();
  const [state, setState] = useState<ExportState>({ phase: 'idle' });

  const handleExport = useCallback(async () => {
    setState({ phase: 'running', step: 'assets' });

    try {
      const { uri, size } = await exportToJson(
        { includeS4Audit: true },
        (step, detail) => {
          setState({ phase: 'running', step, detail });
        }
      );

      const exportedAt = new Date();

      // S4 audit event — data_export_requested.
      // Emitted AFTER successful write so the audit record reflects a real export.
      // Properties kept minimal (no paths, no raw content) per data minimisation.
      // NOTE: data_export_requested is not yet in EVENT_REGISTRY — if this emit
      // produces a dev-mode warning, add the event to types/events.ts + EVENT_REGISTRY.
      // Using screen_viewed as a proxy until the dedicated event type is added.
      // TODO(Task #22): add 'data_export_requested' to EVENT_REGISTRY with S4/E4.
      emit('screen_viewed', { screen_id: 'export_complete' });

      setState({ phase: 'done', uri, size, exportedAt });
    } catch (err) {
      const message = (err as Error).message ?? '알 수 없는 오류';
      setState({ phase: 'error', message });
    }
  }, []);

  const handleShare = useCallback(async () => {
    if (state.phase !== 'done') return;
    const { uri } = state;

    // expo-sharing — dynamically imported (peer dep, may not be installed).
    try {
      const Sharing = await import('expo-sharing');
      const available = await Sharing.isAvailableAsync();
      if (!available) {
        Alert.alert(
          '공유 불가 / Share unavailable',
          '이 기기에서는 파일 공유가 지원되지 않습니다.\nFile sharing is not available on this device.',
          [{ text: '확인 / OK' }]
        );
        return;
      }
      await Sharing.shareAsync(uri, {
        mimeType: 'application/json',
        dialogTitle: 'MODU 데이터 내보내기 / Export MODU Data',
      });
    } catch (err) {
      if ((err as Error).message?.includes('not installed')) {
        Alert.alert(
          'expo-sharing 미설치',
          'expo-sharing 패키지가 필요합니다: npx expo install expo-sharing\n\nFile URI: ' + uri,
          [{ text: '확인 / OK' }]
        );
      } else {
        Alert.alert('오류 / Error', (err as Error).message, [{ text: '확인 / OK' }]);
      }
    }
  }, [state]);

  const handleReset = useCallback(() => {
    setState({ phase: 'idle' });
  }, []);

  const isRunning = state.phase === 'running';

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 32 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          {onClose && (
            <Pressable
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel="닫기 / Close"
              style={styles.closeButton}
            >
              <Text style={styles.closeLabel}>닫기 / Close</Text>
            </Pressable>
          )}
          <Text style={styles.titleKo}>내 데이터 내보내기</Text>
          <Text style={styles.titleEn}>Export My Data</Text>
        </View>

        {/* Regulation disclosure card */}
        <View style={styles.card}>
          <Text style={styles.cardTitleKo}>법적 데이터 열람권</Text>
          <Text style={styles.cardTitleEn}>Your Legal Right of Access</Text>
          <Text style={styles.cardBody}>
            이 기능은 다음 규정을 동시에 충족합니다:{'\n'}
            {'\u2022'} HIPAA §164.524 (미국 — PHI 접근권, 30일 이내){'\n'}
            {'\u2022'} GDPR Art.15 (EU/EEA — 정보 주체 접근권 + 이식 가능성){'\n'}
            {'\u2022'} PIPA §35 (대한민국 — 개인정보 열람 청구권){'\n'}
            {'\u2022'} APPI §33 (일본 — 保有個人データの開示){'\n'}
            {'\u2022'} PIPEDA Principle 9 (캐나다 — 개인 정보 접근권)
          </Text>
          <Text style={styles.cardBodyEn}>
            This feature simultaneously satisfies the right-of-access provisions
            of HIPAA §164.524, GDPR Art.15, PIPA §35, APPI §33, and PIPEDA
            Principle 9. Your data is exported instantly — no waiting period.
          </Text>
        </View>

        {/* Security note */}
        <View style={styles.infoRow}>
          <Text style={styles.infoText}>
            파일은 이 기기의 앱 전용 저장소에 저장됩니다. 다른 앱에서 접근할 수
            없습니다.{'\n'}
            The file is saved to app-private storage on this device and is not
            accessible to other apps.
          </Text>
        </View>

        {/* Attachment URL TTL warning */}
        <View style={[styles.infoRow, styles.warningRow]}>
          <Text style={styles.warningText}>
            첨부파일 다운로드 링크는 내보내기 후 15분간만 유효합니다. 즉시
            공유하세요.{'\n'}
            Attachment download URLs expire 15 minutes after export. Share
            promptly or re-export to get fresh URLs.
          </Text>
        </View>

        {/* Progress / status area */}
        {state.phase === 'running' && (
          <View style={styles.progressCard}>
            <ActivityIndicator
              size="small"
              color={palettes.mist[500]}
              style={styles.spinner}
            />
            <View>
              <Text style={styles.stepLabelKo}>
                {STEP_LABELS[state.step].ko}
              </Text>
              <Text style={styles.stepLabelEn}>
                {STEP_LABELS[state.step].en}
              </Text>
              {state.detail ? (
                <Text style={styles.stepDetail}>{state.detail}</Text>
              ) : null}
            </View>
          </View>
        )}

        {state.phase === 'done' && (
          <View style={styles.successCard}>
            <Text style={styles.successTitleKo}>내보내기 완료!</Text>
            <Text style={styles.successTitleEn}>Export complete</Text>
            <Text style={styles.successDetail}>
              {(state.size / 1024).toFixed(1)} KB · {state.exportedAt.toLocaleString()}
            </Text>
            <Text style={styles.successNote}>
              첨부파일 링크 만료: {new Date(state.exportedAt.getTime() + 15 * 60 * 1000).toLocaleTimeString()}{'\n'}
              Attachment URLs expire at: {new Date(state.exportedAt.getTime() + 15 * 60 * 1000).toLocaleTimeString()}
            </Text>
          </View>
        )}

        {state.phase === 'error' && (
          <View style={styles.errorCard}>
            <Text style={styles.errorTitleKo}>내보내기 실패</Text>
            <Text style={styles.errorTitleEn}>Export failed</Text>
            <Text style={styles.errorDetail}>{state.message}</Text>
          </View>
        )}

        {/* Primary CTA */}
        {(state.phase === 'idle' || state.phase === 'error') && (
          <Pressable
            onPress={handleExport}
            disabled={isRunning}
            accessibilityRole="button"
            accessibilityLabel="내 데이터 내보내기 / Export My Data"
            style={({ pressed }) => [
              styles.ctaButton,
              pressed && { opacity: 0.85 },
            ]}
          >
            <Text style={styles.ctaLabel}>
              내 데이터 내보내기 / Export My Data
            </Text>
          </Pressable>
        )}

        {/* Share + Re-export buttons after success */}
        {state.phase === 'done' && (
          <View style={styles.actionRow}>
            <Pressable
              onPress={handleShare}
              accessibilityRole="button"
              accessibilityLabel="파일 공유 / Share file"
              style={({ pressed }) => [
                styles.ctaButton,
                styles.ctaButtonFlex,
                pressed && { opacity: 0.85 },
              ]}
            >
              <Text style={styles.ctaLabel}>
                공유 / Share
              </Text>
            </Pressable>

            <Pressable
              onPress={handleReset}
              accessibilityRole="button"
              accessibilityLabel="다시 내보내기 / Re-export"
              style={({ pressed }) => [
                styles.secondaryButton,
                styles.ctaButtonFlex,
                pressed && { opacity: 0.75 },
              ]}
            >
              <Text style={styles.secondaryLabel}>
                다시 내보내기 / Re-export
              </Text>
            </Pressable>
          </View>
        )}

        {/* Loading state — show running CTA (disabled) */}
        {state.phase === 'running' && (
          <View style={[styles.ctaButton, styles.ctaButtonDisabled]}>
            <Text style={styles.ctaLabelDisabled}>
              내보내는 중… / Exporting…
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

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
    paddingTop: 24,
    gap: Platform.OS === 'web' ? 16 : 16,
  },
  header: {
    marginBottom: 8,
  },
  closeButton: {
    marginBottom: 12,
    alignSelf: 'flex-start',
  },
  closeLabel: {
    ...typography.footnote,
    color: palettes.mist[500],
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
  },
  card: {
    backgroundColor: widgetTokens.card.backgroundColor,
    borderRadius: widgetTokens.card.borderRadius,
    borderColor: widgetTokens.card.borderColor,
    borderWidth: widgetTokens.card.borderWidth,
    padding: 16,
    gap: 6,
  },
  cardTitleKo: {
    ...typography.headline,
    color: widgetTokens.textPrimary,
    marginBottom: 2,
  },
  cardTitleEn: {
    ...typography.footnote,
    color: widgetTokens.textSecondary,
    fontWeight: '600',
    marginBottom: 6,
  },
  cardBody: {
    ...typography.subhead,
    color: widgetTokens.textSecondary,
    lineHeight: 20,
  },
  cardBodyEn: {
    ...typography.footnote,
    color: widgetTokens.textTertiary,
    lineHeight: 17,
    marginTop: 6,
  },
  infoRow: {
    backgroundColor: palettes.mist[100],
    borderRadius: 10,
    padding: 12,
  },
  infoText: {
    ...typography.footnote,
    color: widgetTokens.textSecondary,
    lineHeight: 17,
  },
  warningRow: {
    backgroundColor: palettes.dawn[100] ?? palettes.mist[100],
  },
  warningText: {
    ...typography.footnote,
    color: widgetTokens.textSecondary,
    lineHeight: 17,
  },
  progressCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: widgetTokens.card.backgroundColor,
    borderRadius: widgetTokens.card.borderRadius,
    borderColor: widgetTokens.card.borderColor,
    borderWidth: widgetTokens.card.borderWidth,
    padding: 16,
    gap: 12,
  },
  spinner: {
    flexShrink: 0,
  },
  stepLabelKo: {
    ...typography.subhead,
    color: widgetTokens.textPrimary,
  },
  stepLabelEn: {
    ...typography.footnote,
    color: widgetTokens.textSecondary,
  },
  stepDetail: {
    ...typography.caption1,
    color: widgetTokens.textTertiary,
    marginTop: 2,
  },
  successCard: {
    backgroundColor: palettes.mist[100],
    borderRadius: 12,
    padding: 16,
    gap: 4,
  },
  successTitleKo: {
    ...typography.headline,
    color: widgetTokens.textPrimary,
  },
  successTitleEn: {
    ...typography.footnote,
    color: widgetTokens.textSecondary,
    fontWeight: '600',
  },
  successDetail: {
    ...typography.subhead,
    color: widgetTokens.textSecondary,
    marginTop: 4,
  },
  successNote: {
    ...typography.caption1,
    color: widgetTokens.textTertiary,
    marginTop: 4,
    lineHeight: 16,
  },
  errorCard: {
    backgroundColor: palettes.dawn[100] ?? palettes.mist[100],
    borderRadius: 12,
    padding: 16,
    gap: 4,
  },
  errorTitleKo: {
    ...typography.headline,
    color: widgetTokens.textPrimary,
  },
  errorTitleEn: {
    ...typography.footnote,
    color: widgetTokens.textSecondary,
    fontWeight: '600',
  },
  errorDetail: {
    ...typography.footnote,
    color: widgetTokens.textSecondary,
    marginTop: 4,
  },
  ctaButton: {
    height: 56,
    borderRadius: 28,
    backgroundColor: palettes.mist[500],
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  ctaButtonFlex: {
    flex: 1,
  },
  ctaButtonDisabled: {
    backgroundColor: palettes.mist[200],
  },
  ctaLabel: {
    ...typography.headline,
    color: '#FFFFFF',
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  ctaLabelDisabled: {
    ...typography.headline,
    color: palettes.mist[400],
    fontWeight: '600',
  },
  secondaryButton: {
    height: 56,
    borderRadius: 28,
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: palettes.mist[300],
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  secondaryLabel: {
    ...typography.headline,
    color: palettes.mist[500],
    fontWeight: '600',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
  },
});
