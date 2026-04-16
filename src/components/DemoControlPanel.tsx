// Demo Hyperpersonalize Studio — 자유 입력 → 즉석 챕터 생성
// 시나리오 list 가 아니라 한 줄 입력 박스. "MODU 는 어떤 상황이든 챕터로 받는다" 를 시연.
//
// 보조: 시간 점프 (TPO) 는 작은 chip 으로 분리. asset 자동 전환은 하지 않음 (오해 방지).
import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Platform,
  TextInput,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { useDemoMode, scenarios } from '../lib/demo/useDemoMode';
import { useAssetStore } from '../store/assetStore';
import {
  generateChapter,
  toFormationData,
} from '../lib/demo/mockChapterGenerator';
import { typography } from '../theme';

const PLACEHOLDERS = [
  '예: 시험관 3회차 시작했어요',
  '예: 어머니 알츠하이머 초기',
  '예: 출산 후 회복 중',
  '예: 보리 관절약 챙겨야 해요',
  '예: 산후우울증 약 복용 시작',
  '예: 마라톤 트레이닝 12주',
  '예: 아버지 항암 5차',
  '예: 알레르기·아토피 관리',
  '예: 갑상선 수술 회복',
  '예: 아이 ADHD 진단 직후',
];

export function DemoControlPanel() {
  const enabled = useDemoMode((s) => s.enabled);
  const open = useDemoMode((s) => s.panelOpen);
  const togglePanel = useDemoMode((s) => s.togglePanel);
  const currentScenarioId = useDemoMode((s) => s.currentScenarioId);
  const setScenario = useDemoMode((s) => s.setScenario);
  const createAsset = useAssetStore((s) => s.createAsset);

  const [draft, setDraft] = useState('');
  const [phIdx, setPhIdx] = useState(0);
  const [lastReason, setLastReason] = useState<string | null>(null);

  // placeholder rotate (8초)
  useEffect(() => {
    const id = setInterval(() => setPhIdx((i) => (i + 1) % PLACEHOLDERS.length), 8000);
    return () => clearInterval(id);
  }, []);

  if (!enabled) return null;

  const handleCreate = () => {
    const trimmed = draft.trim();
    if (!trimmed) return;
    const ch = generateChapter(trimmed);
    createAsset(ch.type, toFormationData(trimmed, ch.reasoning), {
      displayName: ch.displayName,
      palette: ch.palette,
      tabs: ch.tabs,
      widgets: ch.widgets,
      events: ch.events,
    });
    setLastReason(ch.reasoning);
    setDraft('');
  };

  if (!open) {
    return (
      <Pressable
        onPress={togglePanel}
        accessibilityRole="button"
        accessibilityLabel="Demo Studio 열기"
        style={styles.bubble}
      >
        <Text style={styles.bubbleLabel}>◉</Text>
      </Pressable>
    );
  }

  const useBlur = Platform.OS !== 'web';

  return (
    <View style={styles.panel}>
      {useBlur && (
        <BlurView intensity={28} tint="dark" style={StyleSheet.absoluteFillObject} />
      )}
      {!useBlur && (
        <View
          style={[
            StyleSheet.absoluteFillObject,
            { backgroundColor: 'rgba(28,28,30,0.94)' },
          ]}
        />
      )}

      <View style={styles.header}>
        <Text style={styles.title}>Hyperpersonalize Studio</Text>
        <Pressable onPress={togglePanel} accessibilityLabel="닫기">
          <Text style={styles.headerBtn}>×</Text>
        </Pressable>
      </View>

      <Text style={styles.lead}>오늘 어떤 일을 함께할까요?</Text>
      <Text style={styles.sub}>
        무엇이든 적어주세요. 엔진이 그 상황에 맞는 챕터를 즉석에서 만들어요.
      </Text>

      <TextInput
        value={draft}
        onChangeText={setDraft}
        placeholder={PLACEHOLDERS[phIdx]}
        placeholderTextColor="rgba(255,255,255,0.45)"
        style={styles.input}
        multiline
        onSubmitEditing={handleCreate}
        returnKeyType="send"
        blurOnSubmit
      />
      <Pressable
        onPress={handleCreate}
        disabled={!draft.trim()}
        style={({ pressed }) => [
          styles.cta,
          { opacity: draft.trim() ? (pressed ? 0.85 : 1) : 0.4 },
        ]}
        accessibilityRole="button"
        accessibilityLabel="챕터 생성"
      >
        <Text style={styles.ctaLabel}>이 챕터 시작하기</Text>
      </Pressable>

      {lastReason && (
        <View style={styles.reason}>
          <Text style={styles.reasonHead}>왜 이렇게 만들어졌나요</Text>
          <Text style={styles.reasonBody}>{lastReason}</Text>
        </View>
      )}

      {/* TPO 시간 점프 — asset 전환 X, 시간만 변경. 작게 분리 표시. */}
      <View style={styles.tpoSection}>
        <Text style={styles.tpoHead}>TPO 점프 (시간만 이동, 챕터는 그대로)</Text>
        <View style={styles.chipRow}>
          {scenarios.map((s) => {
            const active = s.id === currentScenarioId;
            return (
              <Pressable
                key={s.id}
                onPress={() => setScenario(active ? null : s.id)}
                style={[styles.chip, active && styles.chipActive]}
                accessibilityRole="button"
                accessibilityLabel={s.label}
              >
                <Text
                  style={[styles.chipLabel, active && styles.chipLabelActive]}
                  numberOfLines={1}
                >
                  {s.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    </View>
  );
}

const PANEL_WIDTH = 320;
const PANEL_BOTTOM = 100;

const styles = StyleSheet.create({
  bubble: {
    position: 'absolute',
    right: 16,
    bottom: PANEL_BOTTOM,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(28,28,30,0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  bubbleLabel: { color: '#FFFFFF', fontSize: 18 },
  panel: {
    position: 'absolute',
    right: 16,
    bottom: PANEL_BOTTOM,
    width: PANEL_WIDTH,
    maxHeight: 560,
    borderRadius: 18,
    overflow: 'hidden',
    zIndex: 999,
    shadowColor: '#000',
    shadowOpacity: 0.36,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
    paddingBottom: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 8,
  },
  title: {
    ...typography.subhead,
    color: '#FFFFFF',
    fontWeight: '700',
    flex: 1,
  },
  headerBtn: {
    ...typography.headline,
    color: 'rgba(255,255,255,0.85)',
    paddingHorizontal: 6,
  },
  lead: {
    ...typography.headline,
    color: '#FFFFFF',
    fontWeight: '700',
    paddingHorizontal: 16,
    marginTop: 4,
  },
  sub: {
    ...typography.footnote,
    color: 'rgba(255,255,255,0.65)',
    paddingHorizontal: 16,
    marginTop: 4,
    marginBottom: 12,
  },
  input: {
    marginHorizontal: 16,
    minHeight: 60,
    maxHeight: 100,
    backgroundColor: 'rgba(255,255,255,0.10)',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: '#FFFFFF',
    ...typography.body,
  },
  cta: {
    marginHorizontal: 16,
    marginTop: 10,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaLabel: {
    ...typography.subhead,
    color: '#1C1C1E',
    fontWeight: '700',
  },
  reason: {
    marginHorizontal: 16,
    marginTop: 12,
    padding: 10,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  reasonHead: {
    ...typography.caption2,
    color: 'rgba(255,255,255,0.55)',
    fontWeight: '600',
    marginBottom: 2,
  },
  reasonBody: {
    ...typography.caption1,
    color: 'rgba(255,255,255,0.85)',
    lineHeight: 16,
  },
  tpoSection: {
    marginTop: 14,
    paddingTop: 12,
    paddingHorizontal: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255,255,255,0.12)',
  },
  tpoHead: {
    ...typography.caption2,
    color: 'rgba(255,255,255,0.45)',
    fontWeight: '600',
    marginBottom: 8,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  chipActive: {
    backgroundColor: 'rgba(255,255,255,0.95)',
  },
  chipLabel: {
    ...typography.caption1,
    color: 'rgba(255,255,255,0.85)',
  },
  chipLabelActive: {
    color: '#1C1C1E',
    fontWeight: '600',
  },
});
