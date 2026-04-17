# MODU Product Grammar — 한 프로덕트의 단일 언어

작성일: 2026-04-17 (live document — 갱신 시 commit `docs(grammar): ...`)
대상: 모든 역할 (CEO / CPO / CTO / CDO / SA / Eng / Designer / 외부 advisor)
원칙: **이 문서가 곧 MODU 다.** 회의·코드·카피·외부 발표 모두 이 문법을 따른다.

> **Why this exists**
> 페르소나가 늘면 어휘가 흩어지고, 어휘가 흩어지면 의사결정이 느려진다.
> 한 프로덕트의 모든 사람이 같은 단어로 같은 것을 가리킬 때 비로소 *복리*가 시작된다.
> 이 문서는 MODU 의 모든 결정·대화·코드·카피가 따라야 하는 **단일 언어 시스템**이다.

---

## 0. 한 문장 정체성

> **MODU 는 *삶의 챕터별 기억을 쌓아가는 영구 라이브러리*다.**

어떤 삶의 구간도 챕터가 될 수 있다 — 난임·항암·수험·새 직장·마라톤·육아·부모 케어 등. MODU 는 v1 부터 horizontal metamorphic life-asset platform (ADR-0018). 단일 vertical 에 묶이지 않는다. Fertility 는 여러 asset 중 하나의 warm-start seed 다.

이 한 문장에서 다음 핵심 메타포 4개가 파생된다: **챕터 · 기억 · 라이브러리 · 동반자**.

---

## 1. Core Metaphors (7)

| 메타포 | 의미 | 등장 위치 | 안티 메타포 (쓰지 말 것) |
|--------|------|----------|--------------------------|
| **챕터 (Chapter)** | 삶의 한 구간 — 시작·진행·종결이 있는 시간 단위 | Asset 의 사용자 노출명, Birth/Archive ritual | "프로젝트", "케이스", "캠페인" |
| **기억 (Memory)** | 시간이 지나도 사라지지 않는 누적된 흔적 | ChapterMemory, MemoryGlance | "데이터", "로그", "엔트리" |
| **라이브러리 (Library)** | 챕터들의 모음. 끝난 챕터도 보존됨 | Chapter Archive, "내 서가" | "기록함", "대시보드", "히스토리" |
| **강 (River)** | 시간의 흐름. 위→과거, 아래→미래 | TimeRiver | "타임라인", "피드", "스트림" |
| **동반자 (Companion)** | MODU 자신의 정체. 함께 걸어가는 존재 | AI 응답 톤, FormationFlow 메시지 | "비서", "헬퍼", "어시스턴트" |
| **빛 (Light)** *부수* | 부드럽게 비추는 강조. 깜빡이지 않음. | AmbientPalette accent, highlight | "알림", "배지", "팝업" |
| **순간 (Moments)** *2026-04-17 추가* | AI 가 선택·조합·학습 가능한 의미 단위 (위젯 < Moment < 화면) | Moment library (ADR-0013) — **내부 전용** | "위젯", "컴포넌트" |

**노출 구분** (2026-04-17 refine): 사용자 facing 에 단어로 등장 가능 = **챕터 · 기억 · 라이브러리**. 내부 전용 (UI 라벨·카피 노출 금지) = **강 · 동반자 · 빛 · 순간**. 내부 메타포 UI 노출 금지 세부는 §4.6 참조.

**적용 룰**: 새 기능 이름을 지을 때 위 7개 메타포 중 하나에 정렬되는지 확인. 정렬 안 되면 메타포를 새로 만들기 전에 *왜 기존 7개로 안 되는지* 반증.

---

## 2. Lexicon — 핵심 용어 사전

각 항목은: **(Code Name) — 사용자 노출 카피 — 정의 — 절대 X**.

### 2.1 핵심 엔티티

| Code | User-facing 카피 | 정의 | 절대 X |
|------|-----------------|------|--------|
| `Asset` | **챕터** | 한 사용자의 한 삶의 구간 단위 — 기록할 가치 있는 모든 챕터 (수능 준비, 새 직장 적응, 마라톤 훈련, 난임 시술, 자녀 케어, 부모 부양 등) | "프로젝트", "케이스" |
| `ChapterMemory` | **기억** | 사용자가 챕터에 누적한 timeline event (메모, 약 복용, 사진, 감정, 진료 …) — append-only | "기록", "엔트리", "로그" |
| `ScheduledEvent` | **다가오는 일** / **지나간 일** | 시간 좌표가 있는 일정 (시술, 진료, 주사 등) | "이벤트", "어포인트먼트" |
| `PartnerLink` | **함께하는 사람** | 챕터를 공유하는 동반자 (배우자, 가족, 의사) | "협업자", "shared user" |
| `MediaArtifact` | **사진/문서** | 챕터에 첨부된 사진·PDF·진단서 | "파일", "어태치먼트" |
| `ChapterArchive` | **마무리된 챕터** | 종료된 챕터의 영구 보존 사본 | "삭제됨", "숨김", "지난 케이스" |

