# 디자인 의뢰서 — TPO Funnel Runtime

> **Project**: `@tpo/runtime` Product Design Commission
> **Date**: 2026-04-29
> **Status**: 의뢰 준비 완료 (Open Solicitation)
> **Document version**: v1.0

---

## 0. 한 줄 요약

오픈소스 TypeScript 결정 거버넌스 런타임의 브랜드 정체성·마케팅 사이트·문서 사이트·인터랙티브 플레이그라운드를 통합 설계한다. 단순 자료 미관이 아니라 "결정의 책임 소재를 가시화하는 런타임"이라는 제품 명제를 한 화면에서 전달하는 것이 본 의뢰의 핵심이다.

---

## 1. 의뢰 배경

### 1.1 제품 본질
TPO Funnel Runtime은 일반적인 개인화 엔진이 아니다. 룰 기반 UI 결정에서 **무엇이 보이지 않았고 왜 보이지 않았는가**를 구조적으로 기록하는 결정 책임 런타임이다. LaunchDarkly·OpenFeature·XState 등 기존 도구가 "선택된 경로"만 출력하는 반면, 본 제품은 억제(suppressed)·잠금(locked)·연기(abstained) 결정 전체를 기록한다.

### 1.2 왜 디자인이 결정적인가
본 제품의 가치 제안은 화면이 없는 라이브러리에 머무르지 않는다. 채택 의사결정자(PM·CTO·Compliance Officer)는 README의 첫 5초에 "이것이 우리의 디버깅 비용을 줄이는가"를 판단한다. 개발자(Engineer)는 플레이그라운드의 첫 30초에 "이것이 내 워크플로우에 들어맞는가"를 판단한다. 두 판단의 정확도가 디자인 품질에 직결된다.

### 1.3 현재 디자인 상태
- 브랜드 정체성: 부재 (로고·컬러·타이포그래피 시스템 없음)
- 마케팅 사이트: 부재 (GitHub README만 존재)
- 문서 사이트: 부재 (15개 마크다운 문서만 존재)
- 플레이그라운드: 정적 HTML 1개 파일, 시스템 폰트, 테이블 레이아웃
- 트레이스 출력: 70자 폭 모노스페이스 텍스트, 색상 없음

---

## 2. 제품 개요 (디자이너용 컨텍스트 자료)

### 2.1 무엇을 하는 제품인가
입력으로 사용자 컨텍스트(`stage`, `role`, `time.phase`), 룰팩, 정책팩을 받아 `evaluate()` 함수가 다음을 출력한다.

- **selected**: 어떤 슬롯에 어떤 컴포넌트가 선택되었는가
- **suppressed**: 어떤 컴포넌트가 왜 제외되었는가 (정책 게이트 또는 조건 불일치)
- **locked**: 어떤 슬롯이 운영자에 의해 고정되었는가
- **abstentions**: 어떤 결정이 신뢰도 부족으로 연기되었는가
- **riskTier**: low / medium / high

이 출력은 두 가지 모드로 시각화된다.

### 2.2 두 가지 출력 모드의 핵심 차이

**Developer Mode (기존)**
```
TPO Funnel Runtime — Decision Trace v1
======================================
--- SELECTED ---
  #1  slot            : primary_action
      componentKey    : SessionCheckInPrompt
      specificity     : 1.00
      priority        : 1
      matched_rules   : [r-042, r-055]
```

**Governance Mode (조직용)**
```
TPO Decision Governance Report
======================================
COMMITMENTS HONORED  (1)
  hero  →  SponsorBannerKCD2026  [promotion]

ALGORITHM SELECTED  (4)
  primary_action  →  SessionCheckInPrompt

EXCLUDED WITH REASON  (4)
  NetworkingMatchCard  —  time.phase in ["D-day","D+1"] — got "D-3"

DEFERRED  (2)
  LocalDiningRecommendation  —  confidence 0.41 (threshold 0.60)
```

같은 데이터, 다른 어휘. 디자인은 이 두 모드의 시각적 구분을 명확히 표현해야 한다.

