import { findPlace, PLACES } from '../../../../src/engine/tpo/places';
import { getPlaceResources } from '../../../../src/engine/tpo/selectors';

describe('findPlace', () => {
  it('findPlace("kr_seoul") returns KR', () => {
    const place = findPlace('kr_seoul');
    expect(place.id).toBe('kr_seoul');
    expect(place.country).toBe('KR');
    expect(place.flag).toBe('🇰🇷');
  });

  it('findPlace("jp_tokyo") returns JP', () => {
    const place = findPlace('jp_tokyo');
    expect(place.country).toBe('JP');
  });

  it('findPlace unknown id falls back to first (kr_seoul)', () => {
    const place = findPlace('xx_unknown');
    expect(place.id).toBe(PLACES[0].id);
  });

  it('all 4 places present', () => {
    const ids = PLACES.map((p) => p.id);
    expect(ids).toContain('kr_seoul');
    expect(ids).toContain('jp_tokyo');
    expect(ids).toContain('de_berlin');
    expect(ids).toContain('ae_dubai');
    expect(PLACES).toHaveLength(4);
  });
});

describe('getPlaceResources', () => {
  it('kr_seoul fertility in ko has subsidy + clinic items', () => {
    const result = getPlaceResources({ placeId: 'kr_seoul', assetKey: 'fertility', locale: 'ko' });
    expect(result.place.country).toBe('KR');
    expect(result.placeLabel).toBe('서울 · 대한민국');
    expect(result.items).toHaveLength(2);

    const subsidy = result.items.find((i) => i.kind === 'subsidy');
    const clinic  = result.items.find((i) => i.kind === 'clinic');
    expect(subsidy).toBeDefined();
    expect(clinic).toBeDefined();
  });

  it('kr_seoul fertility labels are localized to ko', () => {
    const result = getPlaceResources({ placeId: 'kr_seoul', assetKey: 'fertility', locale: 'ko' });
    const subsidy = result.items.find((i) => i.kind === 'subsidy');
    expect(subsidy?.label).toBe('난임 시술 정부 지원 (보건복지부)');
    expect(subsidy?.note).toBe('최대 110만원/회');
  });

  it('kr_seoul fertility labels are localized to en', () => {
    const result = getPlaceResources({ placeId: 'kr_seoul', assetKey: 'fertility', locale: 'en' });
    const subsidy = result.items.find((i) => i.kind === 'subsidy');
    expect(subsidy?.label).toBe('Govt. IVF Subsidy (MoHW)');
    expect(subsidy?.note).toBe('Up to ₩1.1M / cycle');
  });

  it('unknown placeId falls back to kr_seoul', () => {
    const result = getPlaceResources({ placeId: 'zz_nowhere', assetKey: 'fertility', locale: 'ko' });
    expect(result.place.id).toBe('kr_seoul');
  });

  it('placeId with no resources for assetKey returns empty items', () => {
    const result = getPlaceResources({ placeId: 'ae_dubai', assetKey: 'cancer', locale: 'en' });
    expect(result.items).toHaveLength(0);
  });

  it('note is empty string when not defined', () => {
    // ae_dubai fertility has a clinic with no note
    const result = getPlaceResources({ placeId: 'ae_dubai', assetKey: 'fertility', locale: 'en' });
    const clinic = result.items.find((i) => i.kind === 'clinic');
    expect(clinic?.note).toBe('');
  });
});
