# TPO Funnel Runtime — 완성 로드맵

> 작성일: 2026-04-29
> 적용 대상: `@tpo/runtime` v0.1.0 → v1.0.0 → Commercial Core
> 목적: 현재 시점에서 "이 라이브러리가 완성되었다"고 선언 가능한 모든 단계를 정의하고, 각 단계까지 필요한 모든 작업을 결손 없이 열거한다.

---

## 0. "완성"의 정의 — 4단계 누적 모델

본 프로젝트의 "완성"은 단일 시점이 아니라 누적적 4단계로 정의된다. 각 단계는 직전 단계 산출물 위에 덧쌓이며, 각 단계 종료 시점에 외부에 공식 선언 가능한 산출물을 보유한다.

| Tier | 명칭 | 외부 선언 가능 시점 | 핵심 가치 명제 |
|---|---|---|---|
| **A** | Open-Source MVP | npm publish + GitHub 공개 | "왜 이 컴포넌트가 안 떴는지 설명되는 결정 트레이스를 가진 룰 엔진" |
| **B** | 1.0 Stable | semver 1.0 태그 | "운영 환경에서 회귀 없이 채택 가능한 결정 거버넌스 런타임" |
| **C** | Commercial Core | 첫 유료 고객 계약 | "원격 정책 관리, 감사 로그, 승인 워크플로우를 갖춘 거버넌스 SaaS" |
| **D** | Agentic OS 공존 | 외부 에이전트 통합 사양 발행 | "OS 레벨 에이전트와 앱 레벨 결정권을 분리하는 표준 런타임" |

각 단계는 직전 단계의 견고함 없이는 진입할 수 없다. Tier B 진입 전 Tier A 채택자 검증이 선행되어야 하며, Tier C는 Tier B 운영 데이터 위에서만 의미가 있다.

---

## 1. 현재 상태 진단 (2026-04-29 기준)

### 1.1 산출물 인벤토리

| 영역 | 항목 | 상태 |
|---|---|---|
| 핵심 엔진 | `evaluate(ctx, opts)` | 구현 완료, 51개 테스트 통과 |
| 출력 포맷 | `formatTrace` developer/governance 두 모드 | 구현 완료 |
| 결정 뷰 | `summarizeDecision`, `toAuditEvent`, `expectDecision` | 구현 완료 (2026-04-28) |
| 도메인 스타터 | banking, ecommerce, fintech subpath exports | 구현 완료 |
| 입력 검증 | RulePack 버전 강제, 룰 구조 강제, 빈 조건 차단 | 구현 완료 |
| 빌드 산출 | ESM + CJS + DTS, sourcemap, sideEffects:false | 구현 완료 |
| CI | typecheck + test on Node 20/22 | 구현 완료 |
| 배포 워크플로우 | `v*` 태그 → npm publish (provenance) | 작성 완료, 미실행 |
| Playground | `playground/index.html` 정적 데모 | 구현 완료 |
| 문서 | 15개 스펙 문서 + README + 5분 퀵스타트 | 작성 완료 |
| 라이선스 | Apache-2.0 | 적용 완료 |
| Git 이력 | 독립 리포 초기화, MODU 리모트로 push | 완료 |

### 1.2 정량 지표

```
src/      593 LoC  (5 파일)
tests/  1,034 LoC  (4 파일, 51 tests)
docs/   16 markdown (스펙 14 + README + status)
```

### 1.3 의도적 결손 (Phase 1a 종료 시점 비채택 기능)

다음 항목은 Phase 1a 범위 밖으로 의도적으로 제외되었다.

- `PolicyAction`이 `'suppress'` 단일값 (downgrade/replace/escalate/require-review 미구현)
- `ComponentRegistry`는 타입만 존재, 런타임 검증·조회 미수행
- `lockedSlot`은 시간 범위 조건 미지원 (단순 슬롯 고정만 가능)
- `Simulator CLI` 미구현
- `AI assist` 레이어 미진입
- `Hosted control plane` 미진입

이 결손은 현 시점의 정상이며, Tier B에서 일부, Tier C에서 나머지가 채워진다.

---

## 2. Tier A — Open-Source MVP 완성

**진입 조건:** 현재 상태
**종료 조건:** npm 패키지로 외부 개발자가 5분 내 첫 결정 트레이스를 출력할 수 있고, 5명 이상의 비-내부 채택자가 실제로 사용 중이다.

### 2.1 P0 — 외부 도달성 확보