### 2.3 도메인 예제
- **은행앱**: 금융소비자보호법 compliance 슬롯 고정, DSR 40% 초과 고객 대출 CTA 억제
- **이커머스**: 장바구니 이탈 + 타임세일, 재고 긴박 뱃지
- **핀테크**: 신규 사용자 KYC 미인증 시 투자 배너 policy gate

---

## 3. 타겟 청중과 의사결정 경로

### 3.1 1차 청중 (Primary)
**시니어 프론트엔드 엔지니어 / 풀스택 엔지니어 (8년 차 이상)**
- 컨텍스트: 룰 기반 UI를 운영 중이며 "왜 이게 안 떴지?" 디버깅 비용을 매주 부담
- 첫 30초에 검증하는 것: 코드 예제의 명료함, 트레이스 출력의 가독성, 타입 안정성
- 결정 시그널: 채택 후 본인이 PR 리뷰에서 동료에게 옹호할 수 있는가

### 3.2 2차 청중 (Secondary)
**Product Manager / QA Engineer / Compliance Officer**
- 컨텍스트: 엔지니어가 도입 후 협업 도구로 사용
- 첫 30초에 검증하는 것: governance 모드의 보고서 형식, EXCLUDED WITH REASON의 사람-읽기 가능성
- 결정 시그널: 본인이 직접 결정 근거를 추적 가능한가

### 3.3 의사결정 경로
```
GitHub README 도달 (5초) → Playground 클릭 (30초) →
도메인 예제 실행 (1분) → npm install (5분) → 첫 채택 (1주)
```

각 단계의 이탈률이 디자인 품질의 직접 측정 지표가 된다.

---

## 4. 브랜드 포지셔닝 가이드

### 4.1 정체성의 핵심 명제
"우리는 결정 책임 런타임이다. 왜 그 컴포넌트가 안 보였는지 답할 수 있는 시스템이다."

### 4.2 톤 앤 매너 키워드
| 강조 | 회피 |
|---|---|
| 책임성 (Accountability) | 마법 (Magic) |
| 명료함 (Explicitness) | 자동화 만능론 |
| 결정성 (Determinism) | 블랙박스 |
| 거버넌스 (Governance) | 무규율 개인화 |
| 신뢰 (Trust) | 공격적 마케팅 톤 |

### 4.3 시각 언어 방향
- 차분한 데이터 시각화 미학 (Stripe, Vercel, Linear, Resend의 서체·여백·정렬 감각)
- AI/LLM 톤은 회피 (그라디언트 남용, 파스텔, 추상적 기하 도형)
- 결정 트레이스가 주인공: 트레이스 텍스트 자체가 가장 아름다워야 함
- 한국어와 영문 병행 가능한 타이포그래피 (한영 혼용 본문에서 자간 깨지지 않을 것)

### 4.4 참조 사례 (방향성 일치)
- **Stripe**: 정밀한 그리드, 절제된 컬러, 코드 블록의 가독성
- **Resend**: 모노스페이스의 정중함
- **Linear**: 다크 모드 First, 미니멀한 위계
- **Vercel**: 검정·흰색·1포인트 액센트
- **Anthropic Claude docs**: 한영 본문 안정성

### 4.5 참조 사례 (방향성 불일치)
- 일반 SaaS 마케팅 사이트의 화려한 일러스트
- LLM 제품 특유의 보라색·청록색 그라디언트
- 뱅크/핀테크 제품의 보수적 일러스트
- 공격적 CTA, "AI-powered" 류 문구

---

## 5. 의뢰 범위 (Scope of Work)

본 의뢰는 5개 산출물로 구성된다. 각 산출물은 독립 평가 가능하며, 전체 통합 정합성이 함께 평가된다.

### 5.1 [SOW-1] 브랜드 정체성 시스템

