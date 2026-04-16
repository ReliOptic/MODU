// 마이크 버튼 — STT placeholder (Expo Go 호환을 위해 실제 STT는 stub)
// 길게 누름 / 탭 → 시뮬레이션된 음성 텍스트 전달
import React, { useState } from 'react';
import { Pressable, Text, StyleSheet, Animated } from 'react-native';
import { typography, getPalette, PaletteKey } from '../../theme';

export interface VoiceInputButtonProps {
  onTranscribe: (text: string) => void;
  palette?: PaletteKey;
  disabled?: boolean;
}

/**
 * Phase 7 (Supabase + Whisper API) 전까지는 stub. 탭 시 placeholder 텍스트 전달.
 * UI는 실제 STT 가 들어와도 동일 — 디자인 검증 가능.
 */
export function VoiceInputButton({ onTranscribe, palette = 'dawn', disabled }: VoiceInputButtonProps) {
  const p = getPalette(palette);
  const [recording, setRecording] = useState(false);
  const pulse = React.useRef(new Animated.Value(1)).current;

  const toggle = () => {
    if (disabled) return;
    if (!recording) {
      setRecording(true);
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulse, { toValue: 1.18, duration: 600, useNativeDriver: true }),
          Animated.timing(pulse, { toValue: 1, duration: 600, useNativeDriver: true }),
        ])
      ).start();
      // 2초 후 자동 stop + 더미 텍스트 전달 (실제 STT 자리)
      setTimeout(() => {
        setRecording(false);
        pulse.stopAnimation(() => pulse.setValue(1));
        onTranscribe('(음성 입력 인식 결과)');
      }, 2000);
    } else {
      setRecording(false);
      pulse.stopAnimation(() => pulse.setValue(1));
    }
  };

  return (
    <Pressable
      onPress={toggle}
      accessibilityRole="button"
      accessibilityLabel={recording ? '음성 녹음 중' : '음성 입력 시작'}
      style={({ pressed }) => [styles.btn, pressed && { opacity: 0.85 }]}
    >
      <Animated.View style={[styles.dot, { backgroundColor: recording ? p[500] : p[300], transform: [{ scale: pulse }] }]} />
      <Text style={[styles.label, { color: p[500] }]}>{recording ? '듣고 있어요…' : '음성으로 답하기'}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.55)',
    marginBottom: 12,
    gap: 8,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  label: {
    ...typography.subhead,
    fontWeight: '500',
  },
});
