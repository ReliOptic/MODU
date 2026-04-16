# ADR-0011: Local-First Persistence — 디바이스 저장 우선, 클라우드는 sync 옵션

- Status: **Proposed**
- Date: 2026-04-17
- Related: ADR-0001 (Supabase) · ADR-0003 (Memory-First) · ADR-0012 (Gemma routing)

## Context

부트스트래핑 단계에서 비용·신뢰·오프라인 가용성 모두를 동시에 풀어야 한다. 다음 사실이 결정 근거:

- v1 사용자 대다수는 **단일 디바이스 + 단일 사용자** 시나리오
- 의료 데이터 신뢰의 핵심 = "내 폰에 있다" 의 안정감
- Supabase 가용성·비용은 사용자 수에 linear → 1만 MAU 까지는 cloud 필수성 X
- 병원·지하·해외 등 *오프라인 환경*이 의료 카테고리에서 빈번
- Gemma 3 등 self-host LLM 도입 시 (ADR-0012) 데이터를 디바이스에서 처리할수록 latency·비용 양쪽 우위

## Decision

**모든 사용자 데이터는 디바이스 저장이 primary, cloud sync 는 opt-in option.**

```
Local (primary)
  ├─ AsyncStorage / expo-sqlite (Postgres 호환 schema)
  │   ├─ assets, chapter_memories, scheduled_events, partner_links
  │   ├─ profile (preferences, locks)
  │   └─ context_hints (Gemma local inference 결과)
  └─ R2 / iOS Photo Library (사진 — 로컬 캐시 + 선택 cloud)

Cloud Sync (opt-in)
  ├─ Supabase (ADR-0001 그대로) — 사용자가 명시 동의 시
  ├─ 멀티 디바이스 / 파트너 sync 필요 시만 ON
  └─ 동기화 키는 사용자 디바이스에서만 생성 (E2EE 가능 옵션)
```

### 구현 (Phase 1 — 즉시 적용)
- `zustand` persist middleware + `@react-native-async-storage/async-storage`
- `assetStore`, `chapterMemoryStore`, `formationStore`, `demoMode panel` state 모두 persist
- 마이그레이션은 store version 필드로 관리 (`v1`, `v2` …)

### 구현 (Phase 2 — 100K MAU 또는 사용자 요청 시)
- `expo-sqlite` 또는 `op-sqlite` 로 schema 화 (timeline 쿼리·검색 위해)
- 같은 schema 가 Postgres (Supabase) 와 1:1 매핑되도록 (ADR-0003)
- Sync engine: timestamp-based last-write-wins (단일 사용자) 또는 CRDT (파트너)

### 구현 (Phase 3 — 글로벌 성장)
- Cloud sync 의 default 가 OFF 인 채로도 동작
- 사용자가 sync 켜면 Supabase 에 push, 백그라운드 incremental
- 가족·파트너 공유 기능은 sync ON 선결조건

## Consequences

### 긍정
- **비용 곡선 평탄화**: 1만 MAU 까지 backend 비용 거의 0
- **오프라인 친화**: 병원·지하 환경에서도 모든 기능 작동
- **신뢰 강화**: "내 데이터가 내 폰에" 메시지 = 마케팅 자산 (ADR-0005)
- **Gemma local inference 와 시너지**: 데이터 이동 없이 디바이스에서 분석 가능
- **GDPR/PIPA 단순화**: 데이터 이동이 적을수록 컴플라이언스 부담 ↓

### 부정 / 트레이드오프
- 디바이스 분실 = 데이터 분실 (사용자가 backup export 하지 않으면)
- 멀티 디바이스 사용자 (폰+태블릿+웹) UX 가 첫 sync 켤 때까지 분리됨
- 파트너 sync 가 sync ON 의존 (즉, 무료 사용자는 파트너 X — 자연 paywall)

### 완화책
- 첫 진입 시 *"내보내기 권장"* 안내 (1주 후, 또는 5개 챕터 만든 후)
- iCloud Drive / Google Drive 자동 backup 옵션 (Phase 2)
- 기기 변경 시 QR 또는 6자리 pairing 코드로 secure transfer

## Rejected Alternatives

| 옵션 | 거절 이유 |
|------|-----------|
| Cloud-only (현 ADR-0001 default) | 비용 linear, 오프라인 X, 신뢰 메시지 약함 |
| Local-only without sync option | 멀티 디바이스 사용자 영구 차단, 파트너 기능 불가 |
| Cloud-first + local cache | local 이 stale 가능, "내 데이터가 내 폰에" 메시지 약함 |

## References

- ADR-0001 Backend Platform (Supabase 그대로 — sync target 으로)
- ADR-0003 Memory-First Data Model (schema 동일 적용)
- ADR-0005 Privacy as Moat (local-first 가 privacy 약속의 강한 구현)
- ADR-0012 Gemma 3 Routing (local LLM inference 와 시너지)
