import { createI18n } from 'vue-i18n'
import en from './locales/en.js'
import zh from './locales/zh.js'

// 从 localStorage 获取保存的语言，如果没有则默认为中文
const savedLocale = localStorage.getItem('locale') || 'zh'

const i18n = createI18n({
  legacy: false, // 使用 Composition API 模式
  globalInjection: true, // 允许在模板中使用 $t()
  locale: savedLocale, // 设置默认语言
  fallbackLocale: 'zh', // 设置回退语言
  messages: {
    en,
    zh,
  },
})

export default i18n
