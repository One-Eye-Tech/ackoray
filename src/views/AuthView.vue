<script setup>
import { ref, nextTick, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useAuth } from '../composables/useAuth'
import { authAPI } from '@/api'

const vueRouter = useRouter()
const { login } = useAuth()
const { t } = useI18n()

// 组件销毁时清理计时器
onUnmounted(() => {
  if (countdownTimer) {
    clearInterval(countdownTimer)
    countdownTimer = null
  }
})

const currentView = ref('login')

// 成功类型：login, register, forgot
const successType = ref('login')

// 表单数据
const loginForm = ref({
  email: '',
  password: ''
})

const registerForm = ref({
  name: '',
  email: '',
  password: '',
  code: '' // 验证码
})

const forgotForm = ref({
  email: '',
  code: '' // 验证码
})

const resetPasswordForm = ref({
  newPassword: '',
  confirmPassword: ''
})

// 密码显示状态
const showLoginPassword = ref(false)
const showRegisterPassword = ref(false)
const showNewPassword = ref(false)
const showConfirmPassword = ref(false)

// 切换密码显示
const togglePasswordVisibility = (field) => {
  switch(field) {
    case 'login':
      showLoginPassword.value = !showLoginPassword.value
      break
    case 'register':
      showRegisterPassword.value = !showRegisterPassword.value
      break
    case 'new':
      showNewPassword.value = !showNewPassword.value
      break
    case 'confirm':
      showConfirmPassword.value = !showConfirmPassword.value
      break
  }
}

// 验证码倒计时
const countdown = ref(0)
const canResend = ref(false)
let countdownTimer = null

const otp1 = ref(null)
const otp2 = ref(null)
const otp3 = ref(null)
const otp4 = ref(null)

// 视图引用
const viewRefs = {
  login: ref(null),
  register: ref(null),
  forgot: ref(null),
  verify: ref(null),
  resetPassword: ref(null),
  success: ref(null)
}

// 启动倒计时
const startCountdown = () => {
  countdown.value = 60
  canResend.value = false
  
  // 清除旧的计时器
  if (countdownTimer) {
    clearInterval(countdownTimer)
  }
  
  countdownTimer = setInterval(() => {
    countdown.value--
    if (countdown.value <= 0) {
      clearInterval(countdownTimer)
      countdownTimer = null
      canResend.value = true
    }
  }, 1000)
}

const router = (targetId) => {
  if (targetId === currentView.value) return
  
  const currentEl = viewRefs[currentView.value].value
  const targetEl = viewRefs[targetId].value
  
  if (!currentEl || !targetEl) return
  
  // 如果跳转到验证码页面，启动倒计时
  if (targetId === 'verify') {
    nextTick(() => {
      startCountdown()
      // 聚焦到第一个输入框
      otp1.value?.focus()
    })
  }
  
  // 1. Trigger Exit Animation
  currentEl.classList.remove('animate-enter')
  currentEl.classList.add('animate-exit')
  
  // 2. Wait for exit to finish, then switch
  setTimeout(async () => {
    // Hide current view
    currentEl.classList.remove('active', 'animate-exit')
    
    // Update reactive state to show target view
    currentView.value = targetId
    
    // Wait for Vue to update DOM
    await nextTick()
    
    // Force reflow to restart animation
    void targetEl.offsetWidth
    
    targetEl.classList.add('active', 'animate-enter')
    
  }, 300) // Matches CSS zoomExit duration
}

// OTP Input Logic
const handleOtpInput = (e, index) => {
  const otpInputs = [otp1.value, otp2.value, otp3.value, otp4.value]
  if (e.target.value.length === 1 && index < otpInputs.length - 1) {
    otpInputs[index + 1].focus()
  }
}

const handleOtpKeydown = (e, index) => {
  const otpInputs = [otp1.value, otp2.value, otp3.value, otp4.value]
  if (e.key === 'Backspace' && e.target.value === '' && index > 0) {
    otpInputs[index - 1].focus()
  }
}

