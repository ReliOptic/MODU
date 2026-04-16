# ADR-0003: Memory-First Data Model — Chapter as primary container

- Status: **Proposed**
- Date: 2026-04-17
- Related: ADR-0001, PROJECT_SPEC §5

## Context

기존 DB schema (PROJECT_SPEC §5.1) 은 위젯 데이터 store 중심이다:
`assets ↔ widget_data (key/value JSONB) ↔ mood_logs ↔ formation_logs`.

이 구조는 위젯 한 개 단위 저장에는 빠르지만, **사용자의 "삶의 의료 기억"** 을 timeline 으로 재구성하기 어렵다.
또한 챕터 archive / restore / export 가 위젯별 fan-out 이라 비싸다.

복리 자산 분석(`docs/strategy/moats-2026-04-17.md`) 결론:
- MODU 의 가장 강한 해자 = **개인 의료 기억 + 챕터 라이브러리 + 가족 네트워크**
- 따라서 schema 의 1순위 시민은 **ChapterMemory** (timeline 단위 narrative event) 여야 한다

## Decision

primary entity 를 다음과 같이 재정의:

```
Asset (= 한 챕터)
  ├─ id, owner_user_id, type, palette, status, photo_uri, ...
  ├─ tabs JSONB, widgets JSONB, layout_rules JSONB    -- UI config
  ├─ formation_data JSONB                              -- 사용자 컨텍스트
  └─ events ScheduledEvent[]                           -- 시간 기반 일정

ChapterMemory  (NEW — 1:N from Asset, immutable append-only)
  ├─ id, asset_id, kind, occurred_at, created_at
  ├─ kind: 'visit_memo' | 'medication_log' | 'mood_log' | 'photo' |
  │        'pdf_attachment' | 'ai_distill' | 'milestone' | 'note'
  ├─ payload JSONB                                     -- kind 에 따라 schema 분기
  ├─ ai_summary TEXT                                   -- 검색·재생산용
  ├─ visibility: 'self' | 'partners' | 'doctor'
  └─ origin: 'manual' | 'voice' | 'photo_ocr' | 'partner' | 'ai'

PartnerLink     (asset_id, partner_user_id, role, scope JSONB)
ChapterArchive  (asset_id, archived_at, snapshot JSONB)  -- 챕터 종료 시 immutable 사본
MediaArtifact   (id, asset_id, memory_id, r2_key, mime, ocr_text, exif JSONB)
AiCallLog       (intent, asset_id, tokens, cache_hit, redacted_input, output_summary)
```

### 핵심 규칙
1. **append-only**: ChapterMemory 는 수정 불가, 정정 시 새 row + `corrects_id` 링크
2. **timeline-first 쿼리**: `SELECT * FROM chapter_memories WHERE asset_id=$1 ORDER BY occurred_at DESC` 가 모든 화면의 베이스
3. **위젯은 view**: 위젯은 ChapterMemory 의 derived projection (예: InjectionTimeline = `kind='medication_log'` filter)
4. **Archive = snapshot**: 에셋이 archived 되면 ChapterArchive 에 JSON snapshot 으로 freeze (영구 보존)
5. **Partner visibility per memory**: 파트너 동기화는 row-level. 사용자가 per-memo 토글 가능
6. **AI 입력은 항상 timeline slice**: LLM 호출 시 최근 N개 ChapterMemory 만 컨텍스트로

## Consequences

### 긍정
- 사용자가 떠날 때 잃는 것이 명확 → moat 작동
- 챕터 export = 단일 SQL dump
- AI 가 "5년 누적" 활용 가능 (timeline slice 로 컨텍스트)
- 위젯 추가/삭제가 데이터 손실 없이 가능
- 파트너 권한 = row-level (보안·UX 양면 명확)

### 부정
- 단순 위젯 케이스에 약간의 over-engineering
- ChapterMemory.payload 의 JSONB schema 검증을 앱 layer 에서 해야 함 (Postgres schema 미강제)
- search 가 무거워지면 별도 인덱싱 (pg_trgm 또는 외부 검색)

## Rejected Alternatives

| 옵션 | 거절 이유 |
|------|-----------|
| 기존 위젯 store 그대로 | timeline / archive / AI 입력 모두 비싼 fan-in 필요 |
| Event Sourcing 풀 적용 | 1인 개발자가 운영하기 무거움. append-only ChapterMemory 로 80% 효과 |
| NoSQL document store | 파트너 권한 RLS / 관계형 쿼리에 약함 |

## References

- CPO Review §3.3, §3.4
- 복리 해자 분석 — Personal Medical Memory 가 #1