#### 2.1.1 npm 조직 등록 및 첫 배포
- npmjs.com에서 `@tpo` 조직 등록
- GitHub 리포 Secrets에 `NPM_TOKEN` 추가
- `git tag v0.1.0 && git push --tags` 로 publish 워크플로우 트리거
- `npm view @tpo/runtime` 로 publish 검증
- 검증 항목: ESM/CJS dual import, 3개 starters subpath import, DTS 정합성

#### 2.1.2 GitHub 공개 리포 분리
- 현재 `ReliOptic/MODU`의 `tpo/runtime` 브랜치 → 독립 리포로 이전
- 권장: `ReliOptic/tpo-funnel-runtime` 또는 별도 GitHub 조직
- 이전 후 README의 playground 링크(`reliqbit.github.io/tpo-funnel-runtime`) 정상 작동 검증
- GitHub Pages 워크플로우 재실행

#### 2.1.3 changelog + semver 정책 명시
- `CHANGELOG.md` 신규 작성, Keep-a-Changelog 형식
- v0.1.0 항목에 현재까지의 모든 공개 API 기록
- README 또는 `CONTRIBUTING.md`에 semver 약속 명시 (0.x는 minor에 breaking 허용, 1.0부터는 strict semver)

### 2.2 P1 — 채택 마찰 제거

#### 2.2.1 영문 README + 문서 사이트
- 현재 README는 한글·영문 혼재 → 영문 단일화
- `docs/` 디렉토리에 한글 번역본 별도 보관
- VitePress 또는 Astro Starlight로 정적 사이트 구축
- 호스팅: GitHub Pages 또는 Cloudflare Pages

#### 2.2.2 회귀 테스트 보강
- 결정성 테스트: 동일 입력 1,000회 반복 → byte-identical output 검증
- 룰 충돌 테스트: 같은 슬롯·다른 컴포넌트 두 룰이 동시 매칭 → specificity tie-break 검증
- 빈 RulePack 테스트: rules.length === 0 → riskTier 'high', selected 비어있음
- 큰 입력 회귀: 1,000개 룰 + 100개 policy 평가 시간 < 50ms 보장

#### 2.2.3 에러 메시지 사용성 개선
- 현재 `TPOInputError` 메시지는 영문, 기술적
- 메시지 표준 형식: `[필드명] 기대값 — 실제값 — 수정 제안`
- 예: `'rule.confidenceHint' must be in [0, 1] — got 1.5 — clamp to 1.0 or remove`

#### 2.2.4 첫 5인 채택자 시딩
- 개인 네트워크에서 React Native·Next.js 앱 운영자 식별
- 30분 페어 세션 제공, 도입 마찰 측정
- 채택 후 1주일 시점 피드백 수집: "왜 이 라이브러리를 다시 쓸 것인가?"
- 핵심 검증 가설: "suppressed/why-not이 채택 이유다"

### 2.3 P2 — 신뢰 신호

#### 2.3.1 보안 baseline
- `npm audit` 0 high/critical 유지
- GitHub Dependabot 활성화
- SCA: Socket.dev 또는 Snyk 무료 플랜 등록
- secret scanning: GitHub native + git-secrets pre-commit

#### 2.3.2 코드 품질 게이트
- ESLint + Prettier 도입 (현재 미적용)
- typecheck CI 게이트 → 이미 적용됨
- 커버리지: vitest --coverage, 80% 이상 유지

### 2.4 Tier A 종료 검증 체크리스트

- [ ] `npm install @tpo/runtime` 외부에서 성공
- [ ] README 따라 5분 내 첫 governance trace 출력 검증 (5명)
- [ ] 5명의 비-내부 채택자가 1주 이상 운영 중
- [ ] CHANGELOG.md 존재
- [ ] CI 모든 게이트 통과 중
- [ ] `npm audit` 0 high/critical
- [ ] GitHub repo public, Pages playground 작동

---

## 3. Tier B — 1.0 Stable

**진입 조건:** Tier A 종료 검증 완료
**종료 조건:** 운영 환경에서 90일 이상 회귀 없이 사용된 사례 3건 이상, semver 1.0.0 태그 발행.

### 3.1 P0 — 핵심 기능 보강 (Phase 1b)

#### 3.1.1 PolicyAction 확장
현재 `PolicyAction = 'suppress'` 단일값 → 다음 값 추가:

```typescript
type PolicyAction =
  | 'suppress'        // 현재 구현
  | 'downgrade'       // 슬롯 우선순위 강제 하락
  | 'replace'         // 다른 componentKey로 강제 교체
  | 'escalate'        // riskTier 강제 상승 + 트레이스 마킹
  | 'require-review'; // 사람 승인 필요, 출력에서 제외 + reviewQueue 적재
```

