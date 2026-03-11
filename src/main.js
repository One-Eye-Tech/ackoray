import { createApp } from 'vue'
import { MotionPlugin } from '@vueuse/motion'
import App from './App.vue'
import router from './router'
import i18n from './i18n'
import { useAuth } from './composables/useAuth'

// 初始化登录状态
const { initAuth } = useAuth()
initAuth()

createApp(App).use(router).use(MotionPlugin).use(i18n).mount('#app')
