# MODU 브랜치/릴리즈 레인 전략

작성일: 2026-04-17  
목적: 작업 브랜치, 검증 브랜치, 운영 브랜치를 단순하게 유지하고 백업은 브랜치가 아니라 별도 체계로 관리하기

## 1. 현재 권장 구조

### 브랜치

| 레인 | 브랜치 | 용도 | 원칙 |
|---|---|---|---|
| Production | `main` | 실제 서비스 기준선 | 항상 가장 믿을 수 있는 상태로 유지 |
| Pre-release QA | `staging` | 배포 전 통합 검증, 데모, QA | `main` 후보만 올린다 |
| Work lanes | `feature/*`, `fix/*`, `hotfix/*` | 기능 작업, 수정, 긴급 대응 | 짧게 만들고 빨리 정리 |

### worktree

| 경로 | 연결 브랜치 | 용도 |
|---|---|---|
| `MODU` | `main` | 기본 작업 트리, 운영 기준선 확인 |
| `MODU-staging` | `staging` | QA, 통합 확인, 릴리즈 직전 검수 |

### 백업

백업은 브랜치가 아니라 별도 산출물로 유지한다.

- `git bundle` = 저장소 이력 백업
- `patch` = tracked 변경 백업
- `archive/tgz` = untracked 파일 백업

## 2. 추천 흐름

```text
feature/* or fix/*
        ↓
     staging
        ↓
      main
```

### 해석
- `feature/*`, `fix/*`, `hotfix/*`는 **작업 브랜치**다.
- `staging`은 **검수대**다.
- `main`은 **서비스 기준선**이다.
- `backup`은 브랜치가 아니라 **복구 체계**다.

즉, 작업은 짧은 브랜치에서 하고,
검증은 `staging`에서 하고,
운영 반영은 `main`으로 한다.

## 3. 운영 규칙

### `feature/*`, `fix/*`, `hotfix/*`
- 짧게 만든다
- 목적이 하나인 변경만 담는다
- 오래 쌓아두지 않는다
- 정리되면 `staging`으로 보낸다

### `staging`
- 배포 전 후보만 모은다
- 여기서는 새 실험보다 검증이 우선이다
- 최소 확인 항목:
  - 앱 실행
  - 핵심 화면 렌더링
  - 주요 store/type 오류 없음
  - 테스트/타입체크 통과
  - 데모 흐름 유지

### `main`
- 운영 기준선
- `staging`에서 검증된 것만 반영
- 큰 실험이나 구조 변경을 직접 올리지 않는다

## 4. worktree 역할 분리

현재 별도 worktree:
- 원본 작업 트리: `MODU`
- staging 작업 트리: `MODU-staging`

권장 사용:
- `MODU` = 기본 작업, 기준선 확인, 최종 merge 판단
- `MODU-staging` = QA, 릴리즈 확인, 배포 후보 검수

필요할 때만 추가 worktree를 만든다. 예:
- `MODU-feature-login`
- `MODU-hotfix-crash`

즉, worktree는 **상시 복잡한 구조를 만들기 위한 것**이 아니라,
동시에 다른 브랜치를 열어봐야 할 때만 추가하는 도구다.

## 5. 백업 원칙

중요: `backup` 브랜치를 따로 두는 것은 진짜 백업이 아니다.
같은 저장소 안에 있으므로 실수나 손상 시 함께 영향을 받을 수 있다.

그래서 백업은 저장소 바깥에서 유지한다:
- `git bundle`
- tracked patch
- untracked archive
- 필요하면 원격 미러 저장소

운영 원칙:
- 작업 분리: `branch`
- 작업 공간 분리: `worktree`
- 복구 대비: `bundle/patch/archive`

## 6. 배포 전 체크리스트

`staging` → `main` 직전 최소 체크:

- [ ] `git diff main...staging` 확인
- [ ] 불필요한 실험/WIP 파일 제거
- [ ] 테스트 통과
- [ ] 타입체크 통과
- [ ] 데모/핵심 플로우 수동 확인
- [ ] 환경변수/배포 설정 차이 검토
- [ ] 문서/ADR 업데이트 필요 여부 확인

## 7. 지금 시점의 실전 기본값

지금 MODU에는 아래 기본값을 권장한다:

1. 일상 작업은 `feature/*` 또는 `fix/*`에서 한다.
2. 정리되면 `staging`으로 올린다.
3. QA/데모 확인 후 `main`으로 반영한다.
4. 중요한 전환점마다 `bundle` 백업을 남긴다.

## 8. 명령 예시

```bash
# 새 작업 브랜치 시작
git switch -c feature/home-flow

# staging에서 검증
git switch staging
git merge feature/home-flow

# staging 검증 후 main 반영
git switch main
git merge staging
```

## 9. 한 줄 원칙

> `feature/*`는 만들고, `staging`은 검증하고, `main`은 서비스하고, `backup`은 저장소 밖에 둔다.
