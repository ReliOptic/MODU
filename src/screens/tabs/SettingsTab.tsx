// SettingsTab — pet_care + chronic 에셋 공용 '설정' 탭. 실동작 기능만 남김.
import React, { useState } from 'react';
import { ScrollView, View, Text, Pressable, Switch, Alert, StyleSheet, Platform } from 'react-native';
import type { Asset } from '../../types';
import { typography, getPalette, widgetTokens } from '../../theme';
import { useAssetStore } from '../../store/assetStore';
import { exportToJson } from '../../lib/export';

export interface SettingsTabProps {
  asset: Asset;
}

const CONTENT_STYLE = { paddingHorizontal: 16, paddingBottom: 120, paddingTop: 4 } as const;
const DANGER = '#C14B73';

interface RowDef {
  label: string;
  subtitle?: string;
  danger?: boolean;
  chevron?: boolean;
  onPress?: () => void;
  toggle?: { value: boolean; onChange: (v: boolean) => void };
}

async function runExport(): Promise<void> {
  try {
    const result = await exportToJson();
    if (Platform.OS === 'web') {
      Alert.alert('내보내기 완료', `${Math.round(result.size / 1024)} KB 저장됨.`);
      return;
    }
    Alert.alert('내보내기 완료', `파일 위치:\n${result.uri}`);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    Alert.alert('내보내기 실패', msg);
  }
}

export function SettingsTab({ asset }: SettingsTabProps) {
  const palette = getPalette(asset.palette);
  const [largeFont, setLargeFont] = useState(false);

  function archiveChapter(): void {
    void useAssetStore.getState().archiveAsset(asset.id);
  }

  const sections: Array<{ title: string; rows: RowDef[] }> = [
    {
      title: '내 데이터',
      rows: [
        {
          label: '내보내기 (JSON)',
          subtitle: '기록·이벤트·감정 저널 전체가 이 기기로 저장돼요.',
          chevron: true,
          onPress: () => void runExport(),
        },
      ],
    },
    {
      title: '접근성',
      rows: [{ label: '글자 크게', toggle: { value: largeFont, onChange: setLargeFont } }],
    },
    {
      title: '챕터',
      rows: [
        {
          label: '챕터 마무리',
          subtitle: '기록은 영구 보존돼요. 더 이상 홈에 보이지 않아요.',
          danger: true,
          onPress: () =>
            Alert.alert(`'${asset.displayName}' 마무리`, '이 챕터를 마무리할까요? 기록은 그대로 남아요.', [
              { text: '취소', style: 'cancel' },
              { text: '마무리', style: 'destructive', onPress: archiveChapter },
            ]),
        },
      ],
    },
    {
      title: '앱 정보',
      rows: [{ label: '버전', subtitle: '1.0.0-mvp' }],
    },
  ];

  return (
    <ScrollView contentContainerStyle={CONTENT_STYLE}>
      <Text style={[styles.heading, { color: palette[500] }]}>설정</Text>
      {sections.map((sec) => (
        <View key={sec.title}>
          <Text style={[styles.secLabel, { color: palette[400] }]}>{sec.title}</Text>
          <View style={[styles.card, { backgroundColor: palette[50] }]}>
            {sec.rows.map((row, idx) => (
              <View key={row.label}>
                <Pressable
                  onPress={row.onPress}
                  disabled={!row.onPress && !row.toggle}
                  accessibilityRole="button"
                  accessibilityLabel={row.label}
                  hitSlop={{ top: 4, bottom: 4, left: 0, right: 0 }}
                  style={({ pressed }) => [styles.row, pressed && row.onPress ? { opacity: 0.7 } : undefined]}
                >
                  <View style={styles.rowLeft}>
                    <Text style={[styles.rowLabel, row.danger ? { color: DANGER } : { color: widgetTokens.textPrimary }]}>
                      {row.label}
                    </Text>
                    {row.subtitle ? <Text style={[styles.rowSub, { color: palette[400] }]}>{row.subtitle}</Text> : null}
                  </View>
                  {row.toggle ? (
                    <Switch
                      value={row.toggle.value}
                      onValueChange={row.toggle.onChange}
                      trackColor={{ true: palette[400], false: palette[100] }}
                    />
                  ) : row.chevron ? (
                    <Text style={[styles.chevron, { color: palette[300] }]}>›</Text>
                  ) : null}
                </Pressable>
                {idx < sec.rows.length - 1 && <View style={styles.divider} />}
              </View>
            ))}
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  heading: { ...typography.displayLarge, marginBottom: 20 },
  secLabel: { ...typography.footnote, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6, marginTop: 20, marginLeft: 4 },
  card: { borderRadius: 12, overflow: 'hidden' },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: 'rgba(60,60,67,0.15)', marginLeft: 16 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 56, paddingHorizontal: 16, paddingVertical: 10 },
  rowLeft: { flex: 1, marginRight: 8 },
  rowLabel: { ...typography.body },
  rowSub: { ...typography.footnote, marginTop: 2, lineHeight: 16 },
  chevron: { fontSize: 22, lineHeight: 26 },
});
