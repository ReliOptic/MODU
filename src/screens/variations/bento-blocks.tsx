// Bento block tile renderer — RendererBlock × span → RN tile.
// Dispatches first on widgetType (rich tile) then falls back to variant.
// Renderer is domain-agnostic: reads RendererBlock.props as opaque records,
// narrowing per widgetType locally with a guarded read helper.
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { DimensionValue } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import type { RendererBlock, ResolvedTPO } from '../../adapters';
import type { PaletteSwatch } from '../../theme';
import { proximityLabel } from './types';

export type BentoSpan = readonly [number, number];

const ROW_HEIGHT = 64;
const ROW_GAP = 10;

function spanWidth(cols: number): DimensionValue {
  const pct = Math.round((cols / 6) * 1000) / 10;
  return `${pct}%` as DimensionValue;
}

function widgetEyebrow(widgetType: string): string {
  return widgetType.replace(/_/g, ' ').replace(/\./g, ' · ').toUpperCase();
}

function readString(props: Readonly<Record<string, unknown>>, key: string): string | null {
  const v = props[key];
  return typeof v === 'string' && v.length > 0 ? v : null;
}

function readBoolean(props: Readonly<Record<string, unknown>>, key: string): boolean | null {
  const v = props[key];
  return typeof v === 'boolean' ? v : null;
}

function readArray<T>(props: Readonly<Record<string, unknown>>, key: string): readonly T[] {
  const v = props[key];
  return Array.isArray(v) ? (v as readonly T[]) : [];
}

interface BentoBlockProps {
  readonly block: RendererBlock;
  readonly palette: PaletteSwatch;
  readonly tpo: ResolvedTPO;
  readonly span: BentoSpan;
}

export function BentoBlock({ block, palette, tpo, span }: BentoBlockProps): React.JSX.Element {
  const [c, r] = span;
  const minHeight = ROW_HEIGHT * r + ROW_GAP * (r - 1);
  const wrapperStyle = { width: spanWidth(c), minHeight };

  // widgetType-specific rich tiles (fidelity layer).
  switch (block.widgetType) {
    case 'primary_event':
    case 'primary_medication':
    case 'primary_condition':
      return <PrimaryEventTile palette={palette} tpo={tpo} block={block} wrapperStyle={wrapperStyle} />;
    case 'injection_timeline':
      return <InjectionTimelineTile palette={palette} block={block} wrapperStyle={wrapperStyle} />;
    case 'mood_quicklog':
      return <MoodQuicklogTile palette={palette} block={block} wrapperStyle={wrapperStyle} />;
    case 'partner_sync':
      return <PartnerSyncTile palette={palette} block={block} wrapperStyle={wrapperStyle} />;
    case 'calendar_full':
    case 'calendar_mini':
      return <CalendarTile palette={palette} block={block} wrapperStyle={wrapperStyle} />;
    case 'pet_profile':
      return <PetProfileTile palette={palette} block={block} wrapperStyle={wrapperStyle} />;
    case 'daily_log_bars':
      return <DailyLogBarsTile palette={palette} block={block} wrapperStyle={wrapperStyle} />;
    case 'vet_memo':
    case 'prev_visit_memo':
      return <MemoTile palette={palette} block={block} wrapperStyle={wrapperStyle} />;
    case 'next_visit':
      return <NextVisitTile palette={palette} block={block} wrapperStyle={wrapperStyle} />;
    default:
      break;
  }

  // Generic variant fallback.
  if (block.variant === 'hero') {
    return <PrimaryEventTile palette={palette} tpo={tpo} block={block} wrapperStyle={wrapperStyle} />;
  }
  if (block.variant === 'stat') {
    return <StatTile palette={palette} block={block} wrapperStyle={wrapperStyle} />;
  }
  if (block.variant === 'strip') {
    return <StripTile palette={palette} block={block} wrapperStyle={wrapperStyle} />;
  }
  if (block.variant === 'grid') {
    return <CalendarTile palette={palette} block={block} wrapperStyle={wrapperStyle} />;
  }
  if (block.variant === 'list') {
    return <ListTile palette={palette} block={block} wrapperStyle={wrapperStyle} />;
  }
  return <CardTile palette={palette} block={block} wrapperStyle={wrapperStyle} />;
}

