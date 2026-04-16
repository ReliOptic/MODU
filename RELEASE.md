# MODU 출시 가이드

> RN + Expo + EAS 로 iOS / Android / Web 동시 출시.

## 0. 사전 준비 (한 번만)

```bash
# EAS CLI 설치 (글로벌)
npm install -g eas-cli
# 로그인 (Expo 계정)
eas login
# 프로젝트 ID 발급 → app.json 의 extra.eas.projectId 자동 갱신
eas init
```

이후 다음을 직접 채워야 출시 가능:

| 위치 | 항목 |
|------|------|
| `app.json` `ios.bundleIdentifier` | App Store Connect 에서 등록한 ID (e.g. `app.modu.client`) |
| `app.json` `android.package` | Google Play 에서 등록한 패키지 |
| `eas.json` `submit.production.ios.appleId` | Apple ID 이메일 |
| `eas.json` `submit.production.ios.ascAppId` | App Store Connect 의 앱 ID |
| `eas.json` `submit.production.ios.appleTeamId` | Apple Developer Team ID |
| `secrets/google-play-service-account.json` | Google Play Console → API → 서비스 계정 키 (gitignore) |

## 1. 환경변수

`.env.example` 복사 → `.env` 작성 → 로컬 개발 가능.
EAS Build 에서는 환경변수를 EAS Secrets 으로 등록:

```bash
eas secret:create --name EXPO_PUBLIC_SUPABASE_URL --value https://...
eas secret:create --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value ...
eas secret:create --name ANTHROPIC_API_KEY --value sk-ant-...
```

## 2. 빌드 명령

| 목적 | 명령 |
|------|------|
| iOS 시뮬레이터 (개발용) | `eas build --profile development --platform ios` |
| Android APK (테스터 배포) | `eas build --profile preview --platform android` |
| iOS / Android 동시 (운영) | `eas build --profile production --platform all` |
| 웹 정적 빌드 | `npx expo export --platform web --output-dir dist` |

## 3. 스토어 제출

```bash
# iOS → App Store Connect (TestFlight 자동 업로드)
eas submit --platform ios --latest
# Android → Google Play Internal Track
eas submit --platform android --latest
```

## 4. OTA 업데이트 (네이티브 코드 변경 없을 때)

```bash
eas update --channel production --message "버그 수정: …"
```

## 5. 웹 배포 옵션

`dist/` 를 정적 호스팅:
- **Vercel**: `vercel deploy dist`
- **Netlify**: `netlify deploy --dir dist --prod`
- **Cloudflare Pages**: 저장소 연결 후 build command 만 설정 (`npx expo export --platform web --output-dir dist`)

## 6. 버전 정책

- `app.json` `version` 은 사용자 노출 (e.g. `0.1.0`).
- `runtimeVersion.policy: appVersion` 으로 OTA 업데이트가 호환 가능한 버전끼리만 적용됨.
- 네이티브 코드(또는 신규 expo plugin) 변경 시 `version` 을 올려야 OTA 가 충돌 없이 분리됨.

## 7. 체크리스트 (출시 직전)

- [ ] `npx tsc --noEmit` 0 errors
- [ ] `npx jest` 모든 테스트 통과 (jest-expo preset 등록 후)
- [ ] iOS / Android 실 디바이스에서 Formation → Asset 생성 → 전환까지 1회 통과
- [ ] privacy policy URL, support URL 작성
- [ ] App Store screenshots (6.7" iPhone, 6.5" iPhone, 12.9" iPad)
- [ ] Google Play feature graphic + screenshots
- [ ] 마이크 권한 사용 설명 문구 검수
- [ ] 한국어 / 영어 메타데이터