### 2.2 Ritual (의례)

MODU 에서 *Ritual* 은 사용자가 의식적 무게를 느끼는 순간이다. 일반 transition 과 구별.

| Code | User-facing 카피 | 정의 |
|------|-----------------|------|
| `Birth Ritual` | **첫 챕터가 시작됩니다** | Formation 완료 → 챕터 탄생. 1.5초 hold + 햅틱 |
| `Chapter Switch Ritual` | **○○ 챕터로 이동** | 챕터 간 전환. 920ms (fade-out 280 + ritual 360 + fade-in 280) |
| `Archive Ritual` | *(미구현)* **챕터를 마무리합니다** | 챕터 종료 시. 사용자가 마무리 한 줄 남기는 의례 |
| `Memory Glance` | **1년 전 오늘** | 같은 날 작년 ChapterMemory surfacing. 평일이 아닌 의미 있는 날만 |

### 2.3 Surface (UI 단위)

| Code | User-facing 카피 | 정의 |
|------|-----------------|------|
| `TimeRiver` | **오늘** (홈 탭 명칭) | 위→과거, 아래→미래로 흐르는 timeline. NOW 가 sticky 중심 |
| `StoryCard` | *(no label, 단지 카드)* | narrative 한 줄 + 데이터. 단순 정보 카드 X |
| `AmbientPalette` | *(보이지 않음, 배경)* | 시간·장소·phase·mood 따라 흐르는 배경 톤 |
| `NextActionPrompt` | **다음 한 걸음** | floating 한 액션 카드. zero-friction 로깅 |
| `AssetSwitcher` | *(헤더 ▾)* — **에셋 전환** | 챕터 간 이동 진입점 |

### 2.4 Process (작업·플로우)

| Code | User-facing 카피 | 정의 |
|------|-----------------|------|
| `Formation` | **첫 대화** | 새 챕터를 만드는 5스텝 인터뷰 |
| `Weekly Distill` | **이번 주의 한 줄** | 매주 일요일 새벽 AI 가 1주 ChapterMemory 요약 |
| `Layout Engine` | *(보이지 않음)* | 위젯 우선순위 재배치 — TPO 변화에 반응 |
| `Context Hints` | *(보이지 않음)* | AI 가 추출한 사용자 패턴 — 다음 렌더 input |

### 2.5 인프라 (내부 전용)

| Code | 정의 |
|------|------|
| `L1 ~ L4` | Adaptive engine 의 4-layer cache (device / hint / edge / cron) |
| `intent` | Edge Function `ai/{intent}` 호출 단위 (formation.summarize 등) |
| `palette` | 챕터 타입별 색상 토큰 (dawn/mist/blossom/sage/dusk) |
| `phase` | 이벤트의 시점 단계 (before / during / after) |
| `TPO` | Time / Place / Occasion — UI 적응 입력 신호 |
| `Moment` | Adaptive-by-Default atomic 렌더 단위 — `id · intent · slot · predicate · render · events · variants` (ADR-0013) |
| `Slot` | 화면 5영역 (`skin` / `glance` / `hero` / `row` / `floating`) — Moment 배치 공간 |
| `Signal Axes` | 네 개 축: **TPO** (Time/Place/Occasion) · **Role** (self/partner/caregiver) · **Phase** (before/during/after) · **Preference** (AI 추론). 우선순위: L0 (사용자 선언) > L1 (관측: TPO · Role · Phase) > L2 (AI 추론) — enforce, 역순 금지. 어떤 asset type 에도 동일하게 적용 (난임·수험·직장·운동·케어 등). (ADR-0018 P5) |
| `Role` | `self` / `partner` / `caregiver` / `doctor` — 렌더링 분기 1차 키 (같은 chapter · 다른 role → 다른 Moment set) |
| `Quality Contract` | Moment 렌더의 7조항 (Bounded · Observable · Predictable · Reversible · Auditable · Fallback · A11y) |
| `Agora` *내부 철학* | 채팅 없는 공동 돌봄 시스템 (솔로 다이어리 X). 사용자 facing 어휘 절대 X — §4.6 |
| `quiet-weave` | P0 hero Moment — 파트너 signal 을 본인 timeline 에 드러내지 않고 자연스럽게 직조 (ADR-0013 Addendum A1) |
| `bonding predicate` | sync invitation 의 트리거 조건 (활동≥7d · ChapterMemory≥5 · 사진≥1 · Phase transition≥1 — ADR-0011 Addendum) |