// 登录处理
const handleLogin = async (e) => {
  const form = e.target.closest('.view-section')
  const inputs = form.querySelectorAll('input')
  
  // 检查浏览器原生验证
  let isValid = true
  inputs.forEach(input => {
    if (!input.checkValidity()) {
      input.reportValidity()
      isValid = false
    }
  })
  
  if (!isValid) return
  
  try {
    // 调用后端登录API（默认记住登录状态7天）
    const res = await authAPI.login({
      email: loginForm.value.email,
      password: loginForm.value.password,
      rememberMe: true
    })
    
    // 检查响应数据结构
    if (!res.data || !res.data.token) {
      alert(t('auth.loginTokenError'))
      return
    }
    
    // 保存token和用户信息（7天有效期）
    localStorage.setItem('token', res.data.token)
    localStorage.setItem('user', JSON.stringify(res.data.user))
    
    // 更新全局用户状态
    login({
      name: res.data.user.username || res.data.user.email.split('@')[0],
      email: res.data.user.email,
      avatar: `https://ui-avatars.com/api/?name=${res.data.user.username || res.data.user.email.split('@')[0]}&background=0D8ABC&color=fff&size=128`
    })
    
    // 显示成功页面
    successType.value = 'login'
    router('success')
    
  } catch (error) {
    console.error('登录错误:', error)
    alert(error.message || t('auth.loginError'))
  }
}

// 重新发送验证码
const handleResendCode = async () => {
  if (!canResend.value) return
  
  try {
    // 判断是注册还是重置密码
    const email = registerForm.value.name ? registerForm.value.email : forgotForm.value.email
    
    if (registerForm.value.name) {
      // 注册流程
      await authAPI.sendRegisterCode(email)
    } else {
      // 重置密码流程
      await authAPI.sendResetCode(email)
    }
    
    // 重新启动倒计时
    startCountdown()
    
  } catch (error) {
    alert(error.message || t('auth.sendCodeError'))
  }
}

// 注册处理 - 发送验证码
const handleRegister = async (e) => {
  const form = e.target.closest('.view-section')
  const inputs = form.querySelectorAll('input')
  
  // 检查浏览器原生验证
  let isValid = true
  inputs.forEach(input => {
    if (!input.checkValidity()) {
      input.reportValidity()
      isValid = false
    }
  })
  
  if (!isValid) return
  
  try {
    // 发送注册验证码
    await authAPI.sendRegisterCode(registerForm.value.email)
    // 跳转到验证码页面
    router('verify')
    
  } catch (error) {
    alert(error.message || t('auth.sendCodeError'))
  }
}

// 发送验证码处理（忘记密码）
const handleSendCode = async (e) => {
  const form = e.target.closest('.view-section')
  const input = form.querySelector('input')
  
  // 检查浏览器原生验证
  if (!input.checkValidity()) {
    input.reportValidity()
    return
  }
  
  try {
    // 发送重置密码验证码
    await authAPI.sendResetCode(forgotForm.value.email)
    // 跳转到验证码页面
    router('verify')
    
  } catch (error) {
    alert(error.message || t('auth.sendCodeError'))
  }
}

// 验证码验证后的处理（注册或忘记密码）
const handleVerifySuccess = async (e) => {
  const form = e.target.closest('.view-section')
  const inputs = form.querySelectorAll('.otp-input')
  
  // 检查浏览器原生验证
  let isValid = true
  inputs.forEach(input => {
    if (!input.checkValidity()) {
      input.reportValidity()
      isValid = false
    }
  })
  
  if (!isValid) return
  
  // 组合验证码
  const code = `${otp1.value.value}${otp2.value.value}${otp3.value.value}${otp4.value.value}`
  
  // 根据之前的流程判断是注册还是忘记密码
  if (registerForm.value.name) {
    // 注册流程
    try {
      registerForm.value.code = code
      await authAPI.register({
        username: registerForm.value.name,
        email: registerForm.value.email,
        password: registerForm.value.password,
        code: code
      })
      
      // 注册成功，跳转到成功页面
      successType.value = 'register'
      router('success')
      
      // 清空表单
      registerForm.value = { name: '', email: '', password: '', code: '' }
      otp1.value.value = ''
      otp2.value.value = ''
      otp3.value.value = ''
      otp4.value.value = ''
      
    } catch (error) {
      alert(error.message || t('auth.registerError'))
    }
  } else {
    // 忘记密码流程：保存验证码，跳转到重置密码表单
    forgotForm.value.code = code
    router('resetPassword')
  }
}

