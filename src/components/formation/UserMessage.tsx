// 사용자 메시지 버블 — 우측 정렬, palette accent 톤
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { typography, getPalette, PaletteKey } from '../../theme';

export interface UserMessageProps {
  text: string;
  /** 현재 진행 중인 에셋 타입의 팔레트 (없으면 기본 dawn) */
  palette?: PaletteKey;
}

export function UserMessage({ text, palette = 'dawn' }: UserMessageProps) {
  const p = getPalette(palette);
  return (
    <View style={styles.row}>
      <View style={[styles.bubble, { backgroundColor: p[100] }]}>
        <Text style={[styles.text, { color: p[500] }]}>{text}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    alignSelf: 'flex-end',
    marginBottom: 12,
    maxWidth: '85%',
  },
  bubble: {
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  text: {
    ...typography.body,
    fontWeight: '500',
  },
});
