// Bento whisper tile — gradient paper fill, large serif quote.
// Reference: BentoBlock kind='whisper' in variation-bento.jsx.
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { PaletteSwatch } from '../../../../theme';

export interface BentoWhisperTileProps {
  readonly palette: PaletteSwatch;
  readonly text: string;
  readonly minHeight: number;
}

export function BentoWhisperTile({
  palette,
  text,
  minHeight,
}: BentoWhisperTileProps): React.JSX.Element {
  return (
    <View style={[styles.tile, { backgroundColor: palette[100], borderColor: palette[200], minHeight }]}>
      <Text style={[styles.quote, { color: palette[900] }]} numberOfLines={4}>
        {text}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  tile: {
    flex: 1,
    borderRadius: 20,
    padding: 18,
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  quote: {
    fontFamily: 'Fraunces_400Regular',
    fontSize: 17,
    lineHeight: 25,
    letterSpacing: -0.3,
  },
});
