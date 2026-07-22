import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // 카카오 개발자 콘솔의 [JavaScript SDK 도메인]에 등록된 주소와 반드시 일치해야 한다.
    // strictPort를 켜지 않으면 5173이 사용 중일 때 Vite가 5174 등으로 옮겨가고,
    // 그러면 도메인이 달라져 지도가 403으로 막힌다. (원인 찾기가 매우 어렵다)
    // 포트 충돌 시 조용히 바꾸는 대신 에러를 내도록 한다.
    port: 5173,
    strictPort: true,
  },
})