각 액션별:
- 신규 타입 정의 (types.ts)
- 평가 로직 분기 (evaluate.ts)
- developer/governance 두 모드 트레이스 출력 형식
- 단위 테스트 5종 추가
- README 예제 추가

#### 3.1.2 ComponentRegistry 런타임 활용
- 현재 `Registry`는 타입만 존재, 평가 시 미사용
- 변경: `evaluate()` 시작 시점에 모든 룰의 `componentKey`가 registry에 존재하는지 검증
- 미정의 키는 `TPOInputError('rule.componentKey', '...')` 발생
- registry 미제공 시 검증 스킵 (현재 동작 유지, backward compat)
- 검증 모드 옵션화: `EvalOptions.strictRegistry?: boolean`

#### 3.1.3 lockedSlot 시간 범위 조건
현재 `LockedSlot`은 무조건 잠금 → 시간 범위 한정 추가:

```typescript
interface LockedSlot {
  readonly slot: string;
  readonly componentKey: string;
  readonly reason: 'business-fixed' | 'ad' | 'compliance' | 'promotion';
  readonly priority?: number;
  readonly activeWhen?: { readonly fromPhase?: string; readonly untilPhase?: string };
}
```

#### 3.1.4 Abstention fallback 명시화
현재 `AbstainedComponent.fallback?: string` 필드 존재하나 미활용 → 룰에서 fallback 지정 가능하게:

```typescript
interface Rule {
  // ...
  readonly fallback?: string; // componentKey
}
```

confidenceHint < threshold 시 fallback이 지정되어 있으면 자동 추가 선택, 트레이스에 명시.

### 3.2 P1 — 운영 도구

#### 3.2.1 Simulator CLI
- 신규 패키지 `@tpo/cli` 또는 `bin` 엔트리
- 기능:
  - `tpo eval <context.json> <options.json>` → JSON 결과 출력
  - `tpo trace <context.json> <options.json> --mode governance` → 텍스트 트레이스
  - `tpo replay <audit.jsonl>` → 감사 로그 파일 회재생, 결과 비교
  - `tpo lint <rules.json>` → 룰팩 정합성 검증

#### 3.2.2 통합 패턴 examples 3종
- `examples/nextjs-app-router/` — 서버 컴포넌트 + 클라이언트 액션
- `examples/react-native-expo/` — 모바일 컨텍스트 (device.type, locale, place)
- `examples/edge-cloudflare-workers/` — 엣지 런타임에서 5ms 이하 평가

#### 3.2.3 도메인별 실제 사례 검증
- banking starter: 1개 이상의 실제 은행 앱에서 운영 데이터 검증
- ecommerce starter: 동일하게 1건
- fintech starter: 동일하게 1건
- 사례별 회고문서 작성: 무엇이 작동했고 무엇이 부족했는가

### 3.3 P2 — 1.0 안정화

#### 3.3.1 API 동결 의식
- 1.0 진입 전 모든 공개 API 리뷰
- breaking change 가능 마지막 시점에서 다음 결정:
  - `EvalOptions.confidenceThreshold` 기본값 (현 0.60) 유지 여부
  - `RiskTier` 결정 임계값 (현 noOutput=high, n>=3=high, ...) 동결 여부
  - `EvalMeta.evaluateMs` 정밀도 (ms vs μs)

#### 3.3.2 성능 벤치마크 SLA
- `bench/` 디렉토리 신설
- 기준: M2 MacBook Air, Node 22
  - 100 rules + 10 policy: < 5ms
  - 1,000 rules + 100 policy: < 50ms
- 회귀 차단: 직전 release 대비 +20% 이상 시 CI fail

#### 3.3.3 호환성 매트릭스
- Node 20, 22, 24 (당시 LTS)
- Bun 1.x
- Deno 2.x
- Cloudflare Workers
- Vercel Edge Runtime
- 각 환경별 smoke test

### 3.4 Tier B 종료 검증 체크리스트

- [ ] 4개 PolicyAction 모두 구현 + 테스트
- [ ] Registry 검증 활성화 모드 작동
- [ ] lockedSlot 시간 범위 작동
- [ ] CLI 4개 명령 모두 작동
- [ ] 3개 도메인 starter 실제 운영 사례 보유
- [ ] 성능 벤치마크 SLA 충족
- [ ] 90일 회귀 없는 운영 사례 3건
- [ ] semver 1.0.0 태그 발행

---

## 4. Tier C — Commercial Core

**진입 조건:** Tier B 종료 검증 완료
**종료 조건:** 첫 유료 고객 계약 체결, MRR 발생.

