import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { typography, getPalette, PaletteKey } from '../../../theme';

export interface StepItem {
  id: string;
  label: string;
  status: 'completed' | 'current' | 'upcoming';
}

export interface StepMomentProps {
  palette: PaletteKey;
  title: string;
  steps: StepItem[];
  onStepPress?: (step: StepItem) => void;
}

/**
 * StepMoment: 단계별 진행 상황을 관리하는 범용 모먼트.
 * 시술 단계, 프로젝트 마일스톤, 학습 커리큘럼 등에 대응.
 */
export const StepMoment: React.FC<StepMomentProps> = ({
  palette: paletteKey,
  title,
  steps,
  onStepPress,
}) => {
  const palette = getPalette(paletteKey);

  return (
    <View style={[styles.container, { backgroundColor: palette[50] }]}>
      <Text style={[styles.title, { color: palette[700] }]}>{title}</Text>
      
      <View style={styles.stepsWrapper}>
        {steps.map((step, index) => (
          <Pressable
            key={step.id}
            onPress={() => onStepPress?.(step)}
            style={styles.stepRow}
          >
            <View style={styles.indicatorColumn}>
              <View 
                style={[
                  styles.circle, 
                  { borderColor: palette.accent },
                  step.status === 'completed' && { backgroundColor: palette.accent },
                  step.status === 'current' && { borderWidth: 2, backgroundColor: '#FFFFFF' }
                ]}
              >
                {step.status === 'completed' && <Text style={styles.check}>✓</Text>}
              </View>
              {index < steps.length - 1 && (
                <View style={[styles.line, { backgroundColor: palette[200] }]} />
              )}
            </View>
            
            <View style={styles.contentColumn}>
              <Text 
                style={[
                  styles.label, 
                  { color: step.status === 'upcoming' ? palette[400] : palette[900] },
                  step.status === 'current' && { fontWeight: '700' }
                ]}
              >
                {step.label}
              </Text>
            </View>
          </Pressable>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
  },
  title: {
    ...typography.labelMedium,
    fontWeight: '600',
    marginBottom: 16,
  },
  stepsWrapper: {
    paddingLeft: 4,
  },
  stepRow: {
    flexDirection: 'row',
    minHeight: 40,
  },
  indicatorColumn: {
    alignItems: 'center',
    marginRight: 12,
  },
  circle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  line: {
    width: 2,
    flex: 1,
    marginVertical: 2,
  },
  check: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  contentColumn: {
    flex: 1,
    paddingTop: 0,
  },
  label: {
    ...typography.bodyMedium,
  },
});
