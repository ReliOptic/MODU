// Expo SDK 50+ : babel-preset-expo handles reanimated automatically.
// 본 파일은 명시적 plugin 보장 + 향후 추가 plugin 의 hook 지점으로 유지.
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // 'react-native-reanimated/plugin' 는 babel-preset-expo 가 자동 처리.
      // worklet 관련 에러 발생 시 아래 줄 주석 해제 (단, 중복 적용 시 build 오류).
      // 'react-native-reanimated/plugin',
    ],
  };
};
