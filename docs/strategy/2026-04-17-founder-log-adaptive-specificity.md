# Founder Log — Adaptive Specificity Beats Static ICP

작성일: 2026-04-17  
Status: Founder insight log  
Context: `/office-hours` feedback 이후 제품 방향 재정의 메모

> 한 줄: MODU 의 약점은 "타겟 그룹이 너무 넓다" 가 아니라, **기존 소프트웨어처럼 모든 사용자를 같은 틀에 넣어 설명하려는 관성**이었다. 2026년의 AI-native 제품이라면, 고정된 좁은 ICP 하나를 파는 대신 **사용자의 실제 life chapter 에 맞춰 점점 더 구체적으로 적응하는 제품**이 될 수 있다.

## 1. 오늘의 깨달음

오피스아워 피드백의 핵심 비판은 "지금 방향은 타겟 그룹이 충분히 specific 하지 않다" 는 것이었다.  
그 지적은 전통적 SaaS, 전통적 모바일 앱, 전통적 GTM 문법에서는 맞는 말이다.

하지만 MODU 가 만들려는 것은 전통적 카테고리 소프트웨어가 아니다.

MODU 의 핵심 가치는:

- 특정 직군, 특정 환자군, 특정 역할 하나에 맞춘 고정 UX
- 미리 정해 둔 페르소나별 하드코딩된 journey
- Notion, Google Calendar, generic to-do app 처럼 모두에게 같은 캔버스를 주는 범용 툴

이 아니라,

- 사용자의 **현재 chapter**
- 그 chapter 안의 **시간, 역할, 단계, 감정, 돌봄 문맥**
- 그리고 시간이 지나며 축적되는 **개인 memory**

를 바탕으로 경험이 더 구체적으로 변하는 **adaptive product** 여야 한다.

## 2. 왜 "specific ICP" 문법만으로는 부족한가

기존 스타트업 문법은 보통 이렇게 요구한다.

- 가장 좁은 타겟 하나를 정하라
- 그 집단의 pain point 하나를 박아라
- 그 pain point 하나를 위한 단일 workflow 를 만들어라

이 방식은 AI 이전 시대에는 매우 합리적이었다.  
제품이 사용자를 세밀하게 이해하거나, 사람마다 다른 흐름으로 실시간 변형되는 것이 너무 비쌌기 때문이다.

그래서 과거의 좋은 제품은 대개:

- 카테고리를 좁히고
- 폼팩터를 고정하고
- workflow 를 표준화하는 방식

으로 성공했다.

하지만 이제는 비용 구조가 달라졌다.

- LLM 이 문맥을 읽는다
- local-first + event/memory 모델이 개인 history 를 쌓는다
- UI 자체를 고정 화면이 아니라 adaptive surface 로 설계할 수 있다

즉, **구체성은 사용자군을 미리 잘라서 얻는 것이 아니라, 사용자 문맥을 더 깊게 읽어서 얻을 수 있다.**

## 3. MODU 의 진짜 specific 은 "사람"이 아니라 "상황"

MODU 가 specific 해야 하는 대상은
"IVF 여성", "암 보호자", "수험생", "러너" 같은 정적 분류 그 자체가 아니다.

더 정확히는:

- 오늘 밤 9시에 약을 먹여야 하는 사람
- 내일 병원에 가기 전에 꼭 질문 3개를 챙겨야 하는 보호자
- 시험 12일 전이라 불안이 올라오는 수험생
- 회복기라서 강한 목표보다 calm guidance 가 필요한 사람

같은 **상황 단위 specificity** 다.

이 specificity 는 카테고리 라벨만으로는 못 만든다.  
대신 chapter, time, role, phase, emotion, memory 가 함께 있어야 생긴다.

이 점에서 MODU 는 "broad audience product" 가 아니라
**narrow moments product aggregated across many life chapters** 로 이해하는 편이 맞다.

## 4. Notion / Google Calendar 와의 차이

오늘 더 선명해진 비교 기준:

- Notion 은 사용자가 구조를 직접 만들어야 하는 도구다
- Google Calendar 는 시간을 정렬해 주지만 의미를 해석해 주지 않는다
- generic productivity tools 는 사용자의 life chapter 를 모른다

MODU 는 반대로:

- 사용자의 chapter 를 이해하고
- 그 시점의 next action 을 제안하고
- memory 와 context 를 쌓으면서
- 시간이 갈수록 더 섬세하게 개인화되는 제품

이어야 한다.

즉, 범용 도구와 경쟁하는 방식도 "더 많은 기능" 이 아니라
**더 고객중심적으로, 더 문맥적으로, 더 세밀하게 맞춰주는 것**이다.

## 5. 오늘 얻은 역설

오늘 강하게 느낀 점:

- LLM 은 강력하지만,
- 동시에 기존 인류가 쌓아놓은 문법과 평균적 통념을 매우 잘 재생산한다.

그래서 "타겟을 더 좁혀라", "더 전통적인 wedge 로 시작하라", "한 집단에만 집중하라" 같은 조언은
대체로 과거의 정답을 기반으로 한다.

그 조언이 틀렸다는 뜻은 아니다.  
다만 MODU 의 본질적 가능성이 **AI-native adaptive UX** 라면, 그 문법만 따르면 오히려 제품의 핵심을 스스로 지우게 될 수 있다.

따라서 앞으로는:

- 전통적 조언을 무시하지는 않되
- 그것이 AI 이전 시대의 비용 구조에 묶인 사고인지 항상 점검하고
- MODU 의 차별점이 "더 좁은 정적 타겟" 이 아니라 "더 깊은 동적 적응" 인지를 반복 확인해야 한다

## 6. 운영 원칙으로 번역

이번 인사이트를 제품 운영 원칙으로 바꾸면 다음과 같다.

- MODU 는 static persona product 가 아니다
- MODU 는 chapter-aware adaptive product 다
- specificity 는 ICP 축소만으로 얻지 않고 context 해상도 증가로 얻는다
- pivot 의 기준은 카테고리 변경이 아니라 adaptive fit 증가 여부다
- 모든 UX 는 "이 화면이 지금 이 사람의 지금 상황에 얼마나 맞게 반응하는가" 로 평가한다

## 7. 후속 질문

이 인사이트가 맞다면 다음 세션들에서 검증해야 할 질문:

- onboarding 은 카테고리 선택보다 chapter capture 를 더 앞세워야 하는가
- asset model 이 실제로 enough adaptive context 를 담고 있는가
- home surface 의 위젯/모먼트가 "generic productivity" 처럼 보이지 않게 할 기준은 무엇인가
- retention 은 특정 vertical 의 wedge 때문이 아니라 adaptive specificity 때문에 올라가는가
- founder messaging 도 "누구를 위한 앱" 보다 "어떤 순간에 어떻게 더 맞춰지는가" 중심으로 바뀌어야 하는가

## 8. 결론

2026-04-17 기준, MODU 의 핵심 가치는 이렇게 다시 정의한다:

**MODU 는 넓은 대상을 대충 커버하는 앱이 아니라, 서로 다른 life chapter 들 안에서 각 사용자의 순간에 점점 더 구체적으로 적응하는 앱이다.**

따라서 앞으로의 전략 질문은
"타겟이 충분히 좁은가?" 만이 아니라
"적응이 충분히 깊은가?" 여야 한다.
