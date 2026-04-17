// MoodTab — real journaling surface. Persistent entries per asset.
// Tone swatch + text input + timeline. Long-press entry to delete.
import React, { useCallback, useEffect, useState } from 'react';
import {
  ScrollView,
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  Alert,
  Platform,
} from 'react-native';
import Animated, { FadeIn, Layout } from 'react-native-reanimated';
import type { Asset } from '../../types';
import { typography, getPalette, widgetTokens } from '../../theme';
import {
  useMoodJournalStore,
  type MoodTone,
  type MoodEntry,
} from '../../store/moodJournalStore';

export interface MoodTabProps {
  asset: Asset;
}

interface ToneDef {
  id: MoodTone;
  emoji: string;
  label: string;
}

const TONES: ToneDef[] = [
  { id: 'calm', emoji: '🌿', label: '평온' },
  { id: 'hopeful', emoji: '🌱', label: '기대' },
  { id: 'grateful', emoji: '☀️', label: '감사' },
  { id: 'tired', emoji: '😮‍💨', label: '지침' },
  { id: 'down', emoji: '🌧', label: '울적' },
  { id: 'turbulent', emoji: '🌊', label: '요동' },
];

const CONTENT_STYLE = { paddingHorizontal: 16, paddingBottom: 140, paddingTop: 4 } as const;

function toneLabel(tone: MoodTone): string {
  return TONES.find((t) => t.id === tone)?.label ?? tone;
}
function toneEmoji(tone: MoodTone): string {
  return TONES.find((t) => t.id === tone)?.emoji ?? '•';
}
function formatEntryTime(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  const hhmm = d.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
  if (sameDay) return `오늘 ${hhmm}`;
  return `${d.getMonth() + 1}/${d.getDate()} ${hhmm}`;
}

