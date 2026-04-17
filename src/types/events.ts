// MODU Phase 1 event type definitions.
//
// Companion to docs/data/2026-04-17-phase-1-event-schema.md. The schema
// doc is authoritative for purpose, envelope, and sensitivity rationale;
// this file is the compiled surface that keeps runtime and schema in
// lockstep.
//
// Event authors pass only event-specific properties to the emission
// helper (future src/lib/events.ts). The helper auto-populates every
// EventBase field plus `sensitivity` and `regulatory_envelope` from
// EVENT_REGISTRY so the schema doc and the runtime agree by construction.

export type Locale =
  | 'en-US'
  | 'ko-KR'
  | 'en-CA'
  | 'fr-CA'
  | 'ja-JP'
  | 'de-DE'
  | 'fr-FR';

export type DeviceClass = 'ios' | 'android' | 'web';

export type Role = 'self' | 'partner' | 'caregiver';

export type Sensitivity = 'S1' | 'S2' | 'S3' | 'S4';

export type RegulatoryEnvelope = 'E1' | 'E2' | 'E3' | 'E4';

/** Properties attached to every event. */
export interface EventBase {
  /** UUID v4 per event instance. */
  id: string;
  /** ISO-8601 UTC. */
  occurred_at: string;
  /** Per-session UUID. Does not persist across launches. */
  session_id: string;
  /** Active chapter (Asset.id), if any. */
  asset_id?: string;
  /** Acting role at the moment of emission, if applicable. */
  role?: Role;
  /** BCP-47 locale at the moment of emission. */
  locale: Locale;
  /** IANA timezone at the moment of emission. */
  tz: string;
  /** Device class. */
  device_class: DeviceClass;
  /** Populated from EVENT_REGISTRY by the emission helper. Do not override. */
  sensitivity: Sensitivity;
  /** Populated from EVENT_REGISTRY by the emission helper. Do not override. */
  regulatory_envelope: RegulatoryEnvelope;
}

// ---------------------------------------------------------------------------
// Session (S1 / E2)
// ---------------------------------------------------------------------------

export interface SessionStartedEvent extends EventBase {
  name: 'session_started';
  properties: {
    tz_offset_minutes: number;
    cold_start: boolean;
  };
}

export interface SessionEndedEvent extends EventBase {
  name: 'session_ended';
  properties: {
    duration_ms: number;
    last_screen?: string;
  };
}

export interface AppForegroundEvent extends EventBase {
  name: 'app_foreground';
  properties: Record<string, never>;
}

export interface AppBackgroundEvent extends EventBase {
  name: 'app_background';
  properties: Record<string, never>;
}

// ---------------------------------------------------------------------------
// Navigation (S1 / E2)
// ---------------------------------------------------------------------------

export interface TabViewedEvent extends EventBase {
  name: 'tab_viewed';
  properties: {
    tab_id: string;
    from_tab_id?: string;
    dwell_ms_on_prev?: number;
  };
}

export interface ScreenViewedEvent extends EventBase {
  name: 'screen_viewed';
  properties: {
    screen_id: string;
    /** SHA-256 of route params; never raw. */
    route_params_hash?: string;
  };
}

// ---------------------------------------------------------------------------
// Chapter lifecycle (S3 / E3)
// ---------------------------------------------------------------------------

export type ChapterType = 'fertility' | 'cancer_caregiver' | 'pet_care' | 'chronic' | 'custom';

export interface ChapterCreatedEvent extends EventBase {
  name: 'chapter_created';
  properties: {
    type: ChapterType;
  };
}

export interface ChapterSwitchedEvent extends EventBase {
  name: 'chapter_switched';
  properties: {
    from_asset_id?: string;
    to_asset_id: string;
  };
}

export interface ChapterArchivedEvent extends EventBase {
  name: 'chapter_archived';
  properties: {
    days_active: number;
  };
}

export interface ChapterRehydratedEvent extends EventBase {
  name: 'chapter_rehydrated';
  properties: {
    hours_since_last_activity: number;
  };
}

// ---------------------------------------------------------------------------
// Memory (S3 / E3)
// ---------------------------------------------------------------------------

export type MemoryKind = 'note' | 'mood' | 'photo' | 'event' | 'partner_reflection';
export type LengthBucket = 's' | 'm' | 'l';
export type AgeBucket = 'd' | 'w' | 'm' | 'q' | 'y' | 'y+';

export interface ChapterMemoryCreatedEvent extends EventBase {
  name: 'chapter_memory_created';
  properties: {
    memory_id: string;
    kind: MemoryKind;
    has_photo: boolean;
    length_bucket: LengthBucket;
  };
}

export interface ChapterMemoryViewedEvent extends EventBase {
  name: 'chapter_memory_viewed';
  properties: {
    memory_id: string;
    age_days_bucket: AgeBucket;
  };
}

export interface MemoryGlanceShownEvent extends EventBase {
  name: 'memory_glance_shown';
  properties: {
    memory_id: string;
    age_years: number;
  };
}

