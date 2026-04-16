# Caregiver Agora & Micro-Session Loop — 돌봄의 협업 아고라 + 바쁜 사용자의 자연 retention

작성일: 2026-04-17 (founder voice)
Status: **Pinned strategy** — Partner Sync · Micro-session UX · No-chat 원칙의 단일 정렬축
연결: W1 Retention Strategy · Revenue Unit Economics · grammar (Agora 메타포 추가)

> **한 줄**: MODU 는 솔로 다이어리가 아니다. 같은 챕터를 둘 이상이 보는 순간 **돌봄의 아고라**가 된다. 메시지 없이, presence 없이, 그저 같은 챕터를 보는 것만으로 협업이 일어난다. 그 위에서 바쁜 caregiver 가 5-15초의 micro-session 으로 자연스럽게 들어와 한 액션 남기고 떠난다 — 그 loop 가 retention 이다.

---

## 1. Why this matters

돌봄은 본질적으로 **분산 책임**이다.

- 남편 + 아내가 *같이 시험관 챕터*를 보지만 행동은 각자 (주사 한쪽 / 일정 다른 쪽)
- 형제 + 자매가 *같이 어머니 항암 챕터*를 보지만 책임은 분담 (방문 형 / 약 정리 자매)
- 보호자 + 의사가 *같이 만성질환 챕터*를 보지만 권한은 다름 (약 변경 의사 / 일상 기록 보호자)

**기존 의료 앱 = 솔로 노트.** 협업은 "캡쳐해서 카톡" 같은 우회로.
**MODU 의 기회 = 같은 챕터의 멀티-책임 모델을 일급으로 만든다.**

이건 메시지 앱이 아니다. 채팅 없이도, presence 없이도, **행동 자체가 메시지**가 된다.

---

## 2. Agora — 7번째 핵심 메타포

> grammar §1 의 6 메타포 (챕터·기억·라이브러리·강·동반자·빛) 에 **아고라 (Agora)** 추가.

| 메타포 | 정의 | 안티 메타포 |
|--------|------|--------------|
| **아고라 (Agora)** | 같은 챕터를 함께 보는 사람들의 모임 공간. 메시지 X, 행동의 공명 O. | "채팅방", "그룹", "공유 폴더" |

### 2.1 Agora 의 3가지 작동 원칙

1. **No chat, no presence** — 텍스트 메시지·온라인 표시·"입력 중…" 없음. 의료 카테고리에서 그건 부담.
2. **Action as message** — *"준호님이 30분 전 Cetrotide 를 챙겼어요"* 같은 행동 알림이 communication.
3. **Soft hand-off** — *"지금 내가 봐요"* 가벼운 토글로 책임 흐름이 명시됨. 누구도 *"네가 했지?"* 묻지 않음.

### 2.2 Agora 가 작동하는 모먼트 (UX)

| 상황 | 작동 |
|------|------|
| 남편이 아침 약을 챙김 | 아내 진입 시 *"준호님이 09:00 약 챙겨주셨어요"* 카드가 TimeRiver 위쪽에 잠시 |
| 형이 어머니 진료 동행 | 자매 진입 시 *"형이 진료 메모 남겼어요"* 카드 + 메모 즉시 read |
| 자매가 약 재고 떨어졌다고 표시 | 형 진입 시 *"약 보충 필요"* NextActionPrompt 자동 surface |
| 두 명이 동시에 같은 챕터 진입 | 표시 X (presence-free), 단 동시 편집 충돌 시 timestamp last-write-wins |

### 2.3 절대 X (Agora 안티패턴)

- "준호님 입력 중…" → presence 부담, 의료 카테고리 부적합
- "당신은 마지막으로 X일 전에 들렀어요" → 책임 추궁 톤
- 그룹 채팅 / DM 기능 → MODU 는 메신저가 아니다 (대신 외부 카톡으로)
- 읽음 표시 → 책임 추궁 톤
- 댓글·답장 → 의료 메모는 protocol, 토론거리 X

---

## 3. Micro-Session Loop — 바쁜 caregiver 의 자연 retention

### 3.1 기존 retention 모델의 실패

대부분 retention 전략 = "더 오래 머물게" → 의료 caregiver 에게는 anti-pattern.
**돌봄은 바쁘다.** 앱을 5분 보는 게 아니라 *5초 보고 떠나서 다시 5초 보고 떠나는* 것.

### 3.2 MODU 의 Micro-Session 모델