// 重置密码处理
const handleResetPassword = async (e) => {
  const form = e.target.closest('.view-section')
  const inputs = form.querySelectorAll('input')
  
  // 检查浏览器原生验证
  let isValid = true
  inputs.forEach(input => {
    if (!input.checkValidity()) {
      input.reportValidity()
      isValid = false
    }
  })
  
  if (!isValid) return
  
  // 检查密码是否匹配
  if (resetPasswordForm.value.newPassword !== resetPasswordForm.value.confirmPassword) {
    alert(t('auth.passwordMismatch'))
    return
  }
  
  try {
    // 调用重置密码API
    await authAPI.resetPassword({
      email: forgotForm.value.email,
      code: forgotForm.value.code,
      newPassword: resetPasswordForm.value.newPassword
    })
    
    // 重置成功，跳转到成功页面
    successType.value = 'forgot'
    router('success')
    
    // 清空表单
    forgotForm.value = { email: '', code: '' }
    resetPasswordForm.value = { newPassword: '', confirmPassword: '' }
    
  } catch (error) {
    alert(error.message || t('auth.resetPasswordError'))
  }
}

// 成功页面按钮点击处理
const handleSuccessClick = () => {
  if (successType.value === 'login') {
    // 清除密码修改标记（如果存在）
    localStorage.removeItem('passwordChanged')
    // 登录成功 → 跳转到首页
    vueRouter.push('/')
  } else if (successType.value === 'register') {
    // 注册成功 → 跳转到登录页
    router('login')
  } else {
    // 修改密码成功 → 跳转到登录页
    router('login')
  }
}
</script>