| 항목 | 산출물 |
|---|---|
| 워드마크 (Wordmark) | `@tpo/runtime` 또는 `TPO` 로고 — SVG, 다크/라이트 변형, 페이버콘 |
| 심볼 (Symbol) | 워드마크 없이 단독 사용 가능한 심볼 (선택) |
| 컬러 시스템 | Primary, Secondary, Neutral, Semantic (low/medium/high risk) — 다크/라이트 양 모드 |
| 타이포그래피 | Display, Body, Code 3계층. 한영 병행 안정성 검증 필수 |
| 아이콘 시스템 | selected / suppressed / locked / abstained / risk-tier 5종 + UI 보조 아이콘 |
| 가이드라인 문서 | 사용 규칙·금지 사항·예외 처리 (PDF + Figma) |

### 5.2 [SOW-2] 마케팅 랜딩 사이트

타겟 길이: 1페이지 + 도메인 예제 3페이지 (banking/ecommerce/fintech)

| 섹션 | 내용 |
|---|---|
| Hero | 한 문장 가치 제안, 라이브 트레이스 미리보기 (스크롤 차단) |
| Why Different | LaunchDarkly·OpenFeature와의 차별점 시각화 |
| How It Works | evaluate() 입력→출력 도식, 3분 |
| Domain Examples | banking·ecommerce·fintech 각 카드. 클릭 시 상세 페이지 |
| Live Demo Embed | Playground 임베드 (5.4 산출물과 연동) |
| Get Started | npm install + 첫 코드 5줄 |
| Footer | 라이선스, GitHub, 문서 |

반응형: 모바일 320px, 태블릿 768px, 데스크탑 1280px+ 대응 필수.

### 5.3 [SOW-3] 문서 사이트

VitePress 또는 Astro Starlight 기반 정적 사이트.

| 영역 | 요구사항 |
|---|---|
| 사이드바 | 15개 스펙 문서 + API 레퍼런스 + 가이드 + Changelog |
| 코드 블록 | TypeScript 신택스 하이라이팅, 줄번호, 복사 버튼, 다크/라이트 |
| 트레이스 출력 블록 | governance/developer 모드 시각 구분, 색상 시스템 적용 |
| 검색 | Algolia DocSearch 또는 Pagefind |
| 다국어 | 한·영 동시 운영 (URL: `/en/...`, `/ko/...`) |
| API 레퍼런스 | TypeDoc 출력의 시각 디자인 통합 |

### 5.4 [SOW-4] 인터랙티브 플레이그라운드

현재 `playground/index.html` 전면 재설계. 단일 HTML + 외부 CSS/JS 허용.

| 패널 | 요구사항 |
|---|---|
| Context Input | stage, role, time.phase 등 폼 입력. 도메인 프리셋 빠른 로드 |
| Rules Editor | JSON 모노스페이스 에디터 (CodeMirror or Monaco). 룰팩 임포트/익스포트 |
| Policy Editor | 동일 |
| Live Output | developer / governance 모드 토글. 색상 시스템 적용 |
| Share | 현재 상태를 URL에 인코딩, 공유 가능 |
| Domain Presets | banking·ecommerce·fintech 한 클릭 로드 |

### 5.5 [SOW-5] 트레이스 출력 비주얼 디자인 시스템

CLI 텍스트 출력과 향후 GUI 양쪽에서 일관된 시각 언어.

| 요소 | 디자인 |
|---|---|
| 섹션 헤더 | COMMITMENTS HONORED / ALGORITHM SELECTED / EXCLUDED WITH REASON / DEFERRED — 색상·타이포그래피 |
| 카운트 뱃지 | (1), (4), (0) — 시각 위계 |
| 화살표 | `→`, `—` 의 의미 분리 |
| 리스크 티어 | low / medium / high의 시각적 차등 |
| 폴리시 ID | `[P-DSR-040]` 형식의 모노스페이스 표기 규칙 |
| 컬러 적용 | 터미널 ANSI 컬러 + 웹 동등 매핑 |

이 시스템은 SOW-3 코드 블록과 SOW-4 라이브 출력에 동일하게 적용된다.

---

