// v2.1 §9 fertility · morph — TPO-reactive morphing canvas.
// Blob size, section set, pod mode all change with proximity.
// Reduce-motion via useReduceMotion: freezes FadeIn entering animations.
import React, { useMemo, useState } from 'react';
import { ScrollView, View, StyleSheet } from 'react-native';
import type { VariationProps } from '../types';
import { useReduceMotion } from '../../../hooks/useReduceMotion';
import {
  MORPH_SHAPES,
  MORPH_SECTION_ORDER,
  MORPH_TIMELINE_SETS,
} from './morphData';
import { renderMorphSection } from './morphSectionRenderer';

export function TimelineSpineMorph({
  tpo,
  palette,
}: VariationProps): React.JSX.Element {
  const reduceMotion = useReduceMotion();
  const [tapped, setTapped] = useState<string | null>(null);

  const shape = useMemo(() => MORPH_SHAPES[tpo.proximity], [tpo.proximity]);
  const sections = useMemo(
    () => MORPH_SECTION_ORDER[tpo.proximity],
    [tpo.proximity],
  );
  const timelineItems = useMemo(
    () => MORPH_TIMELINE_SETS[tpo.proximity] ?? [],
    [tpo.proximity],
  );

  return (
    <View style={styles.root}>
      {/* P1.7: ambient mesh canvas — palette[200] at 0.3 opacity */}
      <View style={StyleSheet.absoluteFillObject}>
        <View style={[styles.meshBackdrop, { backgroundColor: palette[200] }]} />
      </View>
      <ScrollView
        style={styles.fill}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {sections.map((id) =>
          renderMorphSection({
            id,
            tpo,
            palette,
            shape,
            timelineItems,
            tapped,
            setTapped,
            reduceMotion,
          }),
        )}
        <View style={styles.tail} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  meshBackdrop: { flex: 1, opacity: 0.3 },
  fill: { flex: 1 },
  content: { paddingBottom: 60, gap: 16 },
  tail: { height: 60 },
});