// ---------------------------------------------------------------------------
// Wrapper style + shared helpers
// ---------------------------------------------------------------------------

interface VariantProps {
  readonly palette: PaletteSwatch;
  readonly block: RendererBlock;
  readonly wrapperStyle: { width: DimensionValue; minHeight: number };
}

function MonoEyebrow({ palette, label }: { palette: PaletteSwatch; label: string }): React.JSX.Element {
  return <Text style={[styles.eyebrow, { color: palette[700] }]}>{label}</Text>;
}

// ---------------------------------------------------------------------------
// PRIMARY_EVENT / PRIMARY_MEDICATION / PRIMARY_CONDITION — gradient hero tile
// ---------------------------------------------------------------------------

function PrimaryEventTile({
  palette,
  tpo,
  block,
  wrapperStyle,
}: VariantProps & { tpo: ResolvedTPO }): React.JSX.Element {
  const title = readString(block.props, 'title') ?? tpo.copy.heroWord;
  const timeLabel = readString(block.props, 'timeLabel');
  const countdown = readString(block.props, 'countdown') ?? proximityLabel(tpo.proximity);
  const subtitle = readString(block.props, 'subtitle') ?? tpo.copy.whisper;

  const eyebrowParts = [timeLabel, countdown].filter((v): v is string => v !== null && v.length > 0);

  return (
    <View style={[styles.tileWrap, wrapperStyle]}>
      <LinearGradient
        colors={[palette.heroGradient.top, palette.heroGradient.mid, palette.heroGradient.bottom]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.heroFill}
      >
        <Text style={styles.heroEyebrow}>{eyebrowParts.join(' · ')}</Text>
        <View style={styles.heroBody}>
          <Text style={styles.heroTitle} numberOfLines={2}>{title}</Text>
          <Text style={styles.heroSub} numberOfLines={3}>{subtitle}</Text>
        </View>
      </LinearGradient>
    </View>
  );
}

// ---------------------------------------------------------------------------
// INJECTION_TIMELINE — paper card with three time/drug/site rows + status pill
// ---------------------------------------------------------------------------

interface InjectionItem {
  readonly time: string;
  readonly drug: string;
  readonly site: string;
  readonly status: 'done' | 'now' | 'upcoming';
}

