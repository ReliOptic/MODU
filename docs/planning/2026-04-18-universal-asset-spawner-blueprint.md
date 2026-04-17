# [Design] Universal Asset Spawner & Blueprint Engine

- Status: **PROPOSAL**
- Updated: 2026-04-18
- Goal: Enable "Zero-Code Asset Expansion" via AI-generated Blueprints and a Local Runtime Engine.

---

## 1. Core Philosophy: "Architect LLM, Runtime Engine"

- **Architect (LLM)**: Analyzes user intent, defines the chapter's structure (Blueprint), and selects the right tools (Moments). (High-latency, Occasional)
- **Engine (Local)**: Interprets the Blueprint, monitors TPO signals, and re-ranks Moments in real-time. (Zero-latency, Persistent)

---

## 2. AI-to-App Contract (JSON Schema)

The AI must output a JSON object following the `AssetBlueprint` interface defined in `src/types/asset.ts`.

### 2.1 Schema Definition
```typescript
interface AssetBlueprint {
  envelope: 'E1' | 'E2' | 'E3' | 'E4'; // Compliance and UI Tone
  moments: {
    type: string; // e.g., 'core.value', 'core.step'
    defaultPriority: number; // 0-100
    props: Record<string, any>; // Component-specific configuration
    tab?: string; // Target tab ID (default: 'home')
  }[];
  tpoRules: {
    trigger: 'time' | 'place' | 'occasion';
    condition: string; // DSL for rules (e.g., "08:00-10:00", "geo:hospital")
    action: 'rank_up' | 'rank_down' | 'hide' | 'highlight';
    targetMoment: string;
  }[];
  initialDisplayName: string;
}
```

---

## 3. Moment Engine Implementation Details

### 3.1 Registry Pattern
The `HomeTab` uses `WIDGET_REGISTRY` to map string types to React components. This allows adding new Moments by simply registering them, without touching the layout engine.

### 3.2 Dynamic Props Injection
The engine must prioritize `blueprint.moments[i].props` over hardcoded mock data.
- **Priority 1**: `asset.widgets[i].props` (stored in DB)
- **Priority 2**: AI-generated defaults in `blueprint`
- **Priority 3**: Hardcoded mock data (for legacy fallback)

---

## 4. Local TPO Ranker Algorithm

To ensure zero-latency, the ranking logic must be deterministic and run on the device.

1. **Base Score**: Start with `defaultPriority` (e.g., 50).
2. **Signal Check**: Monitor current `Time`, `Geolocation`, and `Phase`.
3. **Rule Application**:
   - If `TPORule.condition` is met:
     - `rank_up`: score += 20
     - `rank_down`: score -= 20
     - `highlight`: score = 100
     - `hide`: score = -1 (filter out)
4. **Sort & Render**: Sort moments by final score and render in `TimeRiver`.

---

## 5. Implementation Roadmap for Claude Code (Integration Guide)

### Task 1: Complete Atomic Moments (The Toolbox)
- [ ] `core.narrative`: Generic note/photo logger.
- [ ] `core.step`: Generic milestone/checklist tracker.
- [ ] `core.glance`: Generic summary/stat dashboard.

### Task 2: Asset Spawner Bridge
- [ ] Create a Supabase Edge Function `ai-spawner`.
- [ ] Implement model-agnostic routing (Gemma/Claude/OpenRouter).
- [ ] System Prompt: "You are the MODU Asset Architect. Output ONLY the AssetBlueprint JSON."

### Task 3: Local Persistence Wiring
- [ ] Ensure `AssetRepository` saves the full `blueprint` object.
- [ ] Update `useWidgetOrder` hook to consume `blueprint.tpoRules`.

---

## 6. Regulatory & Privacy Note
The `envelope` field dictates the security level:
- **E4 (Medical)**: The engine triggers Bio-Auth on open and enables stricter data deletion policies.
- **E1 (General)**: Focuses on engagement and interactive feedback.

---

## 7. Model Flexibility
The architecture is model-agnostic. 
- **Low-cost/Private**: Local Gemma via WebGPU or mobile-native runtime.
- **High-reasoning**: Anthropic Claude or OpenAI GPT via Edge Proxy.
The `ai-spawner` endpoint acts as the single gateway, hiding model complexity from the React Native frontend.
