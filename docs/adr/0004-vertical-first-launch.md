# ADR-0004: Vertical-First Launch — Fertility 단독 v1, 멀티에셋은 v2

- Status: **Proposed (awaiting founder confirm)**
- Date: 2026-04-17
- Related: CPO Review §4, §6.1

## Context

CPO Review §4 가 명확히 지적했다:

> **"한 앱이 난임·항암·펫을 다 커버한다"는 테제는 시장 검증이 안 된 리스크다.**
> 권고: B 시작 → A 확장. 현재 프로토타입의 세 에셋은 *내부 비전 문서*로서는 완벽하지만, v1 출시는 하나의 에셋 타입만 열고 나머지는 "곧 만나요" 대기열로 처리하는 편이 낫다.

또한 출시 차원에서:
- **컴플라이언스 단순화**: 단일 카테고리 = 단일 디스클레이머 set
- **마케팅 메시지 명확**: "당신의 IVF 동반자" vs "삶의 모든 챕터"
- **PMF 검증 가능 속도**: 6주 안에 첫 100명 사용자 확보 가능
- **데이터 모델 간소화**: ChapterMemory schema 가 한 도메인 기준 stabilize 후 일반화

## Decision

**v1 출시는 Fertility (난임) 카테고리만.** 다른 3타입 (cancer_caregiver, pet_care, chronic) 은:

- 코드/데이터 모델 차원에서는 그대로 유지 (비전 보존)
- UI 진입점 차단 — Formation step_01 에서 fertility 만 활성, 나머지는 *"곧 만나요. 알림 신청"* 대기열
- 대기열 신청 = 이메일 + 사용 의도 1줄 → DB `vertical_waitlist` 테이블로 PMF 신호 수집

### v1 → v2 → v3 단계
- **v1 (KR fertility)**: 6-10주 출시. 목표 = 1K WAU + 14% W4 retention
- **v2 (KR fertility + chronic)**: v1 PMF 검증 후. 만성질환은 도메인 인접 + 컴플라이언스 단순
- **v3 (KR + JP/EN, full multi-asset)**: v2 ARR > $50K MRR 달성 후

### 권고: 왜 fertility 가 첫 카테고리인가
- 사용자 동기 강도 가장 높음 (월 비용 지불 의향 ↑)
- 시간-기반 프로토콜이 가장 명확 (= 위젯 우선순위 엔진의 가치 즉각 입증)
- 파트너 sync 가 자연스러운 use case
- 한국 시장 경쟁사 약함 (글로벌 Flo/Premom 대비 한국어·한국 의료 시스템 깊이 미진입)

## Consequences

### 긍정
- 마케팅·컴플라이언스·디자인 모두 좁은 표면적에서 polish 가능
- Formation 시퀀스 / 위젯 22종 / 룰 중 fertility 만 v1 검수 → 품질 보장 빨라짐
- 사용자 인터뷰 ICP 정의 명확 ("33-42세, IVF/IUI 진행 중, 파트너 있음/없음")

### 부정
- 다중 에셋 비전이 외부 메시지에서 후퇴 → "그 회사가 무얼 만드는지 모르겠다" 리스크
- 이미 만들어진 cancer/pet/chronic 자산이 일시적으로 dormant
- v2 확장 시 schema 가 fertility-bias 될 위험 → 코드 review 필수

### 완화책
- Cancer/Pet/Chronic 룰·위젯 코드는 PR 수준에서는 살아있게 (CI 통과). 단지 product 진입점만 차단
- PROJECT_SPEC 은 멀티에셋 그대로 유지 (비전 문서)
- 마케팅 카피: *"먼저 IVF 동반자로 시작해, 곧 항암·만성질환 챕터로 확장됩니다"*

## Rejected Alternatives

| 옵션 | 거절 이유 |
|------|-----------|
| A. 멀티에셋 풀 출시 | TAM 좁고 PMF 검증 어려움. 마케팅 메시지 분산 |
| C. Pet 단독 출시 | 결제 의향 낮음. 의료 카테고리 차별화 약함 |
| D. Cancer caregiver 단독 | 사용자 정서 무거움 — 첫 카테고리로 emotional load 높음 |

## References

- CPO Review §4, §6.1, §7.1
