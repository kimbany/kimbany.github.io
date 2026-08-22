import { defineConfig } from '@apps-in-toss/web-framework/config';

export default defineConfig({
  // 콘솔 등록값과 반드시 일치해야 한다. 변경 불가.
  appName: 'diss4u',
  brand: {
    // 라이트 테마의 주 강조색. 심사 체크리스트상 미니앱은 라이트 모드로 구현한다.
    primaryColor: '#7A5CFF',
  },
  // 카메라·앨범·위치를 쓰지 않는다. 곡 저장은 File.saveBase64로 처리한다.
  permissions: [],
  webBundleDir: 'dist',
});
