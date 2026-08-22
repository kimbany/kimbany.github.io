import { defineConfig } from 'vite';
import aitDevtools from '@apps-in-toss/devtools/unplugin';

export default defineConfig({
  // ait 번들은 정적 파일을 상대경로로 읽는다.
  base: './',
  plugins: [aitDevtools.vite()],
  build: {
    outDir: 'dist',
    // 번들은 압축 해제 기준 100MB 이하여야 한다. 음원·영상은 전부 원격 URL로 둔다.
    assetsInlineLimit: 4096,
  },
});