export function MoodTab({ asset }: MoodTabProps) {
  const palette = getPalette(asset.palette);
  const entries = useMoodJournalStore((s) => s.entriesByAsset[asset.id] ?? []);
  const hydrate = useMoodJournalStore((s) => s.hydrate);
  const add = useMoodJournalStore((s) => s.add);
  const remove = useMoodJournalStore((s) => s.remove);

  const [tone, setTone] = useState<MoodTone | null>(null);
  const [text, setText] = useState('');

  useEffect(() => {
    void hydrate(asset.id);
  }, [asset.id, hydrate]);

  const handleSave = useCallback(async () => {
    if (!tone) return;
    await add(asset.id, tone, text.trim());
    setText('');
    setTone(null);
  }, [tone, text, asset.id, add]);

  const handleRemove = useCallback(
    (entry: MoodEntry) => {
      const doRemove = () => void remove(asset.id, entry.id);
      if (Platform.OS === 'web') {
        doRemove();
        return;
      }
      Alert.alert('이 기록을 지울까요?', `${toneLabel(entry.tone)} · ${formatEntryTime(entry.createdAt)}`, [
        { text: '취소', style: 'cancel' },
        { text: '지우기', style: 'destructive', onPress: doRemove },
      ]);
    },
    [asset.id, remove]
  );

  return (
    <ScrollView
      contentContainerStyle={CONTENT_STYLE}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={[styles.heading, { color: palette[500] }]}>감정 저널</Text>
      <Text style={[styles.sub, { color: palette[400] }]}>
        고르고, 한 줄 적어두면 나중에 흐름이 읽혀요.
      </Text>

      <View style={styles.toneGrid}>
        {TONES.map((t) => {
          const active = tone === t.id;
          return (
            <Pressable
              key={t.id}
              onPress={() => setTone(active ? null : t.id)}
              accessibilityRole="button"
              accessibilityLabel={`${t.label} 선택`}
              accessibilityState={{ selected: active }}
              hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
              style={({ pressed }) => [
                styles.toneCell,
                { backgroundColor: active ? palette[200] : palette[50], borderColor: active ? palette[400] : 'transparent' },
                pressed && { opacity: 0.8, transform: [{ scale: 0.97 }] },
              ]}
            >
              <Text style={styles.toneEmoji}>{t.emoji}</Text>
              <Text style={[styles.toneLabel, { color: active ? palette[800] : palette[600] }]}>
                {t.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <TextInput
        value={text}
        onChangeText={setText}
        multiline
        placeholder={tone ? '지금 느낌을 한 줄로…' : '먼저 톤을 골라주세요'}
        placeholderTextColor={palette[300]}
        editable={tone !== null}
        style={[
          styles.input,
          { backgroundColor: palette[50], color: widgetTokens.textPrimary, borderColor: palette[100] },
        ]}
      />

      <Pressable
        onPress={handleSave}
        disabled={!tone}
        accessibilityRole="button"
        accessibilityLabel="저장"
        style={({ pressed }) => [
          styles.saveBtn,
          { backgroundColor: tone ? palette[500] : palette[200] },
          pressed && tone ? { opacity: 0.85 } : undefined,
        ]}
      >
        <Text style={styles.saveLabel}>{tone ? '기록하기' : '톤을 골라주세요'}</Text>
      </Pressable>

      <Text style={[styles.section, { color: palette[700] }]}>
        기록 {entries.length > 0 ? `· ${entries.length}` : ''}
      </Text>

      {entries.length === 0 ? (
        <View style={[styles.emptyCard, { backgroundColor: palette[50], borderColor: palette[100] }]}>
          <Text style={[styles.emptyTitle, { color: palette[700] }]}>아직 비어있어요.</Text>
          <Text style={[styles.emptyBody, { color: palette[500] }]}>
            첫 기록은 한 줄이면 충분해요. 나중에 돌아보면 결이 보입니다.
          </Text>
        </View>
      ) : (
        entries.map((e) => (
          <Animated.View
            key={e.id}
            entering={FadeIn.duration(220)}
            layout={Layout.springify()}
          >
            <Pressable
              onLongPress={() => handleRemove(e)}
              delayLongPress={400}
              accessibilityRole="button"
              accessibilityLabel={`${toneLabel(e.tone)} 기록. 길게 눌러 삭제`}
              style={({ pressed }) => [
                styles.entry,
                { backgroundColor: palette[50], borderColor: palette[100] },
                pressed && { opacity: 0.85 },
              ]}
            >
              <View style={styles.entryHead}>
                <Text style={styles.entryEmoji}>{toneEmoji(e.tone)}</Text>
                <View style={styles.entryMeta}>
                  <Text style={[styles.entryTone, { color: palette[800] }]}>{toneLabel(e.tone)}</Text>
                  <Text style={[styles.entryTime, { color: palette[400] }]}>
                    {formatEntryTime(e.createdAt)}
                  </Text>
                </View>
              </View>
              {e.text.length > 0 ? (
                <Text style={[styles.entryText, { color: widgetTokens.textPrimary }]}>{e.text}</Text>
              ) : null}
            </Pressable>
          </Animated.View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  heading: { ...typography.displayLarge, marginBottom: 6 },
  sub: { ...typography.subhead, marginBottom: 20 },
  toneGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
  },
  toneCell: {
    width: '31%',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1.5,
  },
  toneEmoji: { fontSize: 26, marginBottom: 4 },
  toneLabel: { ...typography.footnote, fontWeight: '600' },
  input: {
    minHeight: 84,
    borderRadius: 14,
    padding: 14,
    ...typography.body,
    borderWidth: 1,
    textAlignVertical: 'top',
    marginBottom: 10,
  },
  saveBtn: {
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  saveLabel: { ...typography.headline, color: '#FFFFFF', fontWeight: '700' },
  section: { ...typography.headline, marginBottom: 10 },
  emptyCard: { borderRadius: 14, padding: 18, borderWidth: 1, gap: 6 },
  emptyTitle: { ...typography.headline, fontWeight: '600' },
  emptyBody: { ...typography.footnote, lineHeight: 18 },
  entry: {
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    gap: 8,
  },
  entryHead: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  entryEmoji: { fontSize: 22 },
  entryMeta: { flex: 1 },
  entryTone: { ...typography.subhead, fontWeight: '600' },
  entryTime: { ...typography.caption1, marginTop: 1 },
  entryText: { ...typography.body, lineHeight: 22 },
});