---

## 3. Voice & Tone — 사용자에게 말할 때

### 3.1 톤 5원칙

1. **따뜻하지만 절제 (warm, restrained)** — 가벼운 응원도 OK, 과한 격려는 무례.
2. **명사보다 동사 (action over thing)** — *"기록"* 보다 *"적어두세요"*.
3. **사용자 시점 (you, not we)** — *"○○님이 적어주신 메모"* > *"우리가 기록한 데이터"*.
4. **시간을 일상어로 (everyday time)** — *"D-1"* > *"이식까지 23시간"* > *"내일 아침"*. 후자 우선.
5. **결정의 무게 인정 (acknowledge weight)** — 힘든 챕터들 — 시술·항암·사별·입시 실패·돌봄 — 은 가벼운 게 아니다. *"잠깐만요"* 같은 호흡 한 박자.

### 3.2 톤 예시 (good vs bad)

| 상황 | ❌ Bad | ✅ Good |
|------|-------|---------|
| 케어 이벤트 기록 (E4 건강 에셋) | "주사 1건 완료! 오늘의 미션 클리어 🎯" | "오늘 아침 Gonal-F, 수고하셨어요." |
| 비건강 챕터 nudge (E1 훈련) | "오늘 기록 안 하셨어요! 스트릭 위험 🔥" | "어제 장거리 러닝을 빠지셨어요. 오늘 남기고 싶은 게 있으세요?" |
| 힘든 날 (건강 챕터) | "5/7 회차 진행 중. 화이팅!" | "어제 5차였어요. 오늘은 천천히 가요." |
| 기억 surfacing (어느 챕터든) | "Memory Unlock! 1년 전 오늘" | "1년 전 오늘, 이 챕터를 시작하셨어요." |
| 수험 챕터 nudge | "오늘 기록 안 하셨어요! 스트릭 끊기지 말아요 🔥" | "어제 세 가지 적어두셨어요. 오늘은 뭘 남기고 싶으세요?" |
| 새 챕터 생성 | "에셋 생성 완료 ✅" | "챕터가 준비됐어요. 첫 번째로 뭘 기억해두고 싶으세요?" |
| 에러 | "오류 발생. 다시 시도해주세요." | "지금 잠깐 연결이 어렵네요. 다시 한 번요." |
| 빈 상태 | "아직 데이터가 없습니다." | "여기에 ○○님의 첫 기억이 쌓일 거예요." |

### 3.3 페르시컬리 (사람의 말투)

- 한국어: 존댓말 기본, *"○○님"* (이름 호명), *"저희"* (MODU 자기칭).
- 영어 (향후): "you", lowercase brand voice ("we listen"), no exclamation marks.

---

## 4. Anti-Lexicon — 절대 쓰지 말 것

### 4.1 게이미피케이션 어휘 (전면 금지)

> 의료/돌봄 카테고리는 게임이 아니다. 5차 항암 완료가 "achievement" 가 되는 순간 브랜드는 죽는다.

`스트릭` `배지` `레벨` `XP` `점수` `미션` `퀘스트` `클리어` `달성` `랭킹` `리더보드` `챌린지` `보상`

### 4.2 의료적 거리감 어휘

> 사용자는 *환자*가 아니라 *자기 챕터를 사는 사람*이다.

`환자` (patient) `진단` (diagnosis) `처방` (prescription) `투약` (administration) `증상 관리` (symptom management) `케이스` (case)

→ 대신: *○○님 / 그분 / 약 / 진료 / 함께해요*.

### 4.3 데이터적 거리감 어휘

> 사용자는 *데이터를 입력하는 사람*이 아니라 *기억을 남기는 사람*이다.

`데이터 입력` `로그` `엔트리` `레코드` `필드` `값`

→ 대신: *기억 / 적어두기 / 남기기 / 메모*.

### 4.4 AI 의 자기과시 어휘

> AI 는 *동반자*이지 *선생*이 아니다.

`AI 가 분석한 결과` `진단` `추천드립니다` `솔루션` `최적의 답`