## 6. 산출물 형식 (Deliverable Format)

### 6.1 디자인 파일
- **Figma**: 모든 디자인 (브랜드·웹·플레이그라운드)
- **Auto Layout 기반**: 토큰화된 컴포넌트 시스템
- **Variables**: 컬러·타이포·간격 변수 정의
- **편집 권한**: 위탁자에게 view + comment, 작업 종료 시 ownership transfer

### 6.2 핸드오프
- **Tokens**: `tokens.json` (Style Dictionary 호환) — 컬러·타이포·간격
- **CSS**: 토큰에서 생성된 `:root { --color-... }` 변수 시트
- **에셋**: SVG (단일 색·다색 변형), PNG (1x/2x/3x), WebP (랜딩 사이트용)
- **폰트**: 라이선스 첨부, 셀프호스팅 가능 형식 우선

### 6.3 문서
- **브랜드 가이드라인**: PDF (40-60p)
- **컴포넌트 라이브러리 README**: Markdown
- **사용 사례 핸드오프 노트**: 각 SOW별 1쪽 요약

### 6.4 라이선스
- 위탁자(`@tpo/runtime` 프로젝트)에 영구 사용권 양도
- 디자이너는 포트폴리오 공개 가능 (출시 후 4주 이후)
- 폰트·스톡 에셋은 별도 라이선스 명시 필수

---

## 7. 일정과 마일스톤

### 7.1 권장 일정 (8주)

| 주차 | 단계 | 이정표 |
|---|---|---|
| W1 | Discovery | 킥오프, 레퍼런스 정렬, 무드보드 2-3안 |
| W2 | Brand Direction | 워드마크·컬러·타이포 1차안 (3 방향) |
| W3 | Brand Lock | 1방향 선정, 시스템 확정 |
| W4 | Web Wireframe | 랜딩·문서 사이트 와이어프레임 |
| W5 | Web Visual | 고해상도 시안 1차 |
| W6 | Playground | 인터랙션 시안 |
| W7 | Trace System | 트레이스 출력 비주얼 시스템 + 통합 검증 |
| W8 | Handoff | 토큰·에셋·문서 인도, 개발 핸드오프 세션 |

### 7.2 검토 포인트
- 매 단계 종료 시 60분 동기 미팅 + 비동기 코멘트 1주기
- 수정 횟수: 단계별 2회 무료, 추가는 시간당 청구

---

## 8. 협업 방식

### 8.1 의사결정 권한
- **Final say**: 위탁자 (PM 1인)
- **Veto power**: 디자이너 (브랜드 일관성 침해 시)
- **Async first**: Slack 또는 Discord 채널, 1일 1회 상태 업데이트

### 8.2 도구
- 디자인: Figma
- 협업: Linear or GitHub Issues
- 미팅: Google Meet or Zoom (녹화 권장)
- 자료실: Notion or Google Drive

### 8.3 회고
- 매 격주 30분 회고
- 종료 시 Lessons Learned 문서 공동 작성

---

## 9. 선정 기준

### 9.1 정량
| 항목 | 가중치 |
|---|---|
| 포트폴리오의 개발자 도구·SaaS 디자인 비중 | 30% |
| 모노스페이스·코드 타이포그래피 감각 | 20% |
| 한영 혼용 타이포그래피 경험 | 15% |
| 디자인 시스템 토큰 운영 경험 | 15% |
| 가격 적정성 | 10% |
| 일정 준수 신뢰성 | 10% |

### 9.2 정성
- 첫 미팅에서 제품 본질을 직접 질문하는가 (브랜드 키워드 의존이 아닌 사용자 시점 질문)
- 레퍼런스 기반 판단력 (왜 Stripe인가, 왜 Linear가 아닌가)
- 자기 작업의 한계를 명시할 줄 아는가

### 9.3 결격 사유
- AI 일러스트 의존 (작업의 30% 이상)
- 그라디언트·파스텔 위주의 SaaS 클리셰 포트폴리오
- 한글 타이포그래피 검증 자료 부재
- 핸드오프 토큰화 미경험

