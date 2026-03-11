<template>
  <div class="language-switcher">
    <button @click="toggleLanguage" class="lang-btn" :title="currentLang === 'en' ? 'Switch to Chinese' : '切换至英文'">
      <span class="lang-text">{{ currentLang === 'en' ? 'EN' : '中文' }}</span>
    </button>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { locale } = useI18n()

const currentLang = computed(() => locale.value)

const toggleLanguage = () => {
  const newLocale = locale.value === 'en' ? 'zh' : 'en'
  locale.value = newLocale
  // 保存到 localStorage
  localStorage.setItem('locale', newLocale)
}
</script>

<style scoped>
.language-switcher {
  position: fixed;
  top: 1.5rem;
  right: 5rem;
  z-index: 9999;
}

.lang-btn {
  min-width: 60px;
  height: 40px;
  padding: 0 1rem;
  border-radius: 20px;
  border: none;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.lang-btn:hover {
  transform: scale(1.05);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  background: rgba(255, 255, 255, 1);
}

.lang-btn:active {
  transform: scale(0.95);
}

.lang-text {
  font-size: 0.85rem;
  font-weight: 600;
  color: #1d1d1f;
  letter-spacing: 0.5px;
}

/* 移动端适配 */
@media (max-width: 768px) {
  .language-switcher {
    top: 1rem;
    right: 1rem;
  }

  .lang-btn {
    min-width: 50px;
    height: 36px;
    padding: 0 0.8rem;
  }

  .lang-text {
    font-size: 0.8rem;
  }
}
</style>