### 4.1 P0 — Hosted Control Plane

#### 4.1.1 RulePack Authoring UI
- 웹 기반 룰팩 편집기 (Next.js or SvelteKit)
- 기능:
  - 룰 시각 편집 (조건 빌더, 슬롯 매핑, 우선순위 슬라이더)
  - 시뮬레이터 통합 (편집 중 컨텍스트 입력 → 즉시 트레이스)
  - 버전 관리, diff, rollback
  - 승인 워크플로우 (작성자 ≠ 승인자)

#### 4.1.2 Remote RulePack Fetch SDK
- `@tpo/runtime-remote` 신규 패키지
- 기능: `evaluate()` 직전에 원격 RulePack을 ETag 기반 캐시로 fetch
- 오프라인 폴백: 마지막 성공 fetch한 RulePack 로컬 저장
- TTL, retry, circuit breaker

#### 4.1.3 Audit Log 영구 저장
- `toAuditEvent()` 결과를 BigQuery/ClickHouse/Postgres로 적재
- 신규 패키지 `@tpo/audit-sink`
- 어댑터: BigQuery, ClickHouse, Postgres, S3+Athena, OpenTelemetry

### 4.2 P1 — 거버넌스 워크플로우

#### 4.2.1 Approval Queue
- `require-review` policy 액션의 백엔드 큐
- 검토자 알림 (Slack, email)
- 승인/거부 → 다음 evaluate 호출에서 반영

#### 4.2.2 Compliance Reports
- governance trace를 PDF/HTML 보고서로 일·주·월 단위 자동 생성
- 보고서 항목: COMMITMENTS HONORED 횟수, EXCLUDED WITH REASON 분포, 정책 위반 패턴

#### 4.2.3 Premium Vertical Packs
- 각 도메인별 산업 표준 룰팩 (구독)
  - banking: 금융소비자보호법, DSR/LTV/RTI 정책
  - healthcare: HIPAA, 처방 안전 가드레일
  - fintech: KYC/AML, 투자자 적합성

### 4.3 P2 — 분석 및 최적화

#### 4.3.1 Decision Analytics Dashboard
- 어떤 룰이 가장 자주 매칭되는가
- 어떤 policy gate가 가장 자주 트리거되는가
- 어떤 컴포넌트가 가장 자주 abstain되는가
- riskTier 분포의 시계열 변화

#### 4.3.2 Reviewed Learning Loop
- 운영 데이터에서 자동 룰 제안 (사람 검토 필수)
- 자동 채택 절대 금지 (Spec 4 Non-goals 준수)

### 4.4 Tier C 종료 검증 체크리스트

- [ ] Authoring UI 베타 출시
- [ ] Remote RulePack fetch SDK 출시
- [ ] Audit log sink 3개 어댑터 이상 작동
- [ ] Approval Queue 작동
- [ ] Compliance report 자동 생성 작동
- [ ] 1개 이상 vertical pack 출시
- [ ] 첫 유료 고객 계약 체결

---

## 5. Tier D — Agentic OS 공존

**진입 조건:** Tier C 종료 검증 완료
**종료 조건:** OS-level 에이전트 통합 사양 v1 발행, 1개 이상 OS 벤더와 호환성 검증.

### 5.1 External Agent Hint API
- AI 에이전트가 컨텍스트 보강 힌트를 제공할 수 있는 외부 입력 채널
- 단, policy gate를 우회할 수 없음 (Risk 13.6 Mitigation 준수)
- 트레이스에 `aiAssisted: true` 마킹 필수

### 5.2 App-native Handoff Protocol
- OS 에이전트가 앱 결정권을 침범하지 않도록 명시적 핸드오프 프로토콜
- 어떤 결정은 앱이, 어떤 결정은 OS가 (예: 시스템 권한 → OS, UI 슬롯 → 앱)

### 5.3 Context Provider APIs
- iOS App Intents, Android App Actions, Windows AI Hub 통합
- 각 OS에서 TPO context를 표준화된 형태로 추출하는 어댑터

### 5.4 OS-Agent 호환성 실험
- Apple Intelligence, Gemini Nano, Copilot+PC 호환성 검증
- 결정 트레이스가 OS 에이전트 audit log에 통합 가능한지

---

## 6. 횡단 트랙 (모든 Tier 공통)

### 6.1 보안
- secret scanning 상시
- SCA 주간 리뷰
- 의존성 업데이트: 매주 자동 PR (Renovate)
- 보안 취약점 disclosure 정책 (`SECURITY.md`)

### 6.2 성능
- 회귀 게이트: 직전 release 대비 +20% 시 차단
- p99 latency 모니터링 (Tier C부터)

