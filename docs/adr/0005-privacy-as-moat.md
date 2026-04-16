# ADR-0005: Privacy as Marketing Moat — "당신의 IVF 데이터는 당신의 것입니다"

- Status: **Proposed**
- Date: 2026-04-17
- Related: CPO Review §3.4, §7.3

## Context

CPO Review §7.3:
> *"당신의 IVF 데이터는 당신의 것입니다"* 내러티브는 경쟁 우위. 랜딩·스토어 설명·앱 내 모두에 관통시킬 것.

리프로덕티브 데이터 (난임, 임신, 월경) 는 미국 Dobbs 판결 이후 글로벌 민감도 폭증.
한국 시장에서도 PIPA 강화 + 의료 카테고리에서 신뢰 = 가장 강력한 마케팅 자산.

## Decision

프라이버시를 단순 컴플라이언스가 아니라 **제품 정체성의 코어**로 운영한다.

### 기술 약속
1. **At-rest encryption**: Postgres TDE + R2 client-side encryption (사진 키는 사용자 디바이스에만)
2. **Per-field partner visibility**: 모든 ChapterMemory row 에 `visibility` 컬럼. UI 에서 작성 시점에 명시 토글
3. **No 3rd-party tracker by default**: PostHog 등 제품 분석은 opt-in. 기본 OFF
4. **No ad SDK ever** — 광고 모델 영구 거부 (수익 = 구독)
5. **One-tap export**: 사용자가 자기 데이터를 `.zip` (JSON + 사진) 으로 즉시 다운로드
6. **One-tap delete**: 가입 해지 = 데이터 즉시 파기 (30일 유예 X). 단, archive 챕터는 사용자가 명시적으로 keep 선택 시 보존
7. **No US data routing for KR users**: 한국 사용자 데이터는 ap-northeast-2 region 잔류
8. **App lock = default ON**: 생체 인증을 첫 실행 시 권유 (off 가능하지만 default on)

### 마케팅·UX 약속
1. 랜딩 첫 viewport 에 **"당신의 의료 기록은 당신의 것입니다"** 메시지
2. App Store / Play 첫 스크린샷에 *"광고 없음 · 데이터 판매 없음 · 한국 서버"* 명시
3. Privacy Nutrition Label / Data Safety = 가장 깨끗한 카테고리만 사용
4. 매 분기 **투명성 리포트** 발행 (총 사용자 / 데이터 요청 건 / 위반 사항)
5. 외부 보안 감사 (1년 1회) 결과 공개

### 컴플라이언스 베이스라인
- KR PIPA: 민감정보 별도 동의 inline (Formation step_01 직전), 14세 미만 보호자 동의
- GDPR: data subject rights 자동화 (export/delete API)
- HIPAA: v1 단계에서는 미적용 (KR only). US 진출 시 ADR 갱신 + Supabase Team plan
- Apple Medical Guidelines 1.4.1: "이 앱은 의료기기가 아닙니다" 디스클레이머 onboarding 1회 + 설정 상시
- 식약처: "복약 알림" 기능 의료기기 SW 해당 여부 자문 의뢰 (v1 출시 전)

## Consequences

### 긍정
- 신뢰 = 의료 카테고리의 가장 강한 marketing channel
- 외부 광고비 적게 들어감 (입소문 + 한국 의료 인플루언서 추천 가능)
- 정책/규제 변화에 강건 (가장 엄격한 기준에 맞춰뒀으니 어디든 대응)

### 부정
- 광고 수익 영구 차단 → 구독 100% 의존 (전환율 압박)
- 데이터 분석 어려움 → 제품 의사결정에 정성 데이터 비중 ↑
- E2EE 구현 추가 엔지니어링 비용 (~2-3주)

### 완화
- 구독 가격 모델 (ADR-0006 예정) 에 freemium 강하게
- 익명화·집계 데이터는 별도 동의로 수집 가능 (default off)

## Rejected Alternatives

| 옵션 | 거절 이유 |
|------|-----------|
| 광고 모델 (free + ads) | 의료 카테고리 신뢰 즉시 파괴. moat 자해 |
| 데이터 판매 (anonymized to pharma) | 익명화 부족 사례 빈번 → 한 번의 사고로 영구 평판 손상 |
| HIPAA full from day 1 | KR-only v1 에는 과잉. 비용·복잡도 증가 |

## References

- CPO Review §3.4, §7.3
- ADR-0001, ADR-0003