function InjectionTimelineTile({ palette, block, wrapperStyle }: VariantProps): React.JSX.Element {
  const items = readArray<InjectionItem>(block.props, 'items');
  const visible = items.slice(0, 3);

  return (
    <View style={[styles.tileWrap, wrapperStyle]}>
      <View style={[styles.paperFill, { backgroundColor: palette[100] }]}>
        <MonoEyebrow palette={palette} label="주사 타임라인" />
        <View style={styles.injectionRows}>
          {visible.map((item, i) => {
            const isDone = item.status === 'done';
            const isNow = item.status === 'now';
            const dotBg = isDone ? palette[500] : isNow ? palette.accent : palette[200];
            return (
              <View key={`${block.id}-inj-${i}`} style={styles.injectionRow}>
                <View style={[styles.injectionDot, { backgroundColor: dotBg }]} />
                <View style={styles.injectionMeta}>
                  <Text style={[styles.injectionTime, { color: palette[900] }]}>{item.time}</Text>
                  <Text style={[styles.injectionDrug, { color: palette[700] }]} numberOfLines={1}>
                    {item.drug} · {item.site}
                  </Text>
                </View>
                {isNow && (
                  <View style={[styles.injectionPill, { backgroundColor: palette.accent }]}>
                    <Text style={styles.injectionPillText}>지금</Text>
                  </View>
                )}
              </View>
            );
          })}
        </View>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// MOOD_QUICKLOG — 4 mood swatches in a row, first one selected as default
// ---------------------------------------------------------------------------

const MOOD_LABELS = ['평온', '설렘', '불안', '피곤'] as const;

function MoodQuicklogTile({ palette, block, wrapperStyle }: VariantProps): React.JSX.Element {
  return (
    <View style={[styles.tileWrap, wrapperStyle]}>
      <View style={[styles.paperFill, { backgroundColor: palette[100] }]}>
        <MonoEyebrow palette={palette} label="지금 감정" />
        <View style={styles.moodRow}>
          {MOOD_LABELS.map((label, i) => {
            const selected = i === 1;
            return (
              <View
                key={`${block.id}-mood-${i}`}
                style={[
                  styles.moodSwatch,
                  {
                    backgroundColor: selected ? palette.accent : palette[200],
                    opacity: selected ? 1 : 0.55,
                  },
                ]}
              >
                <Text style={[styles.moodSwatchText, { color: selected ? '#fff' : palette[700] }]}>
                  {label}
                </Text>
              </View>
            );
          })}
        </View>
        <Text style={[styles.metaCaption, { color: palette[700] }]}>2시간 전 기록</Text>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// PARTNER_SYNC — accent fill, partner initial, sync status
// ---------------------------------------------------------------------------

function PartnerSyncTile({ palette, block, wrapperStyle }: VariantProps): React.JSX.Element {
  const partnerName = readString(block.props, 'partnerName') ?? '파트너';
  const syncEnabled = readBoolean(block.props, 'syncEnabled') ?? false;
  const initial = partnerName.charAt(0);

  return (
    <View style={[styles.tileWrap, wrapperStyle]}>
      <View style={[styles.partnerFill, { backgroundColor: palette.accent }]}>
        <Text style={styles.partnerEyebrow}>파트너</Text>
        <View style={styles.partnerAvatar}>
          <Text style={styles.partnerInitial}>{initial}</Text>
        </View>
        <Text style={styles.partnerStatus}>{syncEnabled ? '동기화 ON' : '동기화 OFF'}</Text>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// CALENDAR_FULL / CALENDAR_MINI — 4-week dot grid
// ---------------------------------------------------------------------------

interface CalendarDot {
  readonly day: number;
  readonly color?: string;
}

function CalendarTile({ palette, block, wrapperStyle }: VariantProps): React.JSX.Element {
  const dots = readArray<CalendarDot>(block.props, 'dots');
  const dotMap = new Map(dots.map((d) => [d.day, d.color ?? palette.accent]));

  return (
    <View style={[styles.tileWrap, wrapperStyle]}>
      <View style={[styles.paperFill, { backgroundColor: palette[50] }]}>
        <MonoEyebrow palette={palette} label="이번 달" />
        <View style={styles.calendarGrid}>
          {Array.from({ length: 28 }).map((_, i) => {
            const day = i + 1;
            const dotColor = dotMap.get(day);
            return (
              <View
                key={`${block.id}-day-${day}`}
                style={[
                  styles.calendarCell,
                  {
                    backgroundColor: dotColor !== undefined ? dotColor : 'transparent',
                    borderColor: dotColor !== undefined ? 'transparent' : palette[200],
                  },
                ]}
              >
                <Text
                  style={[
                    styles.calendarCellText,
                    { color: dotColor !== undefined ? '#fff' : palette[700] },
                  ]}
                >
                  {day}
                </Text>
              </View>
            );
          })}
        </View>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// PET_PROFILE — emoji + name/species/age
// ---------------------------------------------------------------------------

function PetProfileTile({ palette, block, wrapperStyle }: VariantProps): React.JSX.Element {
  const emoji = readString(block.props, 'emoji') ?? '🐾';
  const name = readString(block.props, 'name') ?? '';
  const species = readString(block.props, 'species') ?? '';
  const age = readString(block.props, 'age') ?? '';

  return (
    <View style={[styles.tileWrap, wrapperStyle]}>
      <View style={[styles.paperFill, { backgroundColor: palette[100] }]}>
        <Text style={styles.petEmoji}>{emoji}</Text>
        <Text style={[styles.petName, { color: palette[900] }]} numberOfLines={1}>{name}</Text>
        <Text style={[styles.metaCaption, { color: palette[700] }]} numberOfLines={1}>
          {[species, age].filter((v) => v.length > 0).join(' · ')}
        </Text>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// DAILY_LOG_BARS — 3 mini progress bars (walk/appetite/water)
// ---------------------------------------------------------------------------

interface BarValue {
  readonly value: number;
  readonly label: string;
}

const DAILY_BAR_KEYS: readonly { key: string; label: string }[] = [
  { key: 'walk', label: '산책' },
  { key: 'appetite', label: '식욕' },
  { key: 'water', label: '수분' },
];

function DailyLogBarsTile({ palette, block, wrapperStyle }: VariantProps): React.JSX.Element {
  return (
    <View style={[styles.tileWrap, wrapperStyle]}>
      <View style={[styles.paperFill, { backgroundColor: palette[100] }]}>
        <MonoEyebrow palette={palette} label="오늘 컨디션" />
        <View style={styles.dailyBars}>
          {DAILY_BAR_KEYS.map(({ key, label }) => {
            const raw = block.props[key];
            const bar: BarValue =
              raw !== null && typeof raw === 'object' && raw !== undefined
                ? (raw as BarValue)
                : { value: 0, label: '—' };
            return (
              <View key={`${block.id}-bar-${key}`} style={styles.dailyBarRow}>
                <Text style={[styles.dailyBarLabel, { color: palette[700] }]}>{label}</Text>
                <View style={[styles.dailyBarTrack, { backgroundColor: palette[200] }]}>
                  <View
                    style={[
                      styles.dailyBarFill,
                      {
                        backgroundColor: palette.accent,
                        width: `${Math.max(0, Math.min(1, bar.value)) * 100}%`,
                      },
                    ]}
                  />
                </View>
                <Text style={[styles.dailyBarValue, { color: palette[900] }]} numberOfLines={1}>
                  {bar.label}
                </Text>
              </View>
            );
          })}
        </View>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// MEMO (vet_memo / prev_visit_memo) — date eyebrow + notes excerpt
// ---------------------------------------------------------------------------

function MemoTile({ palette, block, wrapperStyle }: VariantProps): React.JSX.Element {
  const date = readString(block.props, 'date') ?? readString(block.props, 'nextVisit') ?? '';
  const notes = readString(block.props, 'notes') ?? '';

  return (
    <View style={[styles.tileWrap, wrapperStyle]}>
      <View style={[styles.paperFill, { backgroundColor: palette[50] }]}>
        <MonoEyebrow palette={palette} label={date.length > 0 ? date : '메모'} />
        <Text style={[styles.memoText, { color: palette[900] }]} numberOfLines={4}>
          {notes}
        </Text>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// NEXT_VISIT — large date stat
// ---------------------------------------------------------------------------

function NextVisitTile({ palette, block, wrapperStyle }: VariantProps): React.JSX.Element {
  const date = readString(block.props, 'date') ?? '—';
  const doctor = readString(block.props, 'doctor') ?? '';

  return (
    <View style={[styles.tileWrap, wrapperStyle]}>
      <View style={[styles.paperFill, { backgroundColor: palette[100] }]}>
        <MonoEyebrow palette={palette} label="다음 진료" />
        <Text style={[styles.statValue, { color: palette.accent }]} numberOfLines={1}>{date}</Text>
        <Text style={[styles.metaCaption, { color: palette[700] }]} numberOfLines={1}>{doctor}</Text>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Generic fallbacks (kept for unknown widgetTypes)
// ---------------------------------------------------------------------------

function StatTile({ palette, block, wrapperStyle }: VariantProps): React.JSX.Element {
  return (
    <View style={[styles.tileWrap, wrapperStyle]}>
      <View style={[styles.paperFill, { backgroundColor: palette[100] }]}>
        <MonoEyebrow palette={palette} label={widgetEyebrow(block.widgetType)} />
        <Text style={[styles.statValue, { color: palette.accent }]}>—</Text>
        <Text style={[styles.metaCaption, { color: palette[700] }]}>tap to log</Text>
      </View>
    </View>
  );
}

function StripTile({ palette, block, wrapperStyle }: VariantProps): React.JSX.Element {
  const values = readArray<number>(block.props, 'values');
  const bars = values.length > 0 ? values.slice(0, 7) : [0.4, 0.6, 0.8, 1, 0.9, 0.7, 0.5];
  const max = Math.max(...bars, 1);

  return (
    <View style={[styles.tileWrap, wrapperStyle]}>
      <View style={[styles.paperFill, { backgroundColor: palette[50] }]}>
        <MonoEyebrow palette={palette} label={widgetEyebrow(block.widgetType)} />
        <View style={styles.stripBars}>
          {bars.map((v, i) => {
            const norm = v / max;
            return (
              <View
                key={`${block.id}-bar-${i}`}
                style={{
                  flex: 1,
                  height: 28 * norm + 6,
                  borderRadius: 3,
                  backgroundColor: palette.accent,
                  opacity: 0.35 + norm * 0.5,
                }}
              />
            );
          })}
        </View>
      </View>
    </View>
  );
}

function ListTile({ palette, block, wrapperStyle }: VariantProps): React.JSX.Element {
  interface ListItem { readonly text?: string; readonly name?: string; readonly schedule?: string }
  const items = readArray<ListItem>(block.props, 'items').slice(0, 3);
  const rows: { primary: string; secondary?: string }[] =
    items.length > 0
      ? items.map((it) => ({
          primary: it.text ?? it.name ?? '—',
          secondary: it.schedule,
        }))
      : [0, 1, 2].map(() => ({ primary: '' }));

  return (
    <View style={[styles.tileWrap, wrapperStyle]}>
      <View style={[styles.paperFill, { backgroundColor: palette[50] }]}>
        <MonoEyebrow palette={palette} label={widgetEyebrow(block.widgetType)} />
        {rows.map((row, i) => (
          <View key={`${block.id}-row-${i}`} style={styles.listRow}>
            <View style={[styles.listDot, { backgroundColor: palette.accent }]} />
            {row.primary.length > 0 ? (
              <Text style={[styles.listText, { color: palette[900] }]} numberOfLines={1}>
                {row.primary}
                {row.secondary !== undefined ? ` · ${row.secondary}` : ''}
              </Text>
            ) : (
              <View style={[styles.listLine, { backgroundColor: palette[200] }]} />
            )}
          </View>
        ))}
      </View>
    </View>
  );
}

function CardTile({ palette, block, wrapperStyle }: VariantProps): React.JSX.Element {
  return (
    <View style={[styles.tileWrap, wrapperStyle]}>
      <View style={[styles.paperFill, { backgroundColor: palette[100] }]}>
        <MonoEyebrow palette={palette} label={widgetEyebrow(block.widgetType)} />
        <Text style={[styles.cardTitle, { color: palette[900] }]}>{block.tab}</Text>
        <Text style={[styles.metaCaption, { color: palette[700] }]}>priority {block.priority}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  tileWrap: { padding: 5 },
  heroFill: {
    flex: 1,
    borderRadius: 20,
    padding: 18,
    justifyContent: 'space-between',
    overflow: 'hidden',
  },
  heroEyebrow: {
    fontSize: 10,
    letterSpacing: 2.2,
    color: 'rgba(255,255,255,0.85)',
    fontFamily: 'JetBrainsMono_400Regular',
  },
  heroBody: { gap: 8 },
  heroTitle: {
    fontFamily: 'Fraunces_400Regular',
    fontSize: 36,
    lineHeight: 38,
    color: '#fff',
    letterSpacing: -1,
  },
  heroSub: {
    fontFamily: 'Pretendard_400Regular',
    fontSize: 13,
    lineHeight: 18,
    color: 'rgba(255,255,255,0.92)',
  },
  paperFill: {
    flex: 1,
    borderRadius: 18,
    padding: 14,
    justifyContent: 'space-between',
    overflow: 'hidden',
  },
  eyebrow: {
    fontSize: 9,
    letterSpacing: 1.8,
    fontFamily: 'JetBrainsMono_400Regular',
  },
  statValue: {
    fontFamily: 'Fraunces_400Regular',
    fontSize: 28,
    lineHeight: 30,
    letterSpacing: -1,
  },
  cardTitle: {
    fontFamily: 'Fraunces_400Regular',
    fontSize: 18,
    lineHeight: 22,
    letterSpacing: -0.4,
  },
  metaCaption: {
    fontSize: 11,
    fontFamily: 'Pretendard_400Regular',
  },
  // injection
  injectionRows: { gap: 10, marginTop: 6 },
  injectionRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  injectionDot: { width: 8, height: 8, borderRadius: 4 },
  injectionMeta: { flex: 1, gap: 2 },
  injectionTime: {
    fontFamily: 'JetBrainsMono_400Regular',
    fontSize: 13,
    letterSpacing: 0.5,
  },
  injectionDrug: {
    fontFamily: 'Pretendard_400Regular',
    fontSize: 11,
  },
  injectionPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 100,
  },
  injectionPillText: {
    color: '#fff',
    fontSize: 10,
    fontFamily: 'Pretendard_400Regular',
    letterSpacing: 0.4,
  },
  // mood
  moodRow: { flexDirection: 'row', gap: 6, marginTop: 6 },
  moodSwatch: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  moodSwatchText: {
    fontSize: 11,
    fontFamily: 'Pretendard_400Regular',
  },
  // partner
  partnerFill: {
    flex: 1,
    borderRadius: 18,
    padding: 14,
    justifyContent: 'space-between',
    alignItems: 'center',
    overflow: 'hidden',
  },
  partnerEyebrow: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 9,
    letterSpacing: 2,
    fontFamily: 'JetBrainsMono_400Regular',
  },
  partnerAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  partnerInitial: {
    fontFamily: 'Fraunces_400Regular',
    fontSize: 20,
    color: '#fff',
  },
  partnerStatus: {
    color: 'rgba(255,255,255,0.92)',
    fontSize: 10,
    fontFamily: 'Pretendard_400Regular',
  },
  // calendar
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 6,
  },
  calendarCell: {
    width: '13.2%',
    aspectRatio: 1,
    margin: 1.5,
    borderRadius: 4,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calendarCellText: {
    fontSize: 9,
    fontFamily: 'JetBrainsMono_400Regular',
  },
  // pet
  petEmoji: { fontSize: 32 },
  petName: {
    fontFamily: 'Fraunces_400Regular',
    fontSize: 22,
    letterSpacing: -0.4,
  },
  // daily bars
  dailyBars: { gap: 8, marginTop: 6 },
  dailyBarRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dailyBarLabel: {
    fontFamily: 'Pretendard_400Regular',
    fontSize: 11,
    width: 36,
  },
  dailyBarTrack: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  dailyBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  dailyBarValue: {
    fontFamily: 'Pretendard_400Regular',
    fontSize: 10,
    width: 56,
    textAlign: 'right',
  },
  // memo
  memoText: {
    fontFamily: 'Pretendard_400Regular',
    fontSize: 12,
    lineHeight: 18,
    marginTop: 6,
  },
  // generic
  stripBars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 4,
    marginTop: 6,
  },
  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 6,
  },
  listDot: { width: 6, height: 6, borderRadius: 3 },
  listLine: { flex: 1, height: 4, borderRadius: 2 },
  listText: {
    flex: 1,
    fontFamily: 'Pretendard_400Regular',
    fontSize: 12,
  },
});
