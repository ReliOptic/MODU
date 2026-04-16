// 사진 선택/촬영 훅 — expo-image-picker + expo-camera 위 얇은 래퍼
// "에셋 사진" 같은 단일 이미지 케이스를 단순화. 다중 선택은 옵션.
import { useCallback, useState } from 'react';
import { Alert, Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';

export interface PickedImage {
  uri: string;
  width: number;
  height: number;
  fileName?: string;
  mimeType?: string;
}

export interface UseImagePickerOptions {
  /** 결과 사진의 가로 비율 — 'square' = 1:1 */
  aspect?: 'square' | 'free' | [number, number];
  /** 압축 품질 0~1. 기본 0.8 */
  quality?: number;
  /** 편집(crop) 허용 */
  allowsEditing?: boolean;
}

export interface UseImagePickerResult {
  /** 마지막으로 선택된 이미지 (없으면 null) */
  image: PickedImage | null;
  /** 갤러리에서 사진 선택 */
  pickFromLibrary: () => Promise<PickedImage | null>;
  /** 카메라로 촬영 */
  takePhoto: () => Promise<PickedImage | null>;
  /** 사용자에게 갤러리/촬영 중 선택 (네이티브 ActionSheet 대체 — 단순 Alert 분기) */
  pickAny: () => Promise<PickedImage | null>;
  /** 현재 이미지 제거 */
  clear: () => void;
  /** 동작 중 여부 */
  loading: boolean;
}

const ASPECT_SQUARE: [number, number] = [1, 1];

export function useImagePicker(opts: UseImagePickerOptions = {}): UseImagePickerResult {
  const [image, setImage] = useState<PickedImage | null>(null);
  const [loading, setLoading] = useState(false);

  const aspect = useResolveAspect(opts.aspect);
  const quality = opts.quality ?? 0.8;
  const allowsEditing = opts.allowsEditing ?? true;

  const pickFromLibrary = useCallback(async () => {
    setLoading(true);
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        Alert.alert('사진 접근 권한 필요', '설정에서 사진 접근을 허용해주세요.');
        return null;
      }
      const r = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing,
        aspect,
        quality,
      });
      if (r.canceled) return null;
      const a = r.assets[0];
      const picked: PickedImage = {
        uri: a.uri,
        width: a.width,
        height: a.height,
        fileName: a.fileName ?? undefined,
        mimeType: a.mimeType ?? undefined,
      };
      setImage(picked);
      return picked;
    } finally {
      setLoading(false);
    }
  }, [aspect, quality, allowsEditing]);

  const takePhoto = useCallback(async () => {
    setLoading(true);
    try {
      if (Platform.OS === 'web') {
        // 웹은 launchCameraAsync 미지원 → 갤러리 fallback
        return pickFromLibrary();
      }
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (!perm.granted) {
        Alert.alert('카메라 권한 필요', '설정에서 카메라 접근을 허용해주세요.');
        return null;
      }
      const r = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing,
        aspect,
        quality,
      });
      if (r.canceled) return null;
      const a = r.assets[0];
      const picked: PickedImage = {
        uri: a.uri,
        width: a.width,
        height: a.height,
        fileName: a.fileName ?? undefined,
        mimeType: a.mimeType ?? undefined,
      };
      setImage(picked);
      return picked;
    } finally {
      setLoading(false);
    }
  }, [aspect, quality, allowsEditing, pickFromLibrary]);

  const pickAny = useCallback(async () => {
    if (Platform.OS === 'web') return pickFromLibrary();
    return new Promise<PickedImage | null>((resolve) => {
      Alert.alert('사진 추가', undefined, [
        { text: '카메라로 촬영', onPress: () => takePhoto().then(resolve) },
        { text: '갤러리에서 선택', onPress: () => pickFromLibrary().then(resolve) },
        { text: '취소', style: 'cancel', onPress: () => resolve(null) },
      ]);
    });
  }, [pickFromLibrary, takePhoto]);

  const clear = useCallback(() => setImage(null), []);

  return { image, pickFromLibrary, takePhoto, pickAny, clear, loading };
}

function useResolveAspect(input?: UseImagePickerOptions['aspect']): [number, number] | undefined {
  if (input === 'square') return ASPECT_SQUARE;
  if (input === 'free') return undefined;
  if (Array.isArray(input)) return input;
  return ASPECT_SQUARE;
}
