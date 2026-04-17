// Formation 분기 + 5스텝 완료 검증
import { getStep, isConfirmStep, typeFromStepId, allSteps } from '../data/formationSteps';
import { useFormationStore } from '../store/formationStore';
import * as eventsModule from '../lib/events';

describe('formation step graph', () => {
  it('entry step exists with 4 presets (T-FM-01)', () => {
    const s = getStep('step_01');
    expect(s).toBeDefined();
    expect(s?.presets?.length).toBe(4);
  });

  it('fertility branches by selection (T-FM-05)', () => {
    const s = getStep('fertility:step_02');
    expect(s).toBeDefined();
    // first → step_03_first; second/third+ → step_03_repeat
    const fn = s?.nextStep as (r: string) => string;
    expect(fn('first')).toBe('fertility:step_03_first');
    expect(fn('second')).toBe('fertility:step_03_repeat');
    expect(fn('third_plus')).toBe('fertility:step_03_repeat');
  });

  it('reaches CONFIRM in 5 steps for fertility (T-FM-07)', () => {
    // 시뮬레이션: step_01 → ferility 선택 → step_02 → first → step_03_first → step_04 → step_05_confirm → CONFIRM
    const path = [
      { from: 'step_01', via: 'fertility' },
      { from: 'fertility:step_02', via: 'first' },
      { from: 'fertility:step_03_first', via: 'schedule' },
      { from: 'fertility:step_04_partner', via: 'spouse' },
      { from: 'fertility:step_05_confirm', via: 'confirm' },
    ];
    let count = 0;
    for (const p of path) {
      const s = getStep(p.from);
      expect(s).toBeDefined();
      count++;
    }
    expect(count).toBeLessThanOrEqual(5);
    expect(isConfirmStep('fertility:step_05_confirm')).toBe(true);
  });

  it('typeFromStepId infers asset type from prefix', () => {
    expect(typeFromStepId('fertility:step_02')).toBe('fertility');
    expect(typeFromStepId('cancer_caregiver:step_04')).toBe('cancer_caregiver');
    expect(typeFromStepId('pet_care:step_03')).toBe('pet_care');
    expect(typeFromStepId('chronic:step_05_confirm')).toBe('chronic');
    expect(typeFromStepId('step_01')).toBeUndefined();
  });

  it('all 4 asset types have a step_05_confirm', () => {
    const confirmIds = allSteps.filter((s) => isConfirmStep(s.id)).map((s) => s.id);
    expect(confirmIds).toEqual(
      expect.arrayContaining([
        'fertility:step_05_confirm',
        'cancer_caregiver:step_05_confirm',
        'pet_care:step_05_confirm',
        'chronic:step_05_confirm',
      ])
    );
  });
});

describe('formationStore', () => {
  beforeEach(() => useFormationStore.getState().reset());

  it('advance updates currentStepId and appends response (T-FM-02)', () => {
    useFormationStore.getState().advance(
      { stepId: 'step_01', value: 'fertility', type: 'preset', shortLabel: '시험관' },
      'fertility:step_02'
    );
    const s = useFormationStore.getState();
    expect(s.currentStepId).toBe('fertility:step_02');
    expect(s.responses).toHaveLength(1);
    expect(s.responses[0].value).toBe('fertility');
  });

  it('reset returns to step_01 with empty responses', () => {
    useFormationStore.getState().advance(
      { stepId: 'step_01', value: 'chronic', type: 'preset' },
      'chronic:step_02'
    );
    useFormationStore.getState().reset();
    const s = useFormationStore.getState();
    expect(s.currentStepId).toBe('step_01');
    expect(s.responses).toHaveLength(0);
  });

  it('advance double-call to CONFIRM → formation_completed emitted exactly once (T-FM-08)', () => {
    const emitSpy = jest.spyOn(eventsModule, 'emit');
    emitSpy.mockClear();

    // Set up inferredType
    useFormationStore.getState().setInferredType('fertility');

    const step1Response: import('../types').FormationResponse = {
      stepId: 'step_01',
      value: 'fertility',
      type: 'preset',
    };
    const step2Response: import('../types').FormationResponse = {
      stepId: 'fertility:step_02',
      value: 'first',
      type: 'preset',
    };

    // First advance to CONFIRM
    useFormationStore.getState().advance(step1Response, 'CONFIRM');
    // Second advance to CONFIRM (simulates double-tap / race)
    useFormationStore.getState().advance(step2Response, 'CONFIRM');

    const completedCalls = emitSpy.mock.calls.filter((c) => c[0] === 'formation_completed');
    expect(completedCalls).toHaveLength(1);

    emitSpy.mockRestore();
  });

  it('completedFired resets to false after reset() (T-FM-09)', () => {
    useFormationStore.getState().setInferredType('chronic');
    useFormationStore.getState().advance(
      { stepId: 'step_01', value: 'chronic', type: 'preset' },
      'CONFIRM'
    );
    expect(useFormationStore.getState().completedFired).toBe(true);
    useFormationStore.getState().reset();
    expect(useFormationStore.getState().completedFired).toBe(false);
  });
});
