<template>
  <div class="apple-layer">
    <!-- 登录按钮/用户头像 -->
    <div class="auth-section">
      <!-- 未登录：显示登录按钮 -->
      <router-link v-if="!isLoggedIn" to="/auth" class="sign-in-btn">
        {{ $t('common.signIn') }}
      </router-link>
      
      <!-- 已登录：显示用户头像 -->
      <div v-else class="user-avatar" @click="handleAvatarClick">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
          <circle cx="12" cy="7" r="4"></circle>
        </svg>
      </div>
    </div>
    
    <!-- 这里的类名 .slogan 会被父组件 GSAP 抓取 -->
    <div class="slogan">The new era of functional fashion</div>
    
    <!-- Apple 风格滚动提示 -->
    <div class="scroll-hint-wrapper">
      <div class="scroll-icon">
        <svg width="24" height="24" viewBox="0 0 24 24">
          <path class="chevron-arrow" d="M6 9l6 6 6-6"></path>
        </svg>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '../composables/useAuth'

const router = useRouter()
const { isAuthenticated } = useAuth()

// 登录状态从全局状态获取
const isLoggedIn = computed(() => isAuthenticated.value)

const handleAvatarClick = () => {
  // 跳转到订单页面
  router.push('/orders')
}
</script>

<style scoped>
/* 必须固定定位，叠在最上面 */
.apple-layer {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100vh;
  z-index: 10; /* 层级高 */
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #f5f5f7;
  /* 阻止点击穿透，但动画结束后父组件会把它 pointer-events: none */
}

.slogan {
  font-size: 5rem;
  font-weight: 800;
  letter-spacing: -2px;
  color: #000;
  text-align: center;
}

/* 登录按钮/用户头像区域 */
.auth-section {
  position: fixed;
  top: 1.5rem;
  right: 1.8rem;
  z-index: 100;
}

/* 登录按钮样式 */
.sign-in-btn {
  display: inline-block;
  background: #000;
  color: white;
  text-decoration: none;
  border-radius: 100px;
  padding: 0.5rem 1.5rem 0.7rem 1.5rem;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.sign-in-btn:hover {
  background: #2d2d2f;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.sign-in-btn:active {
  transform: translateY(0);
}

/* 用户头像样式 */
.user-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  background: white;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #1d1d1f;
}

.user-avatar:hover {
  transform: scale(1.05);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.user-avatar:active {
  transform: scale(0.95);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

/* Apple 风格滚动提示 */
.scroll-hint-wrapper {
  position: absolute;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  opacity: 1;
  transition: opacity 0.6s cubic-bezier(0.4, 0, 0.2, 1), 
              filter 0.6s cubic-bezier(0.4, 0, 0.2, 1), 
              transform 0.6s cubic-bezier(0.4, 0, 0.2, 1);
  pointer-events: none;
  z-index: 100;
}

.scroll-hint-wrapper.hidden {
  opacity: 0;
  filter: blur(10px);
  transform: translateX(-50%) translateY(-20px);
}

.scroll-text {
  font-size: 12px;
  font-weight: 800;
  color: #000;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  opacity: 0.8;
}

.scroll-icon {
  width: 24px;
  height: 24px;
  display: flex;
  justify-content: center;
  align-items: center;
}

.chevron-arrow {
  fill: none;
  stroke: #000;
  stroke-width: 2.5;
  stroke-linecap: round;
  stroke-linejoin: round;
  opacity: 0;
  animation: scroll-flow 2.5s infinite;
}

@keyframes scroll-flow {
  0% {
    transform: translateY(-6px);
    opacity: 0;
  }
  30% {
    opacity: 1;
  }
  60% {
    opacity: 1;
  }
  100% {
    transform: translateY(10px);
    opacity: 0;
  }
}
</style>