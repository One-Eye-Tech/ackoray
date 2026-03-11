import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
  ],
  base: '/',
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
  define: {
    global: 'globalThis',
  },
  server: {
    host: '0.0.0.0', // 允许局域网访问
    port: 5173, // 默认端口
    strictPort: false, // 如果端口被占用，自动尝试下一个可用端口
    hmr: true,
    proxy: {
      /**
       * 所有以 /api 开头的请求，开发环境下都转发到后端服务
       * 这样浏览器看到的始终是当前页面同源（http://<你的IP>:5173）的请求
       * 手机只需要能访问前端端口（5173），不需要直接访问后端端口（8081）
       */
      '/api': {
        target: 'http://192.168.31.46:8081', // 后端服务地址，如有变化只改这里
        changeOrigin: true,
        // 如果后端不是以 /api 开头，也可以在这里做路径重写
        // rewrite: path => path.replace(/^\/api/, ''),
      },
    },
  },
})