<template>
  <div class="auth-page">
    <!-- Ambient Background -->
    <div class="ambient-bg">
      <div class="orb orb-1"></div>
      <div class="orb orb-2"></div>
      <div class="orb orb-3"></div>
    </div>

    <!-- Main App Container -->
    <div class="card-container">

      <!-- 1. LOGIN VIEW -->
      <div 
        v-show="currentView === 'login'"
        :ref="el => viewRefs.login.value = el"
        class="view-section active animate-enter"
      >
        <div class="auth-header">
          <button @click="vueRouter.push('/')" class="back-btn">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="m15 18-6-6 6-6"/>
            </svg>
          </button>
          <div class="header-content">
            <h1>{{ $t('auth.signInTitle') }}</h1>
            <p class="subtitle">{{ $t('auth.signInSubtitle') }}</p>
          </div>
        </div>
        
        <div class="input-group">
          <input 
            type="email" 
            :placeholder="$t('auth.emailPlaceholder')" 
            v-model="loginForm.email"
            required
          >
        </div>
        <div class="input-group">
          <div class="password-input-wrapper">
            <input 
              :type="showLoginPassword ? 'text' : 'password'" 
              :placeholder="$t('auth.passwordPlaceholder')" 
              v-model="loginForm.password"
              required
              minlength="6"
            >
            <button 
              type="button" 
              class="password-toggle-btn" 
              @click="togglePasswordVisibility('login')"
              tabindex="-1"
            >
              <svg v-if="!showLoginPassword" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                <circle cx="12" cy="12" r="3"></circle>
              </svg>
              <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                <line x1="1" y1="1" x2="23" y2="23"></line>
              </svg>
            </button>
          </div>
        </div>
        
        <div style="width:100%; text-align:right; margin-bottom:20px;">
          <span class="link-text" style="font-size:13px; margin-top:0;" @click="router('forgot')">{{ $t('auth.forgotPassword') }}</span>
        </div>

        <button class="btn-primary" type="submit" @click.prevent="handleLogin">{{ $t('auth.signInButton') }}</button>
        
        <p class="link-text">
          {{ $t('auth.newToAckoray') }} <span @click="router('register')">{{ $t('auth.createAccount') }}</span>
        </p>
      </div>

      <!-- 2. REGISTER VIEW -->
      <div 
        v-show="currentView === 'register'"
        :ref="el => viewRefs.register.value = el"
        class="view-section"
      >
        <div class="auth-header">
          <button @click="vueRouter.push('/')" class="back-btn">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="m15 18-6-6 6-6"/>
            </svg>
          </button>
          <div class="header-content">
            <h1>{{ $t('auth.createAccountTitle') }}</h1>
            <p class="subtitle">{{ $t('auth.signUpSubtitle') }}</p>
          </div>
        </div>
        
        <div class="input-group">
          <input 
            type="text" 
            :placeholder="$t('auth.fullNamePlaceholder')" 
            v-model="registerForm.name"
            required
            minlength="2"
          >
        </div>
        <div class="input-group">
          <input 
            type="email" 
            :placeholder="$t('auth.emailPlaceholder')" 
            v-model="registerForm.email"
            required
          >
        </div>
        <div class="input-group">
          <div class="password-input-wrapper">
            <input 
              :type="showRegisterPassword ? 'text' : 'password'" 
              :placeholder="$t('auth.createPasswordPlaceholder')" 
              v-model="registerForm.password"
              required
              minlength="6"
            >
            <button 
              type="button" 
              class="password-toggle-btn" 
              @click="togglePasswordVisibility('register')"
              tabindex="-1"
            >
              <svg v-if="!showRegisterPassword" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                <circle cx="12" cy="12" r="3"></circle>
              </svg>
              <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                <line x1="1" y1="1" x2="23" y2="23"></line>
              </svg>
            </button>
          </div>
        </div>

        <button class="btn-primary" type="submit" @click.prevent="handleRegister">{{ $t('auth.continueButton') }}</button>
        
        <p class="link-text">
          {{ $t('auth.alreadyMember') }} <span @click="router('login')">{{ $t('auth.signInButton') }}</span>
        </p>
      </div>

      <!-- 3. FORGOT PASSWORD VIEW -->
      <div 
        v-show="currentView === 'forgot'"
        :ref="el => viewRefs.forgot.value = el"
        class="view-section"
      >
        <h1>{{ $t('auth.resetPasswordTitle') }}</h1>
        <p class="subtitle">{{ $t('auth.resetPasswordSubtitle') }}</p>
        
        <div class="input-group">
          <input 
            type="email" 
            :placeholder="$t('auth.emailPlaceholder')"
            v-model="forgotForm.email"
            required
          >
        </div>

        <button class="btn-primary" type="submit" @click.prevent="handleSendCode">{{ $t('auth.sendCodeButton') }}</button>
        
        <p class="link-text">
          <span @click="router('login')">{{ $t('auth.backToSignIn') }}</span>
        </p>
      </div>

      <!-- 4. VERIFY CODE (OTP) VIEW -->
      <div 
        v-show="currentView === 'verify'"
        :ref="el => viewRefs.verify.value = el"
        class="view-section"
      >
        <h1>{{ $t('auth.verificationTitle') }}</h1>
        <p class="subtitle">{{ $t('auth.verificationSubtitle') }}</p>
        
        <div class="otp-container">
          <input 
            type="text" 
            maxlength="1" 
            class="otp-input" 
            ref="otp1"
            required
            pattern="[0-9]"
            @input="(e) => handleOtpInput(e, 0)"
            @keydown="(e) => handleOtpKeydown(e, 0)"
          >
          <input 
            type="text" 
            maxlength="1" 
            class="otp-input" 
            ref="otp2"
            required
            pattern="[0-9]"
            @input="(e) => handleOtpInput(e, 1)"
            @keydown="(e) => handleOtpKeydown(e, 1)"
          >
          <input 
            type="text" 
            maxlength="1" 
            class="otp-input" 
            ref="otp3"
            required
            pattern="[0-9]"
            @input="(e) => handleOtpInput(e, 2)"
            @keydown="(e) => handleOtpKeydown(e, 2)"
          >
          <input 
            type="text" 
            maxlength="1" 
            class="otp-input" 
            ref="otp4"
            required
            pattern="[0-9]"
            @input="(e) => handleOtpInput(e, 3)"
            @keydown="(e) => handleOtpKeydown(e, 3)"
          >
        </div>

        <button class="btn-primary" type="submit" @click.prevent="handleVerifySuccess">{{ $t('auth.verifyButton') }}</button>
        
        <p class="link-text">
          {{ $t('auth.didntReceive') }} 
          <span v-if="!canResend" class="resend-disabled">{{ countdown }}s</span>
          <span v-else @click="handleResendCode" class="resend-active">{{ $t('auth.resendCode') }}</span>
        </p>
      </div>

      <!-- 5. RESET PASSWORD VIEW -->
      <div 
        v-show="currentView === 'resetPassword'"
        :ref="el => viewRefs.resetPassword.value = el"
        class="view-section"
      >
        <h1>{{ $t('auth.resetPasswordFormTitle') }}</h1>
        <p class="subtitle">{{ $t('auth.resetPasswordFormSubtitle') }}</p>
        
        <div class="input-group">
          <div class="password-input-wrapper">
            <input 
              :type="showNewPassword ? 'text' : 'password'" 
              :placeholder="$t('auth.newPasswordPlaceholder')" 
              v-model="resetPasswordForm.newPassword"
              required
              minlength="6"
            >
            <button 
              type="button" 
              class="password-toggle-btn" 
              @click="togglePasswordVisibility('new')"
              tabindex="-1"
            >
              <svg v-if="!showNewPassword" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                <circle cx="12" cy="12" r="3"></circle>
              </svg>
              <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                <line x1="1" y1="1" x2="23" y2="23"></line>
              </svg>
            </button>
          </div>
        </div>
        <div class="input-group">
          <div class="password-input-wrapper">
            <input 
              :type="showConfirmPassword ? 'text' : 'password'" 
              :placeholder="$t('auth.confirmPasswordPlaceholder')" 
              v-model="resetPasswordForm.confirmPassword"
              required
              minlength="6"
            >
            <button 
              type="button" 
              class="password-toggle-btn" 
              @click="togglePasswordVisibility('confirm')"
              tabindex="-1"
            >
              <svg v-if="!showConfirmPassword" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                <circle cx="12" cy="12" r="3"></circle>
              </svg>
              <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                <line x1="1" y1="1" x2="23" y2="23"></line>
              </svg>
            </button>
          </div>
        </div>

        <button class="btn-primary" type="submit" @click.prevent="handleResetPassword">{{ $t('auth.resetPasswordButton') }}</button>
        
        <p class="link-text">
          <span @click="router('login')">{{ $t('auth.backToSignIn') }}</span>
        </p>
      </div>

      <!-- 6. SUCCESS VIEW -->
      <div 
        v-show="currentView === 'success'"
        :ref="el => viewRefs.success.value = el"
        class="view-section"
      >
        <div class="success-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
        </div>
        
        <!-- 根据成功类型显示不同内容 -->
        <template v-if="successType === 'login'">
          <h1>{{ $t('auth.loginSuccess.title') }}</h1>
          <p class="subtitle">{{ $t('auth.loginSuccess.subtitle') }}</p>
          <button class="btn-primary" @click="handleSuccessClick">{{ $t('auth.loginSuccess.button') }}</button>
        </template>
        
        <template v-else-if="successType === 'register'">
          <h1>{{ $t('auth.registerSuccess.title') }}</h1>
          <p class="subtitle">{{ $t('auth.registerSuccess.subtitle') }}</p>
          <button class="btn-primary" @click="handleSuccessClick">{{ $t('auth.registerSuccess.button') }}</button>
        </template>
        
        <template v-else>
          <h1>{{ $t('auth.forgotSuccess.title') }}</h1>
          <p class="subtitle">{{ $t('auth.forgotSuccess.subtitle') }}</p>
          <button class="btn-primary" @click="handleSuccessClick">{{ $t('auth.forgotSuccess.button') }}</button>
        </template>
      </div>

    </div>
  </div>
