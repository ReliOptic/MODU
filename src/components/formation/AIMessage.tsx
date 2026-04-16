// AI 메시지 버블 — 좌측 정렬, 부드러운 톤
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { typography, widgetTokens } from '../../theme';

export interface AIMessageProps {
  text: string;
}

export function AIMessage({ text }: AIMessageProps) {
  return (
    <View style={styles.row}>
      <View style={styles.bubble}>
        <Text style={styles.text}>{text}</Text>
      </View>
    </View>
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
