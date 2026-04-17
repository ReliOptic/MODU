// ShareTab — cancer_caregiver sharing settings + active shares
import React from 'react';
import { ScrollView, View, Text, Pressable, StyleSheet } from 'react-native';
import type { Asset } from '../../types';
import { typography, getPalette } from '../../theme';
import { StepMoment } from '../../components/widgets';
import type { StepItem } from '../../components/widgets/atomic/StepMoment';

export interface ShareTabProps {
  asset: Asset;
}

const CONTENT_STYLE = {
  paddingHorizontal: 16,
  paddingBottom: 120,
  paddingTop: 4,
} as const;

const SHARE_STEPS: StepItem[] = [
  { id: 'email', label: '이메일로 초대', status: 'upcoming' },
  { id: 'pdf', label: 'PDF 요약 보내기', status: 'upcoming' },
  { id: 'auto', label: '매일 1줄 요약 자동 전송', status: 'upcoming' },
];

const ACTIVE_SHARES = [
  { id: 'husband', name: '남편', since: '지난 달부터' },
  { id: 'doctor', name: '담당 의사', since: '지난 방문 후' },
];

export function ShareTab({ asset }: ShareTabProps) {
  const palette = getPalette(asset.palette);

  return (
    <ScrollView contentContainerStyle={CONTENT_STYLE}>
      <Text style={[styles.heading, { color: palette[500] }]}>공유</Text>

      <View style={[styles.infoCard, { backgroundColor: palette[50] }]}>
        <Text style={[styles.infoText, { color: palette[800] }]}>
          가까운 사람과 이 기록을 공유할 수 있어요.
        </Text>
      </View>

      <StepMoment
        palette={asset.palette}
        title="공유 설정"
        steps={SHARE_STEPS}
      />

      <Text style={[styles.sectionTitle, { color: palette[700] }]}>이미 공유 중</Text>

      {ACTIVE_SHARES.map((share) => (
        <View
          key={share.id}
          style={[
            styles.shareRow,
            {
              backgroundColor: palette[50],
              borderLeftColor: palette[500],
            },
          ]}
        >
          <View style={styles.shareInfo}>
            <Text style={[styles.shareName, { color: palette[800] }]}>{share.name}</Text>
            <Text style={[styles.shareSince, { color: palette[400] }]}>{share.since}</Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`${share.name} 공유 취소`}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            style={({ pressed }) => [styles.cancelBtn, pressed && { opacity: 0.6 }]}
          >
            <Text style={[styles.cancelText, { color: palette[500] }]}>취소</Text>
          </Pressable>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  heading: {
    ...typography.displayLarge,
    marginBottom: 16,
  },
  infoCard: {
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
  },
  infoText: {
    ...typography.body,
    lineHeight: 24,
  },
  sectionTitle: {
    ...typography.headline,
    marginTop: 8,
    marginBottom: 10,
  },
  shareRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 10,
    borderLeftWidth: 3,
    paddingVertical: 14,
    paddingHorizontal: 14,
    marginBottom: 10,
    minHeight: 56,
  },
  shareInfo: {
    flex: 1,
  },
  shareName: {
    ...typography.headline,
  },
  shareSince: {
    ...typography.footnote,
    marginTop: 2,
  },
  cancelBtn: {
    paddingLeft: 16,
    minWidth: 44,
    minHeight: 44,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  cancelText: {
    ...typography.subhead,
    fontWeight: '500',
  },
});
