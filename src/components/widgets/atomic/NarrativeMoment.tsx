import React from 'react';
import { View, Text, StyleSheet, Image, Pressable } from 'react-native';
import { typography, getPalette, PaletteKey } from '../../../theme';

export interface NarrativeMomentProps {
  palette: PaletteKey;
  title?: string;
  content: string;
  photoUri?: string;
  timestamp?: string;
  onPress?: () => void;
}

/**
 * NarrativeMoment: 텍스트와 사진 기록을 위한 범용 모먼트.
 * 일기, 기록, 메모, 사건 보고 등 서사적 데이터에 대응.
 */
export const NarrativeMoment: React.FC<NarrativeMomentProps> = ({
  palette: paletteKey,
  title,
  content,
  photoUri,
  timestamp,
  onPress,
}) => {
  const palette = getPalette(paletteKey);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.container,
        { backgroundColor: '#FFFFFF', borderLeftWidth: 4, borderLeftColor: palette.accent },
        pressed && { opacity: 0.9 },
      ]}
    >
      {photoUri && (
        <Image source={{ uri: photoUri }} style={styles.photo} resizeMode="cover" />
      )}
      
      <View style={styles.textContainer}>
        {title && (
          <Text style={[styles.title, { color: palette[800] }]}>{title}</Text>
        )}
        <Text style={[styles.content, { color: palette[900] }]} numberOfLines={3}>
          {content}
        </Text>
        {timestamp && (
          <Text style={[styles.timestamp, { color: palette[400] }]}>{timestamp}</Text>
        )}
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 12,
    flexDirection: 'row',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  photo: {
    width: 100,
    height: '100%',
    minHeight: 100,
  },
  textContainer: {
    flex: 1,
    padding: 16,
    justifyContent: 'center',
  },
  title: {
    ...typography.labelMedium,
    fontWeight: '700',
    marginBottom: 4,
  },
  content: {
    ...typography.bodyMedium,
    lineHeight: 20,
    marginBottom: 8,
  },
  timestamp: {
    ...typography.bodySmall,
    fontStyle: 'italic',
  },
});
