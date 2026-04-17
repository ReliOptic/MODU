// MoodJournal — per-asset emotional journal entries, AsyncStorage-backed.
// Local-first (ADR-0011). One AsyncStorage key per asset id.
import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { uuid, nowIso } from '../lib/ids';

export type MoodTone = 'calm' | 'tired' | 'down' | 'hopeful' | 'turbulent' | 'grateful';

export interface MoodEntry {
  id: string;
  assetId: string;
  tone: MoodTone;
  text: string;
  createdAt: string;
}

export interface MoodJournalStore {
  entriesByAsset: Record<string, MoodEntry[]>;
  hydrated: boolean;
  hydrate: (assetId: string) => Promise<void>;
  add: (assetId: string, tone: MoodTone, text: string) => Promise<MoodEntry>;
  remove: (assetId: string, id: string) => Promise<void>;
  entriesFor: (assetId: string) => MoodEntry[];
}

const storageKey = (assetId: string): string => `modu.mood.v1.${assetId}`;

async function readEntries(assetId: string): Promise<MoodEntry[]> {
  try {
    const raw = await AsyncStorage.getItem(storageKey(assetId));
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isMoodEntry);
  } catch {
    return [];
  }
}

function isMoodEntry(v: unknown): v is MoodEntry {
  if (!v || typeof v !== 'object') return false;
  const r = v as Record<string, unknown>;
  return (
    typeof r.id === 'string' &&
    typeof r.assetId === 'string' &&
    typeof r.tone === 'string' &&
    typeof r.text === 'string' &&
    typeof r.createdAt === 'string'
  );
}

async function writeEntries(assetId: string, entries: MoodEntry[]): Promise<void> {
  await AsyncStorage.setItem(storageKey(assetId), JSON.stringify(entries));
}

export const useMoodJournalStore = create<MoodJournalStore>((set, get) => ({
  entriesByAsset: {},
  hydrated: false,

  hydrate: async (assetId) => {
    const entries = await readEntries(assetId);
    set((s) => ({
      entriesByAsset: { ...s.entriesByAsset, [assetId]: entries },
      hydrated: true,
    }));
  },

  add: async (assetId, tone, text) => {
    const entry: MoodEntry = {
      id: uuid(),
      assetId,
      tone,
      text,
      createdAt: nowIso(),
    };
    const next = [entry, ...get().entriesFor(assetId)];
    await writeEntries(assetId, next);
    set((s) => ({
      entriesByAsset: { ...s.entriesByAsset, [assetId]: next },
    }));
    return entry;
  },

  remove: async (assetId, id) => {
    const next = get().entriesFor(assetId).filter((e) => e.id !== id);
    await writeEntries(assetId, next);
    set((s) => ({
      entriesByAsset: { ...s.entriesByAsset, [assetId]: next },
    }));
  },

  entriesFor: (assetId) => get().entriesByAsset[assetId] ?? [],
}));
