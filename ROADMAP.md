# MODU — Mobile Launch Roadmap

> 2026-04-17 기준 · CPO Review §5 + ADR 시리즈 통합본
> 단일 source of truth. 변경 시 commit message 에 `docs(roadmap): ...` 필수.

## 의사결정 기준선 (Locked)

- **Backend**: Supabase (Seoul) + Cloudflare R2 (ADR-0001)
- **AI**: Claude API via Supabase Edge Function (ADR-0002)
- **Data Model**: Memory-First (ChapterMemory 중심) (ADR-0003)
- **출시 카테고리**: Fertility 단독 v1 (ADR-0004) ← *founder confirm 대기*
- **Privacy**: Marketing moat 수준 (ADR-0005)
- **수익 모델**: Freemium + Plus(₩5,900/mo) + Family(₩11,900/mo) — *ADR-0006 예정*
- **타겟**: KR 선공, US/EU 는 v3 이후 — *ADR-0007 예정*

## Phase 0 — 기반 (4-6주)

| 항목 | 상태 | 비고 |
|------|------|------|
| Expo iOS/Android EAS Build 파이프라인 | ⏳ | `eas init` 만 필요 (RELEASE.md) |
| Supabase 프로젝트 생성 + Seoul region | ⏳ | |
| schema (ADR-0003) 적용 + RLS 정책 | ⏳ | |
| Auth: Apple / Google / Email magic | ⏳ | Apple 필수 (App Store 정책) |
| 디자인 토큰 v2 (semantic + dark mode) | ⏳ | CPO §3.5 |
| Sentry + PostHog (opt-in) | ⏳ | |
| WelcomeScreen + 첫 챕터 birth ritual | 🟡 | 코드 작성됨, 통합 대기 (ADR-0004 확정 후) |
| Mock 에셋 시드 → dev flag 로 분리 | ✅ | `EXPO_PUBLIC_SEED_DEMO=1` |

## Phase 1 — IA 완성 (Fertility 한정, 6-8주)

| 탭 | 핵심 위젯 | 상태 |
|------|-----------|------|
| 홈 | PrimaryEvent + InjectionTimeline + MoodQuickLog + PartnerSync | ✅ V2 엔진 |
| 달력 | 월/주/리스트, 항목 상세, 드래그 reschedule | ⏳ |
| 감정 | 히트맵, 약↔감정 상관, 노트, per-row 파트너 공유 토글 | ⏳ |
| 파트너 | 초대 플로우, scope 설정, 파트너 알림 취향 | ⏳ |
| 설정 | 계정, 알림, 에셋 관리, export, privacy 대시보드 | ⏳ |
| 온보딩 | WelcomeScreen → privacy 동의 → Formation → birth ritual | 🟡 |
| 빈/에러/로딩 상태 표준화 | — | ⏳ |

## Phase 2 — 플랫폼 네이티브 (6-8주)

| 역량 | iOS | Android |
|------|-----|---------|
| Push + 로컬 리마인더 (반복·스누즈·조건부) | APNs | FCM |
| Lock-screen 위젯 (Hero D-day 카드) | WidgetKit | Glance |
| Live Activity (다음 주사 카운트다운) | Dynamic Island | Ongoing Activity |
| 생체 인증 (default ON 권유) | Face ID | BiometricPrompt |
| HealthKit / Health Connect | sync 월경 주기·수면·심박 | |
| 캘린더 연동 | EventKit | CalendarContract |
| 사진/PDF OCR (진단서·처방전) | VisionKit | ML Kit |
| 오프라인 우선 로깅 + 타임스탬프 머지 | — | — |

## Phase 3 — 공유/파트너 (4주)

- 초대 플로우 (계정 필수 vs 게스트 링크 — ADR 결정 필요)
- 권한 행렬 UI (읽기 / 쓰기 / 알림만)
- 실시간 sync (Supabase Realtime)
- 통합 알림 인박스 (멀티 에셋 알림 모음)
- 공유 로그 (누가 언제 무엇을 봤나)

## Phase 4 — 출시 준비 (4주)

- Privacy Nutrition Labels / Data Safety 작성
- KR PIPA 민감정보 동의 inline UX
- 식약처 의료기기 SW 자문 의뢰 (복약 알림 해석)
- 의료 디스클레이머 톤앤매너 확정 (ADR-0008 예정)
- App Store / Play 자료 (5초 후킹 영상 + 카테고리별 스크린샷)
- TestFlight + Play Internal 베타 (50명)
- KR 의료 인플루언서/난임 커뮤니티 베타

## Phase 5 — 출시 이후

- Apple Watch / Wear OS 동반앱 (주사 완료 한 탭)
- AI 인사이트 v2 (감정-약물 상관관계)
- 진료 리포트 OCR + PDF export
- v2 카테고리 확장: chronic (만성질환) → cancer_caregiver → pet_care 순

## 의사결정 블로커 (CPO §6)

| # | 결정 사항 | 상태 | 비고 |
|---|-----------|------|------|
| 1 | 단일 vs 다중 에셋 출시 | 🟡 ADR-0004 proposed | founder confirm 대기 |
| 2 | 수익 모델·가격 | 🟡 초안 (₩5,900 / ₩11,900) | ADR-0006 예정 |
| 3 | 타겟 국가 | 🟡 KR 선공 권고 | ADR-0007 |
| 4 | 파트너 동기화 모델 | ⏳ | 계정 필수 vs 게스트 링크 |
| 5 | 의료 디스클레이머 톤 | ⏳ | 식약처 자문 결과 의존 |
| 6 | 데이터 삭제 정책 | 🟢 ADR-0005 즉시 파기 결정 | 단, archive 사용자 keep 옵션 |

## 기술 부채 / 즉시 패치 (CPO 부록 반영)

- [x] mock 에셋 default OFF — `EXPO_PUBLIC_SEED_DEMO` flag
- [ ] 빈 탭 placeholder 카피 개선 (외부 빌드에서 제거 또는 "Coming soon" + 알림 신청)
- [ ] viewport `user-scalable=no` 검토 — 접근성 (Dynamic Type) 고려해 변경 가능성
- [ ] 모든 Pressable 에 accessibilityLabel + accessibilityHint
- [ ] 다크 모드 토큰 (palette[*].dark variant)
- [ ] `react-native-safe-area-context` 모든 화면 적용 (현재 일부만)

## 참조

- `docs/reviews/2026-04-17-cpo-review.md` — 외부 CPO review 원문
- `docs/adr/` — 모든 architecture decisions
- `PROJECT_SPEC.md` — 제품 비전 (멀티에셋 풀 그림)
- `CLAUDE.md` — Claude Code 세션 가이드
