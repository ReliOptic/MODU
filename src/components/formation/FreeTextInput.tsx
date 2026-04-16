// "기타 · 직접 입력" 영역 — preset 아래 또는 free 단독으로 사용
// label 위에 작은 구분 라벨 (e.g. "기타") 표시.
import React, { useState } from 'react';
import { View, TextInput, Pressable, Text, StyleSheet } from 'react-native';
import { typography, getPalette, PaletteKey, widgetTokens } from '../../theme';

export interface FreeTextInputProps {
  onSend: (text: string) => void;
  palette?: PaletteKey;
  placeholder?: string;
  disabled?: boolean;
  /** 위쪽에 작은 섹션 라벨 (default "기타 · 직접 입력") */
  sectionLabel?: string | null;
}

export function FreeTextInput({
  onSend,
  palette = 'dawn',
  placeholder = '직접 입력',
  disabled,
  sectionLabel = '기타 · 직접 입력',
}: FreeTextInputProps) {
  const [text, setText] = useState('');
  const p = getPalette(palette);

  const submit = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    onSend(trimmed);
    setText('');
  };

  return (
    <View>
      {sectionLabel && <Text style={styles.section}>{sectionLabel}</Text>}
      <View style={styles.row}>
        <TextInput
          value={text}
          onChangeText={setText}
          placeholder={placeholder}
          placeholderTextColor={widgetTokens.textTertiary}
          editable={!disabled}
          onSubmitEditing={submit}
          returnKeyType="send"
          style={styles.input}
        />
        <Pressable
          onPress={submit}
          disabled={disabled || !text.trim()}
          style={({ pressed }) => [
            styles.send,
            { backgroundColor: text.trim() ? p[500] : 'rgba(60,60,67,0.12)' },
            pressed && { opacity: 0.85 },
          ]}
          accessibilityRole="button"
          accessibilityLabel="전송"
        >
          <Text style={styles.sendLabel}>전송</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    ...typography.caption1,
    color: widgetTokens.textTertiary,
    fontWeight: '600',
    marginBottom: 6,
    paddingHorizontal: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  input: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.78)',
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 12,
    ...typography.body,
    color: widgetTokens.textPrimary,
    borderWidth: 0.5,
    borderColor: 'rgba(60,60,67,0.06)',
  },
  send: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 22,
  },
  sendLabel: {
    ...typography.subhead,
    color: '#FFFFFF',
    fontWeight: '600',
  },
});
