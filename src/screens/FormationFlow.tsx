// Formation 전체 화면 — 채팅 형 인터뷰 + 마지막 confirm
import React, { useCallback, useMemo, useRef, useEffect } from 'react';
import { View, ScrollView, StyleSheet, Pressable, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useFormationStore } from '../store/formationStore';
import { useAssetStore } from '../store/assetStore';
import { getStep, isConfirmStep, typeFromStepId } from '../data/formationSteps';
import type { FormationResponse, PresetOption, AssetType } from '../types';
import { AIMessage } from '../components/formation/AIMessage';
import { UserMessage } from '../components/formation/UserMessage';
import { PresetOptions } from '../components/formation/PresetOptions';
import { FreeTextInput } from '../components/formation/FreeTextInput';
import { VoiceInputButton } from '../components/formation/VoiceInputButton';
import { FormationConfirmation } from '../components/formation/FormationConfirmation';
import { getPalette, typography } from '../theme';

export interface FormationFlowProps {
  onDone: () => void;
}

export function FormationFlow({ onDone }: FormationFlowProps) {
  const currentStepId = useFormationStore((s) => s.currentStepId);
  const responses = useFormationStore((s) => s.responses);
  const advance = useFormationStore((s) => s.advance);
  const setInferred = useFormationStore((s) => s.setInferredType);
  const reset = useFormationStore((s) => s.reset);
  const inferredType = useFormationStore((s) => s.context.inferredType);
  const createAsset = useAssetStore((s) => s.createAsset);
  const scrollRef = useRef<ScrollView>(null);

  const step = getStep(currentStepId);
  const palette = inferredType ? getPalette(getPaletteFor(inferredType)) : getPalette('dusk');

  useEffect(() => {
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 60);
  }, [responses.length, currentStepId]);

  const handleResponse = useCallback(
    (value: string, type: FormationResponse['type'], shortLabel?: string, leadsTo?: string) => {
      if (!step) return;
      const next = leadsTo ?? resolveNext(step.nextStep, value);
      // step_01 응답이면 inferredType 설정
      if (step.id === 'step_01') {
        const t = value as AssetType;
        setInferred(t);
      }
      advance({ stepId: step.id, value, type, shortLabel }, next);

      if (next === 'CONFIRM' && inferredType) {
        // 에셋 생성 후 onDone
        const formationData = {
          responses: collectResponses([...responses, { stepId: step.id, value, type, shortLabel }]),
        };
        createAsset(inferredType, formationData);
        reset();
        onDone();
      }
    },
    [step, responses, inferredType, advance, createAsset, setInferred, reset, onDone]
  );

  const handlePreset = (o: PresetOption) =>
    handleResponse(o.id, 'preset', o.shortLabel ?? o.label, o.leadsTo);
  const handleFree = (t: string) => handleResponse(t, 'text');
  const handleVoice = (t: string) => handleResponse(t, 'voice');
  const handleSkip = () => {
    if (!step) return;
    const next = resolveNext(step.nextStep, '__skip__');
    advance({ stepId: step.id, value: '__skip__', type: 'skip' }, next);
  };

  const palettePair = useMemo(() => [palette[50], palette[100], palette[50]] as const, [palette]);

  return (
    <View style={styles.root}>
      <LinearGradient colors={[...palettePair]} style={StyleSheet.absoluteFillObject} />
      <ScrollView ref={scrollRef} contentContainerStyle={styles.body}>
        {/* 누적 메시지 렌더 */}
        {renderHistory(responses, palette)}
        {/* 현재 step AI 메시지 */}
        {step && <AIMessage text={step.aiMessage} />}
        {/* confirm preview */}
        {step && isConfirmStep(step.id) && inferredType && (
          <FormationConfirmation type={inferredType} />
        )}
      </ScrollView>
      {step && (
        <View style={styles.inputArea}>
          {(step.responseType === 'preset' || step.responseType === 'both') && step.presets && (
            <PresetOptions
              options={step.presets}
              onSelect={handlePreset}
              palette={inferredType ? getPaletteFor(inferredType) : 'dusk'}
            />
          )}
          {(step.responseType === 'free' || step.responseType === 'both') && (
            <FreeTextInput
              onSend={handleFree}
              palette={inferredType ? getPaletteFor(inferredType) : 'dusk'}
            />
          )}
          {step.allowVoice && (
            <VoiceInputButton
              onTranscribe={handleVoice}
              palette={inferredType ? getPaletteFor(inferredType) : 'dusk'}
            />
          )}
          {step.allowSkip && (
            <SkipRow onSkip={handleSkip} />
          )}
        </View>
      )}
    </View>
  );
}

function SkipRow({ onSkip }: { onSkip: () => void }) {
  return (
    <Pressable
      onPress={onSkip}
      accessibilityRole="button"
      accessibilityLabel="건너뛰기"
      style={styles.skipBtn}
    >
      <Text style={styles.skipLabel}>건너뛰기</Text>
    </Pressable>
  );
}

function getPaletteFor(type: AssetType) {
  return ({
    fertility: 'dawn' as const,
    cancer_caregiver: 'mist' as const,
    pet_care: 'blossom' as const,
    chronic: 'sage' as const,
    custom: 'dusk' as const,
  })[type];
}

function resolveNext(
  next: import('../types').FormationStep['nextStep'],
  response: string
): string {
  return typeof next === 'function' ? next(response) : next;
}

function collectResponses(rs: FormationResponse[]): Record<string, string> {
  const out: Record<string, string> = {};
  for (const r of rs) out[r.stepId] = r.value;
  return out;
}

function renderHistory(rs: FormationResponse[], palette: ReturnType<typeof getPalette>) {
  const out: React.ReactNode[] = [];
  for (const r of rs) {
    const step = getStep(r.stepId);
    if (step) out.push(<AIMessage key={`${r.stepId}-ai`} text={step.aiMessage} />);
    const label = r.shortLabel ?? (r.type === 'skip' ? '(건너뛰기)' : r.value);
    const inferred = typeFromStepId(r.stepId);
    out.push(
      <UserMessage
        key={`${r.stepId}-user`}
        text={label}
        palette={inferred ? getPaletteFor(inferred) : 'dusk'}
      />
    );
    void palette;
  }
  return out;
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  body: {
    paddingHorizontal: 20,
    paddingTop: 80,
    paddingBottom: 20,
  },
  inputArea: {
    paddingHorizontal: 20,
    paddingBottom: 36,
    paddingTop: 8,
    backgroundColor: 'rgba(255,255,255,0.55)',
    borderTopWidth: 0.5,
    borderTopColor: 'rgba(60,60,67,0.08)',
  },
  skipBtn: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginTop: 4,
  },
  skipLabel: {
    ...typography.footnote,
    color: 'rgba(60,60,67,0.6)',
  },
});
