# iPhone 데모 설치 가이드

> 목적: 투자자/advisor 시연용으로 본인 iPhone 에 MODU 를 띄우기.
> 두 가지 경로: **(A) Expo Go** = 5분, 코드 수정 즉시 반영. **(B) EAS dev build** = 30분, 자체 IPA, 오프라인 가능.

---

## 사전 환경

- Node 22 / npm 10
- Expo CLI 자동 (npx)
- iPhone (iOS 16+)
- 본인 Apple ID (B 경로만 필요)

데모용 환경변수 설정 (`.env.local` 에 추가):

```bash
EXPO_PUBLIC_DEMO_MODE=1            # Demo Control Panel 우하단 표시 + mock asset 자동 시드
EXPO_PUBLIC_DEV_MESSAGES=0         # 빈 탭은 사용자 카피 ("곧 만나요") 로
EXPO_PUBLIC_SUPABASE_URL=          # 비워두면 Supabase 호출 stub (시연 가능)
EXPO_PUBLIC_SUPABASE_ANON_KEY=
```

---

## (A) Expo Go — 5분, 가장 빠른 경로

### 1. Expo Go 앱 설치
iPhone App Store → "Expo Go" 검색 → 설치.

### 2. 개발 서버 실행 (LAN 또는 tunnel)

같은 Wi-Fi 인 경우:
```bash
cd /home/reliqbit/project/MODU/modu
npx expo start
```

다른 네트워크 / WSL / 회사 Wi-Fi 인 경우:
```bash
npx expo start --tunnel
```

### 3. iPhone 에서 접속
- 콘솔에 표시된 QR 코드를 iPhone 카메라로 스캔
- "Open in Expo Go" 탭

### 4. 데모 흐름 (5분 시연 시나리오)

1. 앱 진입 → 헤더의 **"시험관 3회차 ▾"** 가 보임 (mock seed)
2. 우하단 **◉** 아이콘 → Demo Control Panel
3. **"💉 주사 30분 전"** 선택 → InjectionTimeline 이 최상단으로 라이브 재배치
4. **"💊 항암 진행 중"** 선택 → 자동으로 "어머니 항암" 에셋으로 전환 + ChapterRitualOverlay (920ms)
5. **"🛌 항암 다음 날"** 선택 → 큰 카드 demote, prev_visit_memo / medication_list promote
6. **"🌌 새벽 3시"** 선택 → AmbientPalette dim/cool (Phase β 구현 후 활성)

### 5. 주의

- 모든 Anthropic AI 호출은 stub (Supabase 키 없음) — narrative 는 mock data 의 정적 문구
- 카메라 권한은 첫 사용 시 prompt
- 음성은 placeholder (실제 STT 미연동)

---

## (B) EAS dev build — 자체 IPA, 30분

데모를 *오프라인으로* 또는 *Expo Go 의존 없이* 보여주고 싶을 때.

### 1. 사전
```bash
npm install -g eas-cli
eas login
cd /home/reliqbit/project/MODU/modu
eas init                   # extra.eas.projectId 자동 갱신
```

### 2. iOS Provisioning
```bash
eas credentials              # Apple ID 입력 → Distribution Certificate / Provisioning Profile 자동
```

### 3. Dev build (시뮬레이터 X, 실기기 OK)
```bash
eas build --profile development --platform ios
```

### 4. 설치
- 빌드 완료 → EAS 가 .ipa 다운로드 링크 또는 QR 제공
- iPhone 에서 QR 스캔 → 설치 (Apple ID 신뢰 필요: 설정 → 일반 → VPN 및 기기 관리)

### 5. 실행
```bash
npx expo start --dev-client    # dev client 가 connect 할 metro server
```

iPhone 에서 MODU dev client 앱 실행 → metro 자동 connect → 코드 변경 hot reload.

---

## (C) TestFlight — 외부 베타 (5명 이상 시연 시)

### 1. Production build
```bash
eas build --profile production --platform ios
```

### 2. App Store Connect 업로드
```bash
eas submit --platform ios --latest
```

### 3. App Store Connect 에서 TestFlight → 외부 테스터 그룹 생성 → 이메일 초대.

(첫 업로드 시 Apple 의 베타 심사 1-2일 소요)

---

## 시연 체크리스트

- [ ] `EXPO_PUBLIC_DEMO_MODE=1` 설정 확인
- [ ] mock asset 3개 (시험관/보리/어머니 항암) 정상 표시
- [ ] Demo Control Panel 우하단 ◉ 정상 작동
- [ ] 시나리오 클릭 시 ChapterRitualOverlay 920ms 재생
- [ ] 위젯 재배치가 LayoutAnimation 으로 부드럽게 전환
- [ ] 헤더 ▾ 탭 시 BottomSheet (iOS) / Modal (web) 정상
- [ ] Formation 진입 (＋새 에셋) → numbered preset list 정상
- [ ] (네이티브만) 챕터 전환 시 햅틱 (selection + light) 작동

---

## 트러블슈팅

| 증상 | 원인 | 해결 |
|------|------|------|
| Expo Go 가 connect 안됨 | 네트워크 격리 | `--tunnel` 플래그 |
| mock asset 안 보임 | DEMO_MODE 환경변수 미적용 | `.env.local` 추가 후 `npx expo start --clear` |
| ChapterRitualOverlay 깜빡임 | reanimated 캐시 | `npx expo start --clear` |
| iPhone 에 dev client 설치 거부 | Apple ID 미신뢰 | 설정 → 일반 → VPN 및 기기 관리 → 신뢰 |
| Demo panel 이 검은 박스만 | BlurView 미지원 환경 | web 에서는 정상 (solid bg fallback) |
