// 사용자 메시지 버블 — 우측 정렬, palette accent 톤. 진입 시 fade+slide.
import React from 'react';
import { Text, StyleSheet } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { typography, getPalette, PaletteKey } from '../../theme';

export interface UserMessageProps {
  text: string;
  /** 현재 진행 중인 에셋 타입의 팔레트 (없으면 기본 dawn) */
  palette?: PaletteKey;
}

export function UserMessage({ text, palette = 'dawn' }: UserMessageProps) {
  const p = getPalette(palette);
  return (
    <Animated.View entering={FadeInUp.duration(220).springify().damping(18)} style={styles.row}>
      <Animated.View style={[styles.bubble, { backgroundColor: p[100] }]}>
        <Text style={[styles.text, { color: p[500] }]}>{text}</Text>
      </Animated.View>
    </Animated.View>
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