→ 대신: *함께 살펴봤어요 / 패턴이 보여요 / 어떨까요*.

### 4.5 평가·판단 어휘

> 사용자의 컨디션·결정·감정을 평가하지 않는다.

`나쁨` `위험` `실패` `잘못` `포기`

→ 대신: *지나갔어요 / 다음에 / 천천히 / 그럴 수 있어요*.

### 4.6 내부 메타포·시스템 어휘 UI 노출 (2026-04-17 추가)

> MODU 는 *그것임을 증명* 하지 않고 *그것처럼 느껴지도록* 조용히 인도한다. (ADR-0013 Addendum A3)

내부 메타포·시스템 어휘 (설계/코드/ADR/commit 에서만 사용) 는 사용자 facing UI·카피·라벨·온보딩·설정 어디에도 노출 금지:

`Agora` `Moments` `순간` `quiet-weave` `TimeRiver` `StoryCard` `AmbientPalette` `Signal Axes` `slot` `predicate` `Role` `phase` `L0` `L1` `L2` `L4` `TPO` `bonding predicate`

또한 **관계·공동 돌봄을 드러내는 카피도 금지** — 자연스럽게 느껴져야 한다:

| ❌ 드러냄 | ✅ 은유적 가이드 |
|-----------|------------------|
| "파트너가 주사를 맞으셨어요" | *(별도 알림 X, timeline 에 자연스럽게 포함 + 본인 "다음 한 걸음" 이 조용히 조정)* |
| "아고라에 파트너가 접속 중" | *(표시하지 않음)* |
| "AI Moment 가 시작됩니다" | *(렌더만 바뀌고 UI 설명 없음)* |
| "역할: 파트너 모드" | *(UI 가 이미 role-adaptive, 라벨 불필요)* |
| "클라우드 동기화 켜기" | "이 기록들은 지금 이 기기에만 있어요" (ADR-0011 Addendum) |

새 Moment / 컴포넌트 / 카피 작성 시 **두 관문**:
1. 이 단어가 UI 카피로 나가도 *촌스럽지* 않은가?
2. *"무엇을 느끼게 하는가"* 를 담고 있는가?

둘 다 실패하면 내부 코드네임으로만 사용.

---

## 5. Decision Phrasing — 회의·문서·commit

### 5.1 회의에서

- "이거 게이미피케이션 같은데?" — anti-lexicon §4.1 hit. 즉시 reframe.
- "이건 챕터 어휘 안에 있어?" — 새 메타포 도입 시 반증 의무.
- "Ritual 인가 transition 인가?" — 사용자가 무게를 느껴야 한다면 ritual.

### 5.2 commit message

```
feat(chapter): birth ritual after formation completion
docs(grammar): add Archive Ritual definition
fix(memory): MemoryGlance crash on empty ChapterMemory
refactor(layout-engine): L2 cache hint integration
```

- type(scope) 의 scope 는 lexicon 어휘 사용 (chapter / memory / layout / ritual / formation / partner / media / lexicon / engine / moments / adr / grammar / strategy ...)

### 5.3 PR 제목 / 디자인 파일명

- *"위젯 추가"* X → *"PartnerSync StoryCard 추가"* O
- *"홈 개선"* X → *"TimeRiver NOW marker sticky 처리"* O

---

## 6. Persona Cards — C-레벨 시선

각 페르소나는 같은 lexicon 을 쓰되, 다른 결정 기준을 본다.

### 6.1 CEO — *"10년 후 이게 무엇이 되어 있나"*

- 우선: 미션·장기 자산·신뢰
- 거절 trigger: 단기 성장 위해 anti-lexicon 도입 / 광고 수익화 / 데이터 매각
- 대표 발언: *"이게 5년 후에도 사용자에게 의미 있을까?"*

### 6.2 CPO — *"사용자가 이걸 왜 사랑하나"*

- 우선: 사용자 경험·PMF·차별화
- 거절 trigger: 기술 우선·내부 편의·과도한 옵션
- 대표 발언: *"이거 사용자가 첫 3초에 이해하나?"*

### 6.3 CTO — *"이게 1만→1000만 user 까지 어떻게 버티나"*

- 우선: cost curve · scale · reliability · security
- 거절 trigger: AI 호출 linear scale / 캐시 없음 / 단일 장애점
- 대표 발언: *"L1 만으로 끝나는 결정인가? 아니면 L4 까지 가야 하나?"*

### 6.4 CDO — *"이게 MODU 답나"*

