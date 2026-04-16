// 재사용 사진 입력 컴포넌트 — 원형/사각 슬롯 + 변경/삭제 버튼
// 에셋 프로필, 반려동물 사진, 진료 메모 첨부 등에서 사용.
import React from 'react';
import { View, Text, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { Image } from 'expo-image';
import { useImagePicker, PickedImage, UseImagePickerOptions } from '../../hooks/useImagePicker';
import { typography, widgetTokens, getPalette, PaletteKey } from '../../theme';

export interface PhotoPickerProps {
  palette: PaletteKey;
  /** 초기 이미지 URI (서버에서 받은 사진) */
  initialUri?: string;
  /** 결과 콜백 — null = 삭제 */
  onChange: (image: PickedImage | null) => void;
  /** 'circle' (둥근 아바타) | 'square' (사각 카드) */
  shape?: 'circle' | 'square';
  /** 픽셀 크기. circle 은 정사각형. square 도 width=height. */
  size?: number;
  pickerOptions?: UseImagePickerOptions;
  /** 빈 상태 라벨 (e.g. "보리 사진 추가") */
  placeholder?: string;
}

export function PhotoPicker({
  palette,
  initialUri,
  onChange,
  shape = 'circle',
  size = 96,
  pickerOptions,
  placeholder = '사진 추가',
}: PhotoPickerProps) {
  const { image, pickAny, clear, loading } = useImagePicker(pickerOptions);
  const p = getPalette(palette);
  const uri = image?.uri ?? initialUri;
  const radius = shape === 'circle' ? size / 2 : 14;

  const handlePress = async () => {
    const r = await pickAny();
    if (r) onChange(r);
  };

  const handleClear = () => {
    clear();
    onChange(null);
  };

  return (
    <View style={styles.wrap}>
      <Pressable
        onPress={handlePress}
        accessibilityRole="button"
        accessibilityLabel={uri ? '사진 변경' : placeholder}
        style={({ pressed }) => [
          styles.slot,
          { width: size, height: size, borderRadius: radius, borderColor: p[200] },
          pressed && { opacity: 0.85 },
        ]}
      >
        {uri ? (
          <Image source={{ uri }} style={[styles.image, { borderRadius: radius }]} contentFit="cover" />
        ) : (
          <View style={styles.empty}>
            <Text style={[styles.plus, { color: p[500] }]}>＋</Text>
            <Text style={[styles.label, { color: p[500] }]}>{placeholder}</Text>
          </View>
        )}
        {loading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator color="#FFFFFF" />
          </View>
        )}
      </Pressable>
      {uri && (
        <Pressable onPress={handleClear} style={styles.removeBtn} accessibilityLabel="사진 삭제">
          <Text style={styles.removeLabel}>삭제</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    gap: 6,
  },
  slot: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
    backgroundColor: 'rgba(255,255,255,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  plus: {
    ...typography.title1,
  },
  label: {
    ...typography.caption1,
    fontWeight: '500',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.32)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  removeLabel: {
    ...typography.caption1,
    color: widgetTokens.textTertiary,
    textDecorationLine: 'underline',
  },
});
