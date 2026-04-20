// Editorial primitive: EditorialPartner — role-driven partner card.
// Gradient card with avatar initial + heart icon. Role-branched message.
// Fix 7: shadow wrapper View (iOS bug: no shadow on LinearGradient directly).
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import type { PaletteSwatch } from '../../../../theme';
import type { ResolvedTPO } from '../../../../adapters';
import { s, r } from '../../../../theme';

export interface EditorialPartnerProps {
  readonly palette: PaletteSwatch;
  readonly tpo: ResolvedTPO;
}

function derivePartnerContent(
  role: string,
): { readonly label: string; readonly message: string; readonly initial: string } | null {
  switch (role) {
    case 'partner':
      return { label: '파트너', message: '"옆에 있을게."', initial: '파' };
    case 'guardian':
      return { label: '보호자', message: '"함께 있어요."', initial: '보' };
    case 'parent':
      return { label: '부모님', message: '"끝나면 전화 줘."', initial: '부' };
    default:
      return null;
  }
}

export function EditorialPartner({
  palette,
  tpo,
}: EditorialPartnerProps): React.JSX.Element | null {
  const content = derivePartnerContent(tpo.role);
  if (content === null) return null;

  return (
    <View style={styles.wrap}>
      {/* Fix 7: shadow on wrapper View, NOT directly on LinearGradient */}
      <View
        style={[
          styles.shadowWrap,
          {
            shadowColor: palette.accent,
            borderRadius: r.lg,
          },
        ]}
      >
        <LinearGradient
          colors={[
            palette.heroGradient.top,
            palette.heroGradient.mid,
            palette.heroGradient.bottom,
          ]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.card, { borderRadius: r.lg }]}
        >
          <View style={styles.inner}>
            {/* Avatar circle */}
            <View style={styles.avatar}>
              <Text style={styles.avatarInitial}>{content.initial}</Text>
            </View>

            {/* Text */}
            <View style={styles.textCol}>
              <Text style={styles.roleLabel}>{content.label.toUpperCase()}</Text>
              <Text style={styles.message}>{content.message}</Text>
            </View>

            {/* Heart icon */}
            <Ionicons name="heart" size={20} color="rgba(255,255,255,0.9)" />
          </View>
        </LinearGradient>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginHorizontal: s.lg,
    marginBottom: s.xl,
  },
  // Fix 7: shadow wrapper
  shadowWrap: {
    shadowOpacity: 0.20,
    shadowRadius: 40,
    shadowOffset: { width: 0, height: 20 },
    elevation: 8,
  },
  card: {
    overflow: 'hidden',
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s.lg,
    padding: s.xl,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  avatarInitial: {
    fontFamily: 'Fraunces_400Regular',
    fontSize: 22,
    color: '#FFFFFF',
  },
  textCol: {
    flex: 1,
    gap: s.xs,
  },
  roleLabel: {
    fontFamily: 'JetBrainsMono_400Regular',
    fontSize: 10,
    letterSpacing: 2.2,
    color: 'rgba(255,255,255,0.85)',
  },
  message: {
    fontFamily: 'Fraunces_400Regular',
    fontSize: 19,
    lineHeight: 24,
    letterSpacing: -0.5,
    color: '#FFFFFF',
  },
});