- 우선: 디자인 시스템·voice/tone·motion language
- 거절 trigger: anti-lexicon 사용 / palette 외 색 / inconsistent transition
- 대표 발언: *"이거 챕터 어휘 안에 있나? Ritual 인가 transition 인가?"*

### 6.5 SA (Solutions Architect) — *"우리가 후회 없이 이 결정 할 수 있나"*

- 우선: ADR·trade-off 명시·미래 옵션 보존
- 거절 trigger: lock-in 결정 / 문서 없는 큰 결정 / "그냥 하자"
- 대표 발언: *"이거 ADR 로 박아둬야겠다."*

### 6.6 외부 Advisor (CPO/CFO/Legal/Medical) — *"내가 보지 못한 위험"*

- 우선: blind spot · regulatory · market reality
- 거절 trigger: 내부 합의로 끝나는 결정 / 사용자 리서치 없음
- 대표 발언: *"이거 진짜 사용자 이야기 들어봤나요?"*

---

## 7. Naming Conventions — 새 것을 만들 때

새 컴포넌트·기능·문서를 만들 때 따라야 할 명명 룰:

### 7.1 컴포넌트

- React: `PascalCase` + 메타포 어휘 (`TimeRiver`, `StoryCard`, `MemoryGlance`)
- 사용자 노출 라벨은 별도 (`<TimeRiver>` 의 헤더는 *"오늘"*)

### 7.2 데이터 / 함수

- snake_case for DB columns (`chapter_memories`, `context_hints`)
- camelCase for TS (`computeLayout`, `useWidgetOrder`)

### 7.3 문서

- `docs/{category}/{YYYY-MM-DD}-{topic}.md` 또는 `docs/adr/{NNNN}-{topic}.md`
- category: `adr` / `reviews` / `strategy` / `planning` / `grammar`

### 7.4 commit type

`feat` `fix` `refactor` `docs` `chore` `test` `perf` — scope 는 lexicon 어휘.

---

## 8. Versioning — 이 문서를 어떻게 갱신하나

이 문서는 **live document**. 다음 트리거에 갱신:

- 새 메타포 도입 결정 시
- Anti-lexicon 위반이 2회 이상 발생 시
- 새 페르소나 카드 추가 시
- C-레벨 합의로 lexicon 변경 시

갱신 commit: `docs(grammar): add/update/remove [term]`

큰 변경 시 ADR 동반 (예: ADR-0011 "Lexicon Major Revision").

---

## 9. 실전 적용 체크리스트

새 기능·UI·문서·발표를 만들 때:

- [ ] 사용자 노출 카피가 anti-lexicon 을 안 쓰는가?
- [ ] 컴포넌트 이름이 7개 메타포 안에 있는가?
- [ ] Voice & Tone 5원칙을 통과하는가?
- [ ] commit message 의 scope 가 lexicon 어휘인가?
- [ ] Ritual 인지 transition 인지 명확한가?
- [ ] 5년 후에도 이 어휘가 유효한가?
- [ ] 사용자 facing 카피가 English-master 로 작성되었는가? (ADR-0014)
- [ ] Moment 가 `en-US` 와 `ko-KR` 양쪽에서 올바르게 렌더되는가?

---

## 10. Quick Reference — 외울 것 7개

1. **챕터 / 기억 / 라이브러리 / 강 / 동반자 / 빛 / 순간** — 메타포 7 (뒤 4개는 내부 전용, UI 노출 X)
2. **사용자는 환자가 아니라 챕터를 사는 사람**
3. **Ritual = 사용자가 무게를 느끼는 순간**
4. **모든 인터랙션 = ChapterMemory append**
5. **빈 화면보다 잘 고른 선택지**
6. **광고 SDK 영구 금지 · 데이터 판매 영구 금지**
7. **Listen to your life**

---

## 참조

- `CLAUDE.md` §2-7 (north star · voice · 5-year retention 자문)
- `docs/strategy/2026-04-17-ceo-decision-pack.md` (메타포의 전략적 근거)
- `docs/planning/2026-04-17-timeflow-frontend-plan.md` (Surface 어휘 source)
- `docs/planning/2026-04-17-adaptive-engine-cto-plan.md` (인프라 어휘 source)
- `docs/adr/0018-horizontal-first-pivot.md` (horizontal platform, signal axes, per-asset compliance matrix E1-E4)
- `docs/grammar/modu-product-grammar.md` (English master — ADR-0014 준수. 본 파일은 Korean 보조)