### 6.3 호환성
- Node LTS 매년 추가, 이전 LTS는 2년 후 drop
- 각 Tier 진입 시 호환성 매트릭스 재검증

### 6.4 DX (Developer Experience)
- 에러 메시지 정기 리뷰
- 타입 시그니처 readability 검증
- Playground 시나리오 매 분기 추가

### 6.5 거버넌스
- RFC 프로세스 (Tier B부터)
- breaking change 절차 문서화
- 외부 기여자 가이드라인

---

## 7. 리스크 등록부

| ID | 리스크 | 발생 가능성 | 영향도 | 완화 |
|---|---|---|---|---|
| R-01 | `@tpo` npm 조직명 선점됨 | 중 | 고 | 대안명 `@tpo-runtime`, `@tpo-decisions` 사전 확보 |
| R-02 | 첫 5인 채택자 확보 실패 | 중 | 고 | 30분 페어 세션, 도입 마찰 최소화. 채택 안되면 가설 수정 |
| R-03 | LaunchDarkly/OpenFeature가 유사 기능 선출시 | 중 | 중 | 거버넌스 트레이스·EXCLUDED WITH REASON으로 차별화 명시 |
| R-04 | Phase 1b PolicyAction 확장이 breaking change | 고 | 중 | 0.x 동안만 확장, 1.0 진입 전 동결 |
| R-05 | Tier C 진입 자본 부족 | 고 | 고 | Tier A·B 단계에서 자체 운영 사례로 첫 유료 고객 확보 |
| R-06 | OS 에이전트가 앱 레벨 결정권 흡수 | 저 | 매우 고 | Tier D 핸드오프 프로토콜 선제적 표준화 |
| R-07 | 도메인 검증 사례 부재 (banking/healthcare) | 중 | 고 | Tier B P1.3에서 명시적 우선순위 |
| R-08 | 라이선스 분쟁 (Apache-2.0의 patent grant) | 저 | 중 | 의존성 라이선스 전수조사, CLA 검토 |

---

## 8. 마일스톤 게이트

| 마일스톤 | 시점 | 진입 조건 | 종료 게이트 |
|---|---|---|---|
| M1 | Week 1 | 현재 | npm publish 성공, 외부 install 검증 |
| M2 | Week 4 | M1 종료 | 5명 채택자 1주 이상 운영, 피드백 수집 |
| M3 | Week 8 | M2 종료 | Phase 1b PolicyAction 확장 완료 |
| M4 | Week 12 | M3 종료 | Simulator CLI + 통합 examples 3종 |
| M5 | Week 16 | M4 종료 | 도메인 starter 실제 운영 사례 3건 |
| M6 | Week 24 | M5 종료 | 1.0.0 태그, semver freeze |
| M7 | Q3 | M6 종료 | Hosted Control Plane 베타 |
| M8 | Q4 | M7 종료 | 첫 유료 고객 계약 |

각 마일스톤은 종료 게이트 조건이 충족될 때까지 다음 마일스톤 진입을 차단한다.

---

## 9. Definition of Done — 모든 작업 공통

각 작업 항목은 다음을 모두 충족해야 "완료"로 간주한다.

1. 타입 strict, `any` 0건
2. 신규 코드 단위 테스트 100% 커버
3. 회귀 테스트 1건 이상 추가
4. 영문 문서 + 한글 문서 동기화
5. CHANGELOG 항목 추가
6. 외부 호출 경로 모두 에러 처리 + 구조화 로깅 (해당 시)
7. 환경변수는 `config/`에서만 (Tier C 이후)
8. CI 모든 게이트 통과
9. PR 단일 논리적 변경 단위
10. 코드 리뷰 1인 이상 승인 (Tier B부터)

---

## 10. 다음 행동 (Now Queue)

본 문서 작성 직후 즉시 착수 가능한 작업:

1. **npm 조직 등록** (`@tpo` 또는 대안)
2. **GitHub 독립 리포 분리** (현 MODU 브랜치 → 신규 리포)
3. **CHANGELOG.md** 신규 작성
4. **ESLint + Prettier 도입**
5. **첫 채택자 후보 5인 명단 작성**

이후 작업은 M1 게이트 통과 후 M2 진입과 함께 재계획한다.

---

## 부록 A — 본 문서의 갱신 정책

- 마일스톤 종료마다 갱신
- 리스크 등록부는 월 1회 재검토
- 새 Tier 진입 시 직전 Tier의 종료 검증 결과를 본 문서에 박제
- 문서 자체의 versioning: 본 문서 헤더의 작성일 갱신
