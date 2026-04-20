// Styles for CinematicHero — extracted to keep component ≤200 LOC.
import { StyleSheet } from 'react-native';
import { s } from '../../../../theme';

export const heroStyles = StyleSheet.create({
  container: {
    width: '100%',
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  topStrip: {
    position: 'absolute',
    top: 52,
    left: s.xl,
    right: s.xl,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 2,
  },
  topMono: {
    fontFamily: 'JetBrainsMono_400Regular',
    fontSize: 10,
    letterSpacing: 3,
    textTransform: 'uppercase',
    color: 'rgba(255,255,255,0.9)',
  },
  pill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  pillText: {
    fontFamily: 'JetBrainsMono_400Regular',
    fontSize: 10,
    letterSpacing: 2,
    color: 'rgba(255,255,255,0.9)',
  },
  titleBlock: {
    paddingHorizontal: s.xl,
    // Fix 12: paddingBottom hardcoded editorial gutter
    paddingBottom: 80,
    gap: s.md,
    zIndex: 2,
  },
  eyebrow: {
    fontFamily: 'JetBrainsMono_400Regular',
    fontSize: 10,
    letterSpacing: 3,
    textTransform: 'uppercase',
    color: 'rgba(255,255,255,0.8)',
  },
  heroTitle: {
    fontFamily: 'Fraunces_400Regular',
    letterSpacing: -1.4,
    color: '#FFFFFF',
  },
  heroItalic: {
    fontFamily: 'Fraunces_400Regular',
    fontStyle: 'italic',
  },
  whisper: {
    fontFamily: 'Pretendard_400Regular',
    fontSize: 14,
    lineHeight: 22,
    color: 'rgba(255,255,255,0.88)',
    maxWidth: 320,
  },
  placeLabel: {
    fontFamily: 'JetBrainsMono_400Regular',
    fontSize: 9,
    letterSpacing: 3,
    color: 'rgba(255,255,255,0.65)',
    marginTop: s.xs,
  },
});