```
한 session = 5~15초

1. 들어옴 (0~3s)        앱 open → TPOSignature → 한 화면에 "지금 무엇이 중요" 즉시 인지
2. 액션 (3~15s)         NextActionPrompt 한 탭 / Memory append 한 줄 / 일정 ✓
3. 떠남 (자연)          액션 후 modal 없이 자연 home 유지 → 사용자가 알아서 종료
4. 돌아옴 (자연)        다음 일정 30분 전 push (절제) 또는 무알림으로 자발 진입
```

### 3.3 Daily session 분포 (목표)

```
하루 평균 4~7회 짧은 session
  · 아침 진입 (1회) — 오늘 일정 확인 + 약
  · 점심 (가벼운 진입 1~2회) — 약 / 메모
  · 저녁 (오늘 한 줄, 다음 날 미리 준비)
  · 야간 (가족 액션 알림 확인 1회)

총 사용 시간: ~3-5분 / day
```

이 패턴 = **DAU/MAU 0.5 이상** 가능 (의료 카테고리 표준 0.2-0.3 의 2배).

### 3.4 Micro-session 을 받치는 3가지 lever

1. **App-Open 즉시성** (W1 Strategy §2)
   - last-known TPO 로 첫 paint 200ms
   - 사용자가 "지금 무엇이 중요한지" 1초 안에 인지 → 결정 0초

2. **Zero-friction action** (Timeflow §3.5)
   - NextActionPrompt 한 탭 = 즉시 ChapterMemory append
   - 확인 모달 X, 입력 X
   - swipe = snooze / skip (그것도 event)

3. **돌아올 이유는 push 가 아니라 *행동***
   - 알림 없어도 자연스럽게 떠올라 진입
   - "남편이 약 챙겨줬을 거야" → 진입 → confirm → 떠남
   - Push 는 *마지막 수단*, 첫 수단이 아님

---

## 4. 어떻게 코드가 받치는가

### 4.1 Agora 의 코드 수단

| UX | 구현 |
|----|------|
| "준호님이 30분 전 약 챙겼어요" 카드 | ChapterMemory.origin = 'partner' filter → JustDid surfacing |
| Soft hand-off "지금 내가 봐요" | 새 ChapterMemory kind 'shift_handoff' |
| Partner action surfacing 우선순위 | useWidgetOrder 의 새 condition 'recent_partner_action' |
| 동시 편집 충돌 | timestamp 기반 last-write-wins (단순 v1) → CRDT (v3) |

### 4.2 Micro-session 의 코드 수단

| UX | 구현 |
|----|------|
| 첫 paint 200ms | local persist (ADR-0011) + 마지막 TPO snapshot 캐시 |
| Zero-friction action | NextActionPrompt 가 항상 floating, 확인 X |
| 절제된 알림 | hour-of-day 1회 cap, 사용자 dismiss 시 1주 silence |
| 자발 retention | TPOSignature + Memory Glance + Just Did 카드 = "들어올 이유" 가 화면 안에 |

---

## 5. Partner-Default Onboarding (revenue 와의 결합)

### 5.1 1인 사용자에게도 "함께할 사람" 권유

> Family LTV = Plus × 3.3 (Revenue doc §2.3). Partner 초대는 단순 기능 X — **revenue lever**.

Formation 마지막 step (또는 첫 챕터 만든 후 24h 안):

```
"이 챕터를 함께 챙길 사람이 있으세요?"
  ┌─────────────────────────┐
  │  배우자 / 부모 / 형제   │  ← preset
  │  의사 / 간병인          │
  │  나중에 (skip)          │
  └─────────────────────────┘
```

- skip 가능 (압박 X)
- 1주 후 한 번 더 부드러운 상기
- 두 번째 챕터 만들 때 자동 다시 권유 ("이번엔 함께 보시면…")

### 5.2 초대 친화 디자인

- 초대 링크 1탭 → 카톡/iMessage 공유
- 받는 사람: 앱 설치 권유 X (게스트 read-only 가능)
- 게스트가 30일 안에 가입하면 *"함께 챕터 보기"* 자동 활성

### 5.3 Family 자연 전환

- 챕터 안 partner 5명 채워지면 → *"가족 모드로 통합하시면 ..."* 부드러운 카드
- Plus 사용자가 챕터 4개 + partner 3명 도달 시 → Family 자연 권유

---

## 6. 사용자 시나리오 — 진짜 일상