// ---------------------------------------------------------------------------
// Care event (S3 / E3)
// ---------------------------------------------------------------------------

export type CareEventType =
  | 'transfer'
  | 'injection'
  | 'retrieval'
  | 'chemo'
  | 'visit'
  | 'medication'
  | 'vet_visit'
  | 'consultation';

export type EventPhase = 'before' | 'during' | 'after';

export interface EventLoggedEvent extends EventBase {
  name: 'event_logged';
  properties: {
    event_type: CareEventType;
    phase_at_log: EventPhase;
  };
}

export interface PhaseTransitionObservedEvent extends EventBase {
  name: 'phase_transition_observed';
  properties: {
    event_id: string;
    from_phase: EventPhase | 'none';
    to_phase: EventPhase | 'none';
    observed_at: string;
  };
}

// ---------------------------------------------------------------------------
// Moment lifecycle (S2 / E3)
// ---------------------------------------------------------------------------

export type MomentSlot = 'skin' | 'glance' | 'hero' | 'row' | 'floating';

export interface MomentExposedEvent extends EventBase {
  name: 'moment_exposed';
  properties: {
    moment_id: string;
    variant: string;
    slot: MomentSlot;
    /** SHA-256 of serialized signal context. Never raw signals. */
    signals_hash: string;
  };
}

export interface MomentTappedEvent extends EventBase {
  name: 'moment_tapped';
  properties: {
    moment_id: string;
    variant: string;
    slot: MomentSlot;
    latency_ms: number;
  };
}

export interface MomentDwelledEvent extends EventBase {
  name: 'moment_dwelled';
  properties: {
    moment_id: string;
    dwell_ms: number;
  };
}

export interface MomentDismissedEvent extends EventBase {
  name: 'moment_dismissed';
  properties: {
    moment_id: string;
    via: 'swipe' | 'button' | 'context';
  };
}

export interface MomentResultedMemoryEvent extends EventBase {
  name: 'moment_resulted_memory';
  properties: {
    moment_id: string;
    memory_id: string;
    latency_ms: number;
  };
}

// ---------------------------------------------------------------------------
// Partner / caregiver (S4 / E4)
// ---------------------------------------------------------------------------

export type RoleGrant = 'partner' | 'caregiver';

/** Enumerated delegated actions. Free text is intentionally not allowed. */
export type DelegatedActionKind =
  | 'memory_append'
  | 'event_confirm'
  | 'photo_attach'
  | 'role_change_acknowledge';

export interface PartnerInvitedEvent extends EventBase {
  name: 'partner_invited';
  properties: {
    role_offered: RoleGrant;
  };
}

export interface PartnerLinkedEvent extends EventBase {
  name: 'partner_linked';
  properties: {
    /** Opaque link hash. Never email, name, phone, or any PII. */
    partner_id: string;
    role_granted: RoleGrant;
  };
}

export interface PartnerRevokedEvent extends EventBase {
  name: 'partner_revoked';
  properties: {
    partner_id: string;
    revoked_by_role: Role;
  };
}

export interface RoleChangedEvent extends EventBase {
  name: 'role_changed';
  properties: {
    partner_id: string;
    from_role: Role;
    to_role: Role;
  };
}

export interface DelegatedActionEvent extends EventBase {
  name: 'delegated_action';
  properties: {
    partner_id: string;
    action: DelegatedActionKind;
    audit_id: string;
  };
}

// ---------------------------------------------------------------------------
// Consent / sync (mixed S / E by purpose)
// ---------------------------------------------------------------------------

export type ConsentItem = 'local_default' | 'sync_future' | 'aggregate_research';
export type ConsentDecision = 'acknowledged' | 'declined';

export interface ConsentScreenShownEvent extends EventBase {
  name: 'consent_screen_shown';
  properties: {
    screen_version: string;
  };
}

export interface ConsentDecisionRecordedEvent extends EventBase {
  name: 'consent_decision_recorded';
  properties: {
    item: ConsentItem;
    decision: ConsentDecision;
    decided_at: string;
  };
}

export interface SyncInvitationShownEvent extends EventBase {
  name: 'sync_invitation_shown';
  properties: {
    bonding_score: number;
    trigger_reason: string;
  };
}

export interface SyncInvitationAcceptedEvent extends EventBase {
  name: 'sync_invitation_accepted';
  properties: Record<string, never>;
}

export interface SyncInvitationDismissedEvent extends EventBase {
  name: 'sync_invitation_dismissed';
  properties: Record<string, never>;
}

// ---------------------------------------------------------------------------
// System (S1)
// ---------------------------------------------------------------------------

export interface ErrorRaisedEvent extends EventBase {
  name: 'error_raised';
  properties: {
    error_code: string;
    screen_id?: string;
    retry_attempted: boolean;
  };
}

export interface PerformanceMarkEvent extends EventBase {
  name: 'performance_mark';
  properties: {
    mark_name: string;
    value_ms: number;
  };
}

