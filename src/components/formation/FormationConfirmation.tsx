// 최종 확인 화면 — 에셋 생성 직전 미리보기
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { AssetType } from '../../types';
import { assetTemplates } from '../../data/assetTemplates';
import { PrimaryCard, Card } from '../ui';
import { typography, widgetTokens } from '../../theme';

export interface FormationConfirmationProps {
  type: AssetType;
}

export function FormationConfirmation({ type }: FormationConfirmationProps) {
  const t = assetTemplates[type];
  return (
    <View style={styles.wrap}>
      <PrimaryCard palette={t.palette}>
        <Text style={styles.primaryTitle}>{t.defaultDisplayName}</Text>
        <Text style={styles.primarySub}>{LABELS[type]}</Text>
      </PrimaryCard>
      <Card style={styles.detail}>
        <Text style={styles.h}>구성될 탭</Text>
        <Text style={styles.body}>{t.tabs.map((tab) => tab.label).join('  ·  ')}</Text>
        <Text style={[styles.h, { marginTop: 12 }]}>홈 위젯</Text>
        <Text style={styles.body}>
          {t.widgets.filter((w) => (w.tab ?? 'home') === 'home').length}개 위젯이 우선순위에 따라 정렬돼요.
        </Text>
      </Card>
    </View>
  );
}

const LABELS: Record<AssetType, string> = {
  fertility: '난임 동반자 에셋',
  cancer_caregiver: '항암 보호자 에셋',
  pet_care: '반려동물 돌봄 에셋',
  chronic: '만성질환 관리 에셋',
  custom: '맞춤 에셋',
};

const styles = StyleSheet.create({
  wrap: { gap: 12, marginBottom: 12 },
  primaryTitle: { ...typography.title1, color: '#FFFFFF' },
  primarySub: { ...typography.subhead, color: 'rgba(255,255,255,0.85)', marginTop: 4 },
  detail: { },
  h: { ...typography.headline, color: widgetTokens.textPrimary },
  body: { ...typography.subhead, color: widgetTokens.textSecondary, marginTop: 4 },
});
