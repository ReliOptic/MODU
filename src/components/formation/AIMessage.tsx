// AI 메시지 버블 — 좌측 정렬, 부드러운 톤. 진입 시 fade+slide.
import React from 'react';
import { Text, StyleSheet } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { typography, widgetTokens } from '../../theme';

export interface AIMessageProps {
  text: string;
}

export function AIMessage({ text }: AIMessageProps) {
  return (
    <Animated.View entering={FadeInUp.duration(260).springify().damping(16)} style={styles.row}>
      <Animated.View style={styles.bubble}>
        <Text style={styles.text}>{text}</Text>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  row: {
    alignItems: 'flex-start',
    marginBottom: 12,
    maxWidth: '85%',
  },
  bubble: {
    backgroundColor: 'rgba(255,255,255,0.78)',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 0.5,
    borderColor: 'rgba(60,60,67,0.06)',
  },
  text: {
    ...typography.body,
    color: widgetTokens.textPrimary,
  },
});