export interface LocaleChangedEvent extends EventBase {
  name: 'locale_changed';
  properties: {
    from_locale: Locale;
    to_locale: Locale;
  };
}

// ---------------------------------------------------------------------------
// Discriminated union + name alias
// ---------------------------------------------------------------------------

export type MoguEvent =
  | SessionStartedEvent
  | SessionEndedEvent
  | AppForegroundEvent
  | AppBackgroundEvent
  | TabViewedEvent
  | ScreenViewedEvent
  | ChapterCreatedEvent
  | ChapterSwitchedEvent
  | ChapterArchivedEvent
  | ChapterRehydratedEvent
  | ChapterMemoryCreatedEvent
  | ChapterMemoryViewedEvent
  | MemoryGlanceShownEvent
  | EventLoggedEvent
  | PhaseTransitionObservedEvent
  | MomentExposedEvent
  | MomentTappedEvent
  | MomentDwelledEvent
  | MomentDismissedEvent
  | MomentResultedMemoryEvent
  | PartnerInvitedEvent
  | PartnerLinkedEvent
  | PartnerRevokedEvent
  | RoleChangedEvent
  | DelegatedActionEvent
  | ConsentScreenShownEvent
  | ConsentDecisionRecordedEvent
  | SyncInvitationShownEvent
  | SyncInvitationAcceptedEvent
  | SyncInvitationDismissedEvent
  | ErrorRaisedEvent
  | PerformanceMarkEvent
  | LocaleChangedEvent;

export type EventName = MoguEvent['name'];

// ---------------------------------------------------------------------------
// Sensitivity / envelope registry
// ---------------------------------------------------------------------------

/**
 * Static mapping from event name to its sensitivity class and
 * regulatory envelope. The emission helper reads this to populate
 * `sensitivity` and `regulatory_envelope` on every event, so the schema
 * doc and runtime cannot drift.
 *
 * Adding a new event requires (1) extending MoguEvent, (2) registering
 * here, (3) updating docs/data/2026-04-17-phase-1-event-schema.md with
 * purpose + power.
 */
export const EVENT_REGISTRY: Record<EventName, { sensitivity: Sensitivity; envelope: RegulatoryEnvelope }> = {
  // Session
  session_started:            { sensitivity: 'S1', envelope: 'E2' },
  session_ended:              { sensitivity: 'S1', envelope: 'E2' },
  app_foreground:             { sensitivity: 'S1', envelope: 'E2' },
  app_background:             { sensitivity: 'S1', envelope: 'E2' },
  // Navigation
  tab_viewed:                 { sensitivity: 'S1', envelope: 'E2' },
  screen_viewed:              { sensitivity: 'S1', envelope: 'E2' },
  // Chapter lifecycle
  chapter_created:            { sensitivity: 'S3', envelope: 'E3' },
  chapter_switched:           { sensitivity: 'S3', envelope: 'E3' },
  chapter_archived:           { sensitivity: 'S3', envelope: 'E3' },
  chapter_rehydrated:         { sensitivity: 'S3', envelope: 'E3' },
  // Memory
  chapter_memory_created:     { sensitivity: 'S3', envelope: 'E3' },
  chapter_memory_viewed:      { sensitivity: 'S3', envelope: 'E3' },
  memory_glance_shown:        { sensitivity: 'S3', envelope: 'E3' },
  // Care event
  event_logged:               { sensitivity: 'S3', envelope: 'E3' },
  phase_transition_observed:  { sensitivity: 'S3', envelope: 'E3' },
  // Moment lifecycle
  moment_exposed:             { sensitivity: 'S2', envelope: 'E3' },
  moment_tapped:              { sensitivity: 'S2', envelope: 'E3' },
  moment_dwelled:             { sensitivity: 'S2', envelope: 'E3' },
  moment_dismissed:           { sensitivity: 'S2', envelope: 'E3' },
  moment_resulted_memory:     { sensitivity: 'S2', envelope: 'E3' },
  // Partner / caregiver
  partner_invited:            { sensitivity: 'S4', envelope: 'E4' },
  partner_linked:             { sensitivity: 'S4', envelope: 'E4' },
  partner_revoked:            { sensitivity: 'S4', envelope: 'E4' },
  role_changed:               { sensitivity: 'S4', envelope: 'E4' },
  delegated_action:           { sensitivity: 'S4', envelope: 'E4' },
  // Consent / sync
  consent_screen_shown:       { sensitivity: 'S1', envelope: 'E2' },
  consent_decision_recorded:  { sensitivity: 'S4', envelope: 'E4' },
  sync_invitation_shown:      { sensitivity: 'S1', envelope: 'E2' },
  sync_invitation_accepted:   { sensitivity: 'S1', envelope: 'E2' },
  sync_invitation_dismissed:  { sensitivity: 'S1', envelope: 'E2' },
  // System
  error_raised:               { sensitivity: 'S1', envelope: 'E2' },
  performance_mark:           { sensitivity: 'S1', envelope: 'E1' },
  locale_changed:             { sensitivity: 'S1', envelope: 'E2' },
};
