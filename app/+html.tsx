// 웹 전용 root HTML — 모바일 viewport + iOS standalone 모드 대응
// SSR 노드 환경에서만 실행. DOM API 사용 불가.
import { ScrollViewStyleReset } from 'expo-router/html';

export default function Root({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        {/* viewport-fit=cover 로 notch (iPhone safe-area) 대응 */}
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, shrink-to-fit=no, viewport-fit=cover, user-scalable=no"
        />
        <meta name="theme-color" content="#FDF7F4" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="MODU" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="description" content="MODU — Listen to your life." />

        <ScrollViewStyleReset />

        <style dangerouslySetInnerHTML={{ __html: globalCss }} />
      </head>
      <body>{children}</body>
    </html>
  );
}

const globalCss = `
html, body, #root {
  height: 100%;
  margin: 0;
  padding: 0;
  /* 텍스트 렌더링 일관성 (iOS Safari + Chrome) */
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  /* iOS Safari 의 더블탭 줌 방지 */
  touch-action: manipulation;
}
body {
  background-color: #E5E7EB;
  /* 폰트 fallback — Pretendard 미로드 시 */
  font-family: -apple-system, BlinkMacSystemFont, "Pretendard Variable", "Pretendard", "Apple SD Gothic Neo", "Noto Sans KR", "Helvetica Neue", Arial, sans-serif;
}
@media (prefers-color-scheme: dark) {
  body { background-color: #1C1C1E; }
}
/* 데스크톱에서 폰 frame 의 모서리만 살짝 둥글게 (선택) */
@media (min-width: 431px) {
  /* MobileFrame 의 webInner 가 max-width 적용 — 추가 시각 처리는 RN 측에서 */
}
`;