### 6.1 시험관 부부

```
07:00  남편 진입 → NextAction "Gonal-F 챙겼어요?" ✓ 한 탭 → 떠남 (3초)
09:30  아내 진입 → "준호님이 09:00 약 챙겨주셨어요" 카드 surfacing → 떠남 (5초)
13:00  아내 진입 → 점심 약 ✓ + "오늘 좀 무거워요" mood 1탭 → 떠남 (8초)
21:00  남편 진입 → "수아님이 13:00 약 + 오늘 무거우심" 카드 → "괜찮아?" 카톡 (외부) → 떠남 (4초)
23:00  아내 진입 → 오늘의 한 줄 30초 음성 → 떠남 (35초)

총 5 session, 55초.
```

이 흐름이 매일 자연스럽게 돌아가는 것 = **W1/W4 retention 의 본질**.

### 6.2 어머니 항암 형제

```
화 09:00  형 진입 → 항암 외래 동행 + 진료 메모 음성 30초 → 떠남
화 14:00  형 진입 → "진료 끝, 약 변경됨" 메모 1줄 → 떠남
화 20:00  자매 진입 → 형의 메모 read + 약 변경 ✓ + "다음 회차 준비할게" hand-off → 떠남
수 10:00  자매 진입 → 약국 가서 약 받기 NextAction ✓ → 떠남
수 19:00  형 진입 → "자매가 약 챙김" 카드 → 안심 → 떠남
```

채팅 없이 협업이 일어남. **Action 이 message.**

---

## 7. 측정 — 이 전략이 작동하는지

| 지표 | 목표 | 측정 |
|------|-----|------|
| Avg session length | 5~15초 | PostHog event timing |
| Sessions / DAU | ≥ 4 | open events / DAU |
| Multi-partner chapter ratio | ≥ 30% (Plus 가입자) | partner_links count > 1 |
| Partner action 카드 노출 / dismiss 비율 | dismiss < 20% | 카드 인터랙션 추적 |
| "Just Did" 카드 → mood/memo 추가 전환률 | ≥ 25% | event funnel |
| Family 전환 시점 = partner 5명 채운 후 평균 X일 | < 14일 | Funnel |

---

## 8. 그러면 우선순위 (코드)

| 우선 | 작업 | 효과 |
|------|------|------|
| **P0** | TPOSignature chip (앱 open 즉시) | session 진입 마찰 ↓ |
| **P0** | NextActionPrompt floating (zero-friction) | session 액션 자연 |
| **P0** | "Just Did" card (partner action surfacing) | Agora 작동 시작 |
| **P1** | Partner-default 권유 (Formation 끝) | Family 전환 lever |
| **P1** | Soft hand-off toggle | 분산 책임 명시 |
| **P2** | OrbitOnboarding (다음 챕터 생성 시도) | 첫 챕터 도달률 |
| **P2** | Memory Glance (의미 있는 날) | 자발 retention |
| **P2** | Scale Vision finale demo card | investor close |

---

## 9. grammar 에 박을 7번째 메타포 (제안)

이 전략이 합의되면 grammar §1 메타포 표에 **아고라 (Agora)** 추가:

```
| 아고라 (Agora) | 같은 챕터를 함께 보는 사람들의 모임 공간. 메시지 X, 행동의 공명 O. | "채팅방", "그룹" |
```

→ Public layer 카피: *"함께 챕터 보기"*
→ Code: `AgoraSurface` (Just Did 카드의 컨테이너)

---

## 10. 결론

- **MODU 는 솔로 다이어리가 아니다 — 아고라다.**
- 메시지 없이도 같은 챕터의 행동이 communication 이 되어 협업이 일어난다.
- 바쁜 caregiver 는 5-15초 micro-session 으로 자주 들어왔다 떠난다 — 이 loop 가 retention.
- Partner-default 권유 = revenue lever (Family LTV = Plus × 3.3).
- 코드 P0 = TPOSignature + NextActionPrompt + Just Did 카드. 이 셋이 W1 retention 의 인프라.

---

## 참조

- W1 Retention Strategy §2 (App-Open TPO 즉시성)
- W1 Retention Strategy §3 (매일 micro-loop)
- Revenue Unit Economics §1.2 (Family 전환 트리거)
- Timeflow Plan §3.5 (NextActionPrompt)
- grammar §1 (메타포 시스템 — Agora 추가 검토)
- ADR-0011 Local-First (즉시 paint 의 기반)