</template>

<style scoped>
/* 
 * SYSTEM RESET & VARIABLES
 * Apple-style color palette and physics constants 
 */
.auth-page {
  /* CSS Variables */
  --c-bg: #f5f5f7;
  --c-text-primary: #000;
  --c-text-secondary: #666;
  --c-accent: #0071e3; /* Apple Blue */
  --c-input-bg: #e8e8ed; /* Slightly darker for contrast on glass */
  --c-white-glass: rgba(255, 255, 255, 0.75);
  --c-shadow-layer-1: 0px 4px 24px rgba(0, 0, 0, 0.04);
  --c-shadow-layer-2: 0px 20px 40px rgba(0, 0, 0, 0.08);
  
  /* Spring Physics - The "Jelly" feel */
  --ease-elastic: cubic-bezier(0.34, 1.56, 0.64, 1);
  --ease-smooth: cubic-bezier(0.16, 1, 0.3, 1);
  
  /* Layout */
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: var(--c-bg);
  display: flex;
  justify-content: center;
  align-items: center;
  overflow: hidden;
  color: var(--c-text-primary);
}

/* 
 * AMBIENT BACKGROUND 
 * Creates the subtle shifting mesh behind the glass 
 */
.ambient-bg {
  position: absolute;
  width: 100vw;
  height: 100vh;
  z-index: -1;
  overflow: hidden;
}

.orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  opacity: 0;
  animation: float 20s infinite ease-in-out alternate;
  display: none;
}

.orb-1 { width: 600px; height: 600px; background: #e0f2ff; top: -10%; left: -10%; animation-delay: 0s; }
.orb-2 { width: 500px; height: 500px; background: #f0e6ff; bottom: -10%; right: -5%; animation-delay: -5s; }
.orb-3 { width: 300px; height: 300px; background: #fff0f5; top: 40%; left: 40%; animation-delay: -10s; }

@keyframes float {
  0% { transform: translate(0, 0) scale(1); }
  100% { transform: translate(30px, 50px) scale(1.1); }
}

/* 
 * MAIN CARD CONTAINER
 * Glassmorphism + layout 
 */
.card-container {
  width: 100%;
  max-width: 420px;
  min-height: 530px;
  position: relative;
  background: #ffffff;
  border-radius: 28px;
  border: 1px solid rgba(0, 0, 0, 0.08);
  box-shadow: var(--c-shadow-layer-1), var(--c-shadow-layer-2);
  padding: 32px 40px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  transition: height 0.5s var(--ease-smooth);
  transform-origin: center;
}

/* VIEW MANAGEMENT */
.view-section {
  width: 100%;
  height: 100%;
  display: none; /* Toggled via JS */
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.view-section.active {
  display: flex;
}

/* AUTH HEADER */
.auth-header {
  position: relative;
  width: 100%;
  margin-bottom: 24px;
}

.back-btn {
  position: absolute;
  left: 0;
  top: 0;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: none;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  cursor: pointer;
  transition: all 0.3s ease;
  background: white;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #1d1d1f;
  margin-top: 7%;
}

.back-btn:hover {
  transform: scale(1.05);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.back-btn:active {
  transform: scale(0.95);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.back-btn svg {
  color: #1d1d1f;
}

.header-content {
  text-align: center;
  width: 100%;
}

/* TYPOGRAPHY */
h1 {
  font-size: 32px;
  font-weight: 700;
  letter-spacing: -0.02em;
  margin-bottom: 8px;
  text-align: center;
}

p.subtitle {
  font-size: 15px;
  font-weight: 400;
  color: var(--c-text-secondary);
  margin-bottom: 24px;
  text-align: center;
  line-height: 1.4;
  letter-spacing: -0.05px;
}

.auth-header p.subtitle {
  margin-bottom: 0;
}

/* FORMS & INPUTS */
.input-group {
  width: 100%;
  margin-bottom: 22px;
  position: relative;
}

/* 密码输入框包裹容器 */
.password-input-wrapper {
  position: relative;
  width: 100%;
}

.password-input-wrapper input {
  width: 100%;
  padding-right: 50px; /* 为按钮留出空间 */
}

/* 密码切换按钮 */
.password-toggle-btn {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  padding: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #a1a1a6;
  transition: color 0.2s ease;
  border-radius: 8px;
  width: 32px;
  height: 32px;
}

.password-toggle-btn:hover {
  color: var(--c-text-primary);
  background: rgba(0, 0, 0, 0.04);
}

.password-toggle-btn:active {
  transform: translateY(-50%) scale(0.95);
}

.password-toggle-btn svg {
  width: 20px;
  height: 20px;
}

input {
  width: 100%;
  height: 55px;
  background: var(--c-input-bg);
  border: 2px solid transparent;
  border-radius: 16px;
  padding: 0 22px;
  font-size: 16px;
  font-weight: 400;
  color: var(--c-text-primary);
  outline: none;
  transition: all 0.3s var(--ease-smooth);
  box-sizing: border-box;
}

input::placeholder {
  color: #a1a1a6;
}

input:focus {
  background: #fff;
  border-color: var(--c-accent);
  box-shadow: 0 0 0 4px rgba(0, 113, 227, 0.15);
}

/* BUTTONS */
.btn-primary {
  width: 100%;
  height: 55px;
  background: var(--c-text-primary);
  color: #fff;
  border: none;
  border-radius: 16px;
  font-size: 16px;
  font-weight: 400;
  cursor: pointer;
  margin-top: 8px;
  transition: transform 0.2s var(--ease-elastic), box-shadow 0.3s ease;
  position: relative;
  overflow: hidden;
  box-sizing: border-box;
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 20px rgba(0,0,0,0.15);
}

.btn-primary:active {
  transform: scale(0.94);
}

.link-text {
  margin-top: 40px;
  font-size: 13px;
  color: var(--c-text-secondary);
  cursor: pointer;
  transition: color 0.2s ease;
}

.link-text span {
  color: var(--c-accent);
  font-weight: 500;
  cursor: pointer;
}

.link-text:hover span {
  text-decoration: underline;
}

/* 重新发送验证码样式 */
.resend-disabled {
  color: #a1a1a6 !important;
  cursor: not-allowed !important;
  font-weight: 600;
}

.resend-active {
  color: var(--c-accent);
  font-weight: 500;
  cursor: pointer;
  transition: color 0.2s ease;
}

.resend-active:hover {
  color: #005bb5;
  text-decoration: underline;
}

/* OTP INPUTS SPECIFIC */
.otp-container {
  display: flex;
  gap: 12px;
  justify-content: center;
  margin-bottom: 25px;
}
input.otp-input {
  width: 48px;
  height: 56px;
  text-align: center;
  font-size: 22px;
  font-weight: 600;
  box-sizing: border-box;
  background: var(--c-input-bg);
  border: 2px solid transparent;
  border-radius: 16px;
  color: var(--c-text-primary);
  outline: none;
  transition: all 0.3s var(--ease-smooth);
  padding: 0;
}

input.otp-input:focus {
  background: #fff;
  border-color: var(--c-accent);
  box-shadow: 0 0 0 4px rgba(0, 113, 227, 0.15);
}

/* SUCCESS STATE */
.success-icon {
  width: 80px;
  height: 80px;
  background: #34c759;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 24px;
  color: white;
  box-shadow: 0 10px 30px rgba(52, 199, 89, 0.4);
}

.success-icon svg {
  width: 36px;
  height: 36px;
  stroke-width: 3;
}

/* 
 * ANIMATION ORCHESTRATION 
 * The key to the "Elastic" feel
 */

/* Base enter animation class */
.animate-enter > * {
  opacity: 0;
  transform: translateY(30px) scale(0.9);
  animation: springEnter 0.8s var(--ease-elastic) forwards;
}

/* Stagger delays for children */
.animate-enter > *:nth-child(1) { animation-delay: 0.05s; }
.animate-enter > *:nth-child(2) { animation-delay: 0.1s; }
.animate-enter > *:nth-child(3) { animation-delay: 0.15s; }
.animate-enter > *:nth-child(4) { animation-delay: 0.2s; }
.animate-enter > *:nth-child(5) { animation-delay: 0.25s; }
.animate-enter > *:nth-child(6) { animation-delay: 0.3s; }

@keyframes springEnter {
  0% {
    opacity: 0;
    transform: translateY(40px) scale(0.8);
  }
  40% {
    opacity: 1;
  }
  50% {
    transform: translateY(-6px) scale(1.03);
  }
  70% {
    transform: translateY(3px) scale(0.98);
  }
  100% {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

/* Exit Animation */
.animate-exit > * {
  animation: zoomExit 0.3s var(--ease-smooth) forwards;
}

/* Reverse stagger for exit */
.animate-exit > *:nth-last-child(1) { animation-delay: 0s; }
.animate-exit > *:nth-last-child(2) { animation-delay: 0.05s; }
.animate-exit > *:nth-last-child(3) { animation-delay: 0.1s; }

@keyframes zoomExit {
  0% { opacity: 1; transform: scale(1); }
  100% { opacity: 0; transform: scale(0.9) translateY(-20px); }
}

/* 移动端适配 - 竖屏设备 */
@media (max-aspect-ratio: 1/1) {
  /* 卡片容器缩小 */
  .card-container {
    max-width: 320px;
    min-height: 420px;
    padding: 24px 28px;
    border-radius: 20px;
  }
  
  /* 返回按钮 */
  .back-btn {
    width: 32px;
    height: 32px;
    margin-top: 6%;
  }
  
  .back-btn svg {
    width: 20px;
    height: 20px;
  }
  
  /* 标题缩小 */
  h1 {
    font-size: 24px;
    margin-bottom: 6px;
  }
  
  p.subtitle {
    font-size: 13px;
    margin-bottom: 20px;
  }
  
  .auth-header p.subtitle {
    margin-bottom: 0;
  }
  
  /* 输入框缩小 */
  .input-group {
    margin-bottom: 16px;
  }
  
  input {
    height: 46px;
    padding: 0 16px;
    font-size: 14px;
    border-radius: 12px;
  }
  
  .password-input-wrapper input {
    padding-right: 44px;
  }
  
  .password-toggle-btn {
    right: 10px;
    width: 28px;
    height: 28px;
  }
  
  .password-toggle-btn svg {
    width: 16px;
    height: 16px;
  }
  
  /* 按钮缩小 */
  .btn-primary {
    height: 46px;
    font-size: 14px;
    border-radius: 12px;
    margin-top: 6px;
  }
  
  /* 链接文字缩小 */
  .link-text {
    margin-top: 28px;
    font-size: 12px;
  }
  
  /* OTP输入框缩小 */
  .otp-container {
    gap: 8px !important;
  }
  
  .otp-input {
    width: 48px !important;
    height: 52px !important;
    font-size: 22px !important;
    border-radius: 12px !important;
  }
  
  /* 倒计时文字缩小 */
  p.countdown-text {
    font-size: 13px !important;
  }
  
  .resend-link {
    font-size: 13px !important;
  }
  
  /* 成功页图标缩小 */
  .success-icon {
    width: 56px !important;
    height: 56px !important;
  }
  
  /* 返回按钮缩小 */
  .btn-back {
    height: 46px !important;
    font-size: 14px !important;
    border-radius: 12px !important;
  }
}
</style>
