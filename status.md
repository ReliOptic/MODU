# Status — TPO Funnel Runtime

## Snapshot
- phase: Phase 1a complete
- completeness: 65%
- last-activity: 2026-04-28
- stack: TypeScript ESM library — pure evaluate() + formatTrace() + playground
- purpose: An event-relative, app-native, policy-bounded journey runtime — a TS library that takes structured user context (Time/Place/Occasion) + rule packs and emits selected components, actions, suppressed items, and an explainable decision trace for trust-sensitive apps

## What Works
- src/types.ts (83 LoC), evaluate.ts (188 LoC), trace.ts (63 LoC), index.ts (8 LoC)
- 19개 테스트 통과 (15 unit/evaluate + 3 unit/trace + 1 integration)
- suppressed 3종: condition-mismatch, locked-displaced, policy-suppress
- playground/index.html: 브라우저 인터랙티브 데모
- GitHub Actions: CI (Node 20/22) + Pages 자동 배포
- README: 코드-trace 출력 정합성 확인

## What Doesn't Work / Missing
- npm publish 미완료 (@tpo/runtime org 소유권 미확인)
- riskTier: policy_hits 반영 여부 최종 확인 필요 (Fix 1 진행 중)
- Phase 1b: downgrade/replace/escalate/require-review policy 미구현
- registry: componentKey 검증 미구현 (Major-1 deferred)
- lockedSlot: 시간 범위 조건 미지원 (Phase 1b)
- 문서 사이트: GitHub README만 존재

## Risk / Blockers
- npm org @tpo 소유권 미확인 → 패키지명 변경 필요할 수 있음
- GitHub repo 미공개 → playground URL 미작동
- Phase 1a 성공 기준 미검증: 첫 채택자로부터 "suppressed/why-not이 이 라이브러리의 이유다" 피드백 수집 전

## Next Actions
1. npm org 확인 후 GitHub repo 공개 + npm publish
2. Show HN 전 개인 네트워크 3-5인 seeding
3. Phase 1b: downgrade/replace 정책, registry 활용 강화
