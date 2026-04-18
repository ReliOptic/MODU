/**
 * Phase 2 integration — Part 1: resolveTPO + widgetsToBlocks against real templates.
 * See pipeline.memory.integration.test.ts for memory + end-to-end pipeline tests.
 */
import { assetTemplates } from '../../data/assetTemplates';
import type { Asset } from '../../types/asset';
import {
  resolveTPO,
  inferRole,
  mapAssetKey,
} from '../../adapters/assetToTPO';
import type { TPOInputState } from '../../adapters/assetToTPO';
import { widgetsToBlocks } from '../../adapters/widgetToBlock';

export const KST_MORNING = new Date('2026-04-18T09:00:00+09:00');

export const BASE_STATE: TPOInputState = {
  locale: 'ko',
  placeId: 'kr_seoul',
  role: null,
  nowOverride: null,
};

export function fromTemplate(type: keyof typeof assetTemplates, id: string): Asset {
  const t = assetTemplates[type];
  const now = '2026-04-18T00:00:00.000Z';
  return {
    id,
    type: t.type,
    displayName: t.defaultDisplayName,
    palette: t.palette,
    envelope: t.envelope,
    tabs: t.tabs,
    widgets: t.widgets,
    layoutRules: [],
    formationData: { responses: {} },
    status: 'active',
    createdAt: now,
    lastActiveAt: now,
    updatedAt: now,
    syncedAt: null,
  };
}

describe('resolveTPO ↔ assetTemplates', () => {
  it('fertility → timeOfDay=morning, role=self, assetKey=fertility, heroWord non-empty', () => {
    const asset = fromTemplate('fertility', 'test-fertility');
    const tpo = resolveTPO(asset, BASE_STATE, KST_MORNING);

    expect(tpo.timeOfDay).toBe('morning');
    expect(tpo.role).toBe('self');
    expect(tpo.assetKey).toBe('fertility');
    expect(tpo.copy.heroWord.length).toBeGreaterThan(0);
  });

  it('cancer_caregiver → role=guardian, assetKey=cancer', () => {
    const asset = fromTemplate('cancer_caregiver', 'test-cancer');
    const tpo = resolveTPO(asset, BASE_STATE, KST_MORNING);

    expect(tpo.role).toBe('guardian');
    expect(tpo.assetKey).toBe('cancer');
  });

  it('pet_care → role=guardian, assetKey=pet', () => {
    const asset = fromTemplate('pet_care', 'test-pet');
    const tpo = resolveTPO(asset, BASE_STATE, KST_MORNING);

    expect(tpo.role).toBe('guardian');
    expect(tpo.assetKey).toBe('pet');
  });

  it('inferRole and mapAssetKey helpers are consistent with resolveTPO', () => {
    const cancer = fromTemplate('cancer_caregiver', 'x');
    expect(inferRole(cancer)).toBe('guardian');
    expect(mapAssetKey('cancer_caregiver')).toBe('cancer');

    const pet = fromTemplate('pet_care', 'y');
    expect(inferRole(pet)).toBe('guardian');
    expect(mapAssetKey('pet_care')).toBe('pet');
  });
});

describe('widgetsToBlocks ↔ template widgets', () => {
  const templateKeys = ['fertility', 'cancer_caregiver', 'pet_care'] as const;

  it.each(templateKeys)('%s: blocks.length equals template widgets count', (key) => {
    const widgets = assetTemplates[key].widgets;
    const blocks = widgetsToBlocks(widgets);
    expect(blocks.length).toBe(widgets.length);
  });

  it.each(templateKeys)('%s: blocks sorted descending by priority', (key) => {
    const blocks = widgetsToBlocks(assetTemplates[key].widgets);
    for (let i = 1; i < blocks.length; i++) {
      expect(blocks[i - 1].priority).toBeGreaterThanOrEqual(blocks[i].priority);
    }
  });

  it.each(templateKeys)('%s: every block has non-empty id and valid variant', (key) => {
    const blocks = widgetsToBlocks(assetTemplates[key].widgets);
    for (const block of blocks) {
      expect(block.id.length).toBeGreaterThan(0);
      expect(typeof block.variant).toBe('string');
      expect(block.variant.length).toBeGreaterThan(0);
    }
  });

  it('fertility: at least one block has variant "hero" (primary_event present)', () => {
    const blocks = widgetsToBlocks(assetTemplates.fertility.widgets);
    const hasHero = blocks.some((b) => b.variant === 'hero');
    expect(hasHero).toBe(true);
  });
});
