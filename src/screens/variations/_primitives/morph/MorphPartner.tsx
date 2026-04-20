// Morph mood — partner pill. Gradient fill, pill shape (borderRadius 100).
// Role-aware display name (self / partner / parent).
import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import type { PaletteSwatch } from '../../../../theme';
import type { ResolvedTPO } from '../../../../adapters';
import { s } from '../../../../theme';

export interface MorphPartnerProps {
  readonly palette: PaletteSwatch;
  readonly tpo: ResolvedTPO;
  readonly reduceMotion: boolean;
}

function resolvePartnerDisplay(role: ResolvedTPO['role']): { name: string; msg: string } {
  if (role === 'partner') {
    return { name: '당신 + 소영', msg: '내일 일찍 같이 나갈게.' };
  }
  if (role === 'parent') {
    return { name: '어머니', msg: '끝나면 전화 줘.' };
  }
  if (role === 'guardian') {
    return { name: '김지윤 · 보호자', msg: '내일 일찍 같이 나갈게.' };
  }
  return { name: '김지윤 · 파트너', msg: '내일 일찍 같이 나갈게.' };
}

export function MorphPartner({
  palette,
  tpo,
  reduceMotion,
}: MorphPartnerProps): React.JSX.Element {
  const entering = reduceMotion ? undefined : FadeIn.delay(100).duration(380);
  const { name, msg } = resolvePartnerDisplay(tpo.role);
  const initial = name.length > 0 ? name[0] : '?';

  return (
    <Animated.View entering={entering} style={styles.outer}>
      <View
        style={[
          StyleSheet.absoluteFillObject,
          styles.clip,
        ]}
      >
        <LinearGradient
          colors={[palette.heroGradient.top, palette.heroGradient.mid, palette.heroGradient.bottom]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={StyleSheet.absoluteFillObject}
        />
      </View>
      <Pressable
        accessibilityLabel={`파트너: ${name}`}
        accessibilityHint="파트너 정보를 봅니다"
        style={({ pressed }) => [styles.row, { opacity: pressed ? 0.88 : 1 }]}
      >
        {/* Avatar circle */}
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initial}</Text>
        </View>
        {/* Name + message */}
        <View style={styles.textBlock}>
          <Text style={styles.name}>{name}</Text>
          <Text style={styles.message}>"{msg}"</Text>
        </View>
        {/* Time-since badge */}
        <Text style={styles.badge}>3M</Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  outer: {
    marginHorizontal: s.lg,
    borderRadius: 100,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  clip: {
    borderRadius: 100,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 12,
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontFamily: 'Fraunces_400Regular',
    fontSize: 16,
    color: '#FFFFFF',
  },
  textBlock: { flex: 1, gap: 1 },
  name: {
    fontFamily: 'Pretendard_400Regular',
    fontSize: 12,
    color: 'rgba(255,255,255,0.88)',
  },
  message: {
    fontFamily: 'Fraunces_400Regular',
    fontSize: 15,
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  badge: {
    fontFamily: 'JetBrainsMono_400Regular',
    fontSize: 10,
    letterSpacing: 1.5,
    color: 'rgba(255,255,255,0.8)',
  },
});