---

## 10. 예산

### 10.1 권장 범위
- **풀 스코프 (SOW 1–5 통합)**: ₩30M – ₩60M (단일 디자이너 또는 2-3인 스튜디오 기준)
- **Phase 분할 가능**: SOW-1+2를 우선, SOW-3+4+5는 별도 계약 가능

### 10.2 지급 일정
- 계약금 30%
- W3 종료 (Brand Lock) 30%
- W6 종료 (Web Visual + Playground) 30%
- 핸드오프 종료 10%

### 10.3 예산 외 지원
- 폰트 라이선스 별도 정산
- 스톡 사진·일러스트 별도 정산
- 추가 수정 시간당 정산 (계약 시 단가 합의)

---

## 11. 제출 요구사항

### 11.1 응답 시 제출
1. 포트폴리오 (관련 작업 3건 이상 상세 케이스 스터디)
2. 본 의뢰서에 대한 1쪽 응답 (어떤 부분이 가장 도전적인가)
3. 권장 일정안 (위 7.1 대비 조정안)
4. 견적 (총액 + 마일스톤별 분할)
5. 작업 가능 시작일

### 11.2 제출 채널
- Email: (위탁자가 추후 안내)
- 응답 마감: 본 의뢰서 공개 후 14일

### 11.3 비밀유지
- 본 의뢰서 자체는 공개 가능
- 응답 내용은 비공개
- 양 측 NDA 체결 가능 (요청 시)

---

## 12. 위탁자 컨텍스트

### 12.1 제품 단계
현재 v0.1.0, Tier A (Open-Source MVP) 단계. 완성 로드맵 4단계 중 첫 단계 진입 직전. 본 디자인 작업은 Tier A → B 전환을 결정짓는 채택 마찰 제거의 핵심 변수다.

### 12.2 팀 규모
1인 메인테이너 + AI 페어 작업 환경. 디자이너는 사실상 제품 디자인 디렉션의 절반을 단독 책임진다.

### 12.3 운영 가치
- 결정의 명료함을 미관보다 우선
- 채택자가 본인의 동료에게 옹호할 수 있는 시스템
- 한글·영문 동등한 품질
- 100명에게 멋진 것보다 10명에게 결정적인 것

---

## 13. 첨부 자료 (응답자에게 제공)

본 의뢰서와 함께 다음 자료를 제공한다.

1. `README.md` — 제품 가치 제안 및 도메인 예제
2. `00_INDEX.md` ~ `14_MVP_AND_PHASED_ROADMAP.md` — 15개 스펙 문서
3. `ROADMAP-TO-COMPLETION.md` — 4-Tier 완성 로드맵
4. `playground/index.html` — 현재 플레이그라운드
5. 라이브 트레이스 출력 샘플 5종 (developer/governance × banking/ecommerce/fintech)

---

## 14. 후속 단계

본 의뢰가 종료되면 다음 작업이 디자인 시스템 연속선상에서 별도 계약될 수 있다.

- **Tier C Authoring UI**: 룰팩 시각 편집기 (예상 W12-20, 별도 산정)
- **Tier C Audit Dashboard**: 결정 이력·정책 위반 분석 (예상 W16-24)
- **Tier C Compliance Reports**: PDF·HTML 자동 보고서 템플릿 (예상 W18-22)

본 의뢰의 디자인 시스템(SOW-1)이 후속 작업의 기반이 되므로, 시스템의 확장성을 미리 고려한 설계가 평가에 반영된다.

---

## 15. 본 의뢰서의 갱신 정책

- 응답 마감 전 의뢰서 수정 시 모든 응답자에게 즉시 통보
- 마감 후 수정 불가
- 계약 체결 후의 변경은 양 측 합의 + 일정·예산 재산정

---

**위탁자 서명 / Date**: ___________________
**의뢰 ID**: TPO-DESIGN-2026-Q2
**문서 해시**: (계약 시 SHA-256 봉인)
