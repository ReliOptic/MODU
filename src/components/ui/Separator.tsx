// iOS 스타일 0.5px separator (§7.3)
import React from 'react';
import { View, StyleSheet, ViewProps } from 'react-native';
import { widgetTokens } from '../../theme';

export interface SeparatorProps extends ViewProps {
  /** 좌우 inset (iOS list separator 와 동일하게) */
  inset?: number;
}

export function Separator({ inset = 0, style, ...rest }: SeparatorProps) {
  return <View style={[styles.line, { marginLeft: inset }, style]} {...rest} />;
}

const styles = StyleSheet.create({
  line: {
    height: widgetTokens.separator.height,
    backgroundColor: widgetTokens.separator.color,
    width: '100%',
  },
});
