// Supabase generated types placeholder.
// 실제 사용 시: `supabase gen types typescript --project-id <ref> > src/lib/database.types.ts`
// 본 파일은 schema.sql 와 1:1 수동 매핑된 최소 타입 (CI 까지의 brigade).

export type Json = string | number | boolean | null | { [k: string]: Json } | Json[];

export type AssetType = 'fertility' | 'cancer_caregiver' | 'pet_care' | 'chronic' | 'custom';
export type AssetStatus = 'forming' | 'active' | 'archived';
export type PaletteKey = 'dawn' | 'mist' | 'blossom' | 'sage' | 'dusk';
export type MemoryKind =
  | 'visit_memo'
  | 'medication_log'
  | 'mood_log'
  | 'photo'
  | 'pdf_attachment'
  | 'ai_distill'
  | 'milestone'
  | 'note';
export type MemoryVisibility = 'self' | 'partners' | 'doctor';
export type EventType =
  | 'transfer'
  | 'injection'
  | 'retrieval'
  | 'chemo'
  | 'visit'
  | 'medication'
  | 'vet_visit'
  | 'consultation';
export type PartnerRole = 'primary_caregiver' | 'observer' | 'doctor' | 'family';

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          display_name: string | null;
          voice_enabled: boolean;
          biometric_lock: boolean;
          analytics_opt_in: boolean;
          data_residency: string;
          ai_calls_this_month: number;
          ai_quota_reset_at: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database['public']['Tables']['profiles']['Row']> & { id: string };
        Update: Partial<Database['public']['Tables']['profiles']['Row']>;
      };
      assets: {
        Row: {
          id: string;
          owner_user_id: string;
          type: AssetType;
          display_name: string;
          palette: PaletteKey;
          status: AssetStatus;
          photo_uri: string | null;
          tabs: Json;
          widgets: Json;
          layout_rules: Json;
          formation_data: Json;
          created_at: string;
          last_active_at: string;
          archived_at: string | null;
        };
        Insert: Omit<Database['public']['Tables']['assets']['Row'], 'id' | 'created_at' | 'last_active_at'> & {
          id?: string;
        };
        Update: Partial<Database['public']['Tables']['assets']['Row']>;
      };
      chapter_memories: {
        Row: {
          id: string;
          asset_id: string;
          kind: MemoryKind;
          occurred_at: string;
          payload: Json;
          ai_summary: string | null;
          visibility: MemoryVisibility;
          origin: string;
          corrects_id: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['chapter_memories']['Row'], 'id' | 'created_at'> & {
          id?: string;
        };
        Update: Partial<Database['public']['Tables']['chapter_memories']['Row']>;
      };
      scheduled_events: {
        Row: {
          id: string;
          asset_id: string;
          type: EventType;
          at: string;
          duration_hours: number | null;
          afterglow_hours: number | null;
          title: string;
          subtitle: string | null;
          associated_widgets: string[] | null;
          created_at: string;
          cancelled_at: string | null;
        };
        Insert: Omit<Database['public']['Tables']['scheduled_events']['Row'], 'id' | 'created_at'> & {
          id?: string;
        };
        Update: Partial<Database['public']['Tables']['scheduled_events']['Row']>;
      };
      partner_links: {
        Row: {
          id: string;
          asset_id: string;
          partner_user_id: string;
          role: PartnerRole;
          scope: Json;
          invited_at: string;
          accepted_at: string | null;
        };
        Insert: Omit<Database['public']['Tables']['partner_links']['Row'], 'id' | 'invited_at'> & {
          id?: string;
        };
        Update: Partial<Database['public']['Tables']['partner_links']['Row']>;
      };
      media_artifacts: {
        Row: {
          id: string;
          asset_id: string;
          memory_id: string | null;
          r2_key: string;
          mime: string;
          size_bytes: number | null;
          ocr_text: string | null;
          exif: Json | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['media_artifacts']['Row'], 'id' | 'created_at'> & {
          id?: string;
        };
        Update: Partial<Database['public']['Tables']['media_artifacts']['Row']>;
      };
      ai_call_logs: {
        Row: {
          id: string;
          user_id: string;
          asset_id: string | null;
          intent: string;
          model: string;
          prompt_tokens: number | null;
          completion_tokens: number | null;
          cache_hit: boolean;
          redacted_input: Json | null;
          output_summary: string | null;
          latency_ms: number | null;
          status: string;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['ai_call_logs']['Row'], 'id' | 'created_at'> & {
          id?: string;
        };
        Update: Partial<Database['public']['Tables']['ai_call_logs']['Row']>;
      };
      vertical_waitlist: {
        Row: {
          id: string;
          user_id: string | null;
          vertical: AssetType;
          email: string | null;
          intent_note: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['vertical_waitlist']['Row'], 'id' | 'created_at'> & {
          id?: string;
        };
        Update: Partial<Database['public']['Tables']['vertical_waitlist']['Row']>;
      };
      chapter_archives: {
        Row: {
          id: string;
          asset_id: string;
          owner_user_id: string;
          archived_at: string;
          snapshot: Json;
          byte_size: number | null;
        };
        Insert: Omit<Database['public']['Tables']['chapter_archives']['Row'], 'id' | 'archived_at'> & {
          id?: string;
        };
        Update: Partial<Database['public']['Tables']['chapter_archives']['Row']>;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      asset_type: AssetType;
      asset_status: AssetStatus;
      palette_key: PaletteKey;
      memory_kind: MemoryKind;
      memory_visibility: MemoryVisibility;
      event_type: EventType;
      partner_role: PartnerRole;
    };
  };
}
