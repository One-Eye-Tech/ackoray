<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useAuth } from '../composables/useAuth'
import * as addressAPI from '../api/address'
import * as userAPI from '../api/user'
import * as authAPI from '../api/auth'

const router = useRouter()
const { t, locale } = useI18n()
const { isAuthenticated, currentUser, logout: authLogout, updateUser } = useAuth()

// 语言切换
const currentLanguage = computed(() => locale.value === 'en' ? 'English' : '中文')
const showLanguageModal = ref(false)

const changeLanguage = (lang) => {
  locale.value = lang
  localStorage.setItem('locale', lang)
  showLanguageModal.value = false
}

// User Profile Data - 从全局状态获取
const userProfile = computed(() => {
  const user = currentUser.value || {
    name: 'Guest',
    email: 'guest@example.com',
    username: 'guest'
  }
  
  // 如果没有头像，使用用户名生成默认头像
  const avatar = user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.username || user.name || 'User')}&background=0D8ABC&color=fff&size=128`
  
  // 确保 name 字段存在，如果后端没有返回 name，使用 username 作为备用
  const name = user.name || user.username || 'Guest'
  
  return {
    ...user,
    name,
    avatar
  }
})

// Address Management
const addresses = ref([])
const loadingAddresses = ref(false)

// 加载用户地址
const loadAddresses = async () => {
  try {
    loadingAddresses.value = true
    const response = await addressAPI.getUserAddresses()
    addresses.value = response.data.map(addr => ({
      id: addr.id,
      name: addr.recipientName,
      phone: addr.phoneNumber,
      address: addr.detailedAddress,
      isDefault: addr.isDefault || false
    }))
  } catch (error) {
    console.error('加载地址失败:', error)
    if (error.response?.status === 401 || error.response?.status === 403) {
      authLogout()
      router.push('/auth')
    } else {
      alert(t('settings.address.loadError'))
    }
  } finally {
    loadingAddresses.value = false
  }
}

// 检查登录状态，未登录则跳转
onMounted(async () => {
  if (!isAuthenticated.value) {
    router.push('/auth')
    return
  }
  
  // 加载用户地址
  await loadAddresses()
})

// 组件卸载时清理计时器
onUnmounted(() => {
  if (passwordCountdownTimer) {
    clearInterval(passwordCountdownTimer)
    passwordCountdownTimer = null
  }
})

// Two-Factor Authentication
const twoFactorEnabled = ref(true)

// Modal States
const showProfileModal = ref(false)
const showAddressModal = ref(false)
const showPasswordModal = ref(false)
const showLogoutModal = ref(false)

// Address Form Data
const addressForm = ref({
  id: null,
  recipientName: '',
  phoneNumber: '',
  detailedAddress: ''
})

const isEditingAddress = ref(false)
const savingAddress = ref(false)

// Profile Form Data
const profileForm = ref({
  name: ''
})

// 修改密码流程
const passwordStep = ref(1) // 1: 验证邮箱, 2: 输入验证码, 3: 输入新密码
const passwordForm = ref({
  otp1: '',
  otp2: '',
  otp3: '',
  otp4: '',
  newPassword: '',
  confirmPassword: ''
})
const otp1 = ref(null)
const otp2 = ref(null)
const otp3 = ref(null)
const otp4 = ref(null)

// 密码显示状态
const showNewPassword = ref(false)
const showConfirmPassword = ref(false)

// 倒计时
const passwordCountdown = ref(0)
const canResendPassword = ref(false)
let passwordCountdownTimer = null

// 发送验证码loading状态
const sendingCode = ref(false)

const startPasswordCountdown = () => {
  passwordCountdown.value = 60
  canResendPassword.value = false
  
  if (passwordCountdownTimer) {
    clearInterval(passwordCountdownTimer)
  }
  
  passwordCountdownTimer = setInterval(() => {
    passwordCountdown.value--
    if (passwordCountdown.value <= 0) {
      clearInterval(passwordCountdownTimer)
      passwordCountdownTimer = null
      canResendPassword.value = true
    }
  }, 1000)
}

const openPasswordModal = () => {
  passwordStep.value = 1
  passwordForm.value = {
    otp1: '',
    otp2: '',
    otp3: '',
    otp4: '',
    newPassword: '',
    confirmPassword: ''
  }
  
  // 清空验证码输入框（延迟执行，确保DOM已渲染）
  setTimeout(() => {
    if (otp1.value) otp1.value.value = ''
    if (otp2.value) otp2.value.value = ''
    if (otp3.value) otp3.value.value = ''
    if (otp4.value) otp4.value.value = ''
  }, 50)
  
  showPasswordModal.value = true
}

const sendPasswordVerificationCode = async () => {
  sendingCode.value = true
  try {
    // 发送验证码到用户邮箱
    await authAPI.sendResetCode(userProfile.value.email)
    
    passwordStep.value = 2
    startPasswordCountdown()
    
    // 清空验证码输入框并聚焦第一个输入框
    setTimeout(() => {
      if (otp1.value) otp1.value.value = ''
      if (otp2.value) otp2.value.value = ''
      if (otp3.value) otp3.value.value = ''
      if (otp4.value) otp4.value.value = ''
      otp1.value?.focus()
    }, 100)
  } catch (error) {
    console.error('发送验证码失败:', error)
    if (error.response?.status === 429) {
      alert(t('settings.passwordModal.sendTooFrequent'))
    } else {
      alert(error.response?.data?.message || t('settings.passwordModal.sendError'))
    }
  } finally {
    sendingCode.value = false
  }
}

const resendPasswordCode = async () => {
  if (!canResendPassword.value) return
  
  try {
    await authAPI.sendResetCode(userProfile.value.email)
    startPasswordCountdown()
    
    // 清空验证码输入框
    if (otp1.value) otp1.value.value = ''
    if (otp2.value) otp2.value.value = ''
    if (otp3.value) otp3.value.value = ''
    if (otp4.value) otp4.value.value = ''
    otp1.value?.focus()
  } catch (error) {
    console.error('重新发送验证码失败:', error)
    if (error.response?.status === 429) {
      alert(t('settings.passwordModal.sendTooFrequent'))
    } else {
      alert(error.response?.data?.message || t('settings.passwordModal.resendError'))
    }
  }
}

const handlePasswordOtpInput = (e, index) => {
  const otpInputs = [otp1.value, otp2.value, otp3.value, otp4.value]
  if (e.target.value.length === 1 && index < otpInputs.length - 1) {
    otpInputs[index + 1].focus()
  }
}

const handlePasswordOtpKeydown = (e, index) => {
  const otpInputs = [otp1.value, otp2.value, otp3.value, otp4.value]
  if (e.key === 'Backspace' && e.target.value === '' && index > 0) {
    otpInputs[index - 1].focus()
  }
}

const verifyPasswordOtp = async (e) => {
  const inputs = [otp1.value, otp2.value, otp3.value, otp4.value]
  
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
    // 拼接验证码
    const code = `${otp1.value.value}${otp2.value.value}${otp3.value.value}${otp4.value.value}`
    
    // 调用后端验证接口
    const response = await authAPI.verifyCode({
      email: userProfile.value.email,
      code: code
    })
    
    // 检查响应码（后端可能返回HTTP 200但业务码不是200）
    if (response.code !== 200) {
      alert(response.message || t('settings.passwordModal.changeError'))
      return
    }
    
    // 验证码验证通过，进入下一步（第3步不需要验证码）
    passwordStep.value = 3
  } catch (error) {
    console.error('验证码验证失败:', error)
    alert(error.response?.message || error.message || t('settings.passwordModal.changeError'))
  }
}

const saveNewPassword = async (e) => {
  // 获取所有输入框
  const inputs = e.target.closest('.modal').querySelectorAll('input')
  
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
  if (passwordForm.value.newPassword !== passwordForm.value.confirmPassword) {
    alert(t('settings.passwordModal.passwordMismatch'))
    return
  }
  
  try {
    // 调用修改密码API（不需要验证码，依赖JWT登录认证）
    await authAPI.changePassword({
      newPassword: passwordForm.value.newPassword
    })
    
    // 修改密码成功
    showPasswordModal.value = false
    
    // 清空验证码输入框
    if (otp1.value) otp1.value.value = ''
    if (otp2.value) otp2.value.value = ''
    if (otp3.value) otp3.value.value = ''
    if (otp4.value) otp4.value.value = ''
    
    // 清除登录状态并跳转到登录页
    setTimeout(() => {
      authLogout()
      alert(t('settings.passwordModal.changeSuccess'))
      router.push('/auth')
    }, 300)
  } catch (error) {
    console.error('修改密码失败:', error)
    alert(error.response?.data?.message || t('settings.passwordModal.changeError'))
  }
}

// Address Functions
const openAddAddressModal = () => {
  isEditingAddress.value = false
  addressForm.value = {
    id: null,
    recipientName: '',
    phoneNumber: '',
    detailedAddress: ''
  }
  showAddressModal.value = true
}

const editAddress = async (id) => {
  try {
    const response = await addressAPI.getAddressById(id)
    const addr = response.data
    
    isEditingAddress.value = true
    addressForm.value = {
      id: addr.id,
      recipientName: addr.recipientName,
      phoneNumber: addr.phoneNumber,
      detailedAddress: addr.detailedAddress
    }
    showAddressModal.value = true
  } catch (error) {
    console.error('获取地址失败:', error)
    alert(t('settings.address.fetchError'))
  }
}

const saveAddress = async (e) => {
  // 获取表单中所有输入框
  const form = e.target.closest('.modal')
  const inputs = form.querySelectorAll('input, textarea')
  
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
    savingAddress.value = true
    
    const data = {
      recipientName: addressForm.value.recipientName,
      phoneNumber: addressForm.value.phoneNumber,
      detailedAddress: addressForm.value.detailedAddress
    }
    
    if (addressForm.value.id) {
      // 更新现有地址
      await addressAPI.updateAddress(addressForm.value.id, data)
      alert(t('settings.address.updateSuccess'))
    } else {
      // 创建新地址
      await addressAPI.createAddress(data)
      alert(t('settings.address.createSuccess'))
    }
    
    showAddressModal.value = false
    // 重新加载地址列表
    await loadAddresses()
  } catch (error) {
    console.error('保存地址失败:', error)
    alert(error.response?.data?.message || t('settings.address.saveError'))
  } finally {
    savingAddress.value = false
  }
}

const setAsDefault = async (id) => {
  try {
    await addressAPI.setDefaultAddress(id)
    alert(t('settings.address.setDefaultSuccess'))
    // 重新加载地址列表
    await loadAddresses()
  } catch (error) {
    console.error('设置默认地址失败:', error)
    alert(error.response?.data?.message || t('settings.address.setDefaultError'))
  }
}

const deleteAddress = async (id) => {
  if (!confirm(t('settings.address.deleteConfirm'))) return
  
  try {
    await addressAPI.deleteAddress(id)
    alert(t('settings.address.deleteSuccess'))
    // 重新加载地址列表
    await loadAddresses()
  } catch (error) {
    console.error('删除地址失败:', error)
    alert(error.response?.data?.message || t('settings.address.deleteError'))
  }
}

// Profile Functions
const openProfileModal = () => {
  profileForm.value.name = userProfile.value.username || userProfile.value.name
  showProfileModal.value = true
}

const saveProfile = async (e) => {
  // 获取输入框
  const form = e.target.closest('.modal')
  const input = form.querySelector('input')
  
  // 检查浏览器原生验证
  if (!input.checkValidity()) {
    input.reportValidity()
    return
  }
  
  try {
    // 调用API更新用户信息
    await userAPI.updateCurrentUser({ username: profileForm.value.name })
    
    // 更新全局用户状态
    updateUser({ username: profileForm.value.name, name: profileForm.value.name })
    
    alert(t('settings.profileModal.updateSuccess'))
    showProfileModal.value = false
  } catch (error) {
    console.error('更新用户信息失败:', error)
    alert(error.response?.data?.message || t('settings.profileModal.updateError'))
  }
}

// Logout Function
const performLogout = () => {
  // 先关闭模态框
  showLogoutModal.value = false
  
  setTimeout(() => {
    // 执行全局登出
    authLogout()
    // 跳转到首页
    router.push('/')
  }, 300)
}
</script>

<template>
  <div class="settings-page">
    <main>
      <div class="page-header">
        <button @click="router.push('/orders')" class="back-btn">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="m15 18-6-6 6-6"/>
          </svg>
        </button>
        <h1>{{ $t('settings.title') }}</h1>
      </div>

      <!-- Profile Section -->
      <div class="section-title">{{ $t('settings.profile') }}</div>
      <div class="settings-group">
        <div class="settings-row">
          <div class="profile-header">
            <div class="avatar-container">
              <img :src="userProfile.avatar" alt="Profile">
            </div>
            <div class="profile-info">
              <h3>{{ userProfile.name }}</h3>
              <p>{{ userProfile.email }}</p>
            </div>
          </div>
          <button class="edit-btn" @click="openProfileModal">{{ $t('settings.editProfile') }}</button>
        </div>
      </div>

      <!-- Address Management Module -->
      <div class="section-title">{{ $t('settings.shippingAddresses') }}</div>
      <div class="address-grid">
        <div 
          v-for="addr in addresses" 
          :key="addr.id"
          :class="['address-card', { 'is-default': addr.isDefault, 'clickable': !addr.isDefault }]"
          @click="!addr.isDefault && setAsDefault(addr.id)"
        >
          <div class="address-content">
            <div class="address-info">
              <div class="name-with-badge">
                <div class="address-detail-line">{{ addr.name }}</div>
                <span v-if="addr.isDefault" class="badge-default" @click.stop>{{ $t('settings.address.default').toUpperCase() }}</span>
              </div>
              <div class="address-detail-line">{{ addr.phone }}</div>
              <div class="address-details">{{ addr.address }}</div>
            </div>
            <div class="address-buttons" @click.stop>
              <button class="action-btn delete-btn-small" @click="deleteAddress(addr.id)">{{ $t('settings.address.delete') }}</button>
              <button class="action-btn edit-btn-small" @click="editAddress(addr.id)">{{ $t('settings.address.edit') }}</button>
            </div>
          </div>
        </div>
      </div>
      <button class="add-address-btn" @click="openAddAddressModal">
        <svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <path d="M12 5v14M5 12h14" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        {{ $t('settings.addNewAddress') }}
      </button>

      <!-- Security Section -->
      <div class="section-title">{{ $t('settings.security') }}</div>
      <div class="settings-group">
        <div class="settings-row action-row" @click="openPasswordModal">
          <span>{{ $t('settings.changePassword') }}</span>
          <span class="arrow-icon">›</span>
        </div>
      </div>

      <!-- Language Section -->
      <div class="section-title">{{ $t('settings.languageSettings') }}</div>
      <div class="settings-group">
        <div class="settings-row action-row" @click="showLanguageModal = true">
          <span>{{ $t('settings.language') }}</span>
          <div class="row-value">
            <span class="current-value">{{ currentLanguage }}</span>
            <span class="arrow-icon">›</span>
          </div>
        </div>
      </div>

      <!-- Logout -->
      <div class="logout-container">
        <button class="btn-logout" @click="showLogoutModal = true">{{ $t('settings.logOut') }}</button>
      </div>
    </main>

    <!-- Profile Edit Modal -->
    <Transition name="modal">
      <div v-if="showProfileModal" class="modal-backdrop" @click.self="showProfileModal = false">
        <div class="modal">
          <div class="modal-header">
            <div class="modal-title">{{ $t('settings.profileModal.title') }}</div>
          </div>
          <div class="form-group">
            <label>{{ $t('settings.profileModal.fullName') }}</label>
            <input type="text" v-model="profileForm.name" required minlength="2">
          </div>
          <div class="modal-actions">
            <button class="btn btn-secondary" @click="showProfileModal = false">{{ $t('settings.common.cancel') }}</button>
            <button class="btn btn-primary" type="submit" @click.prevent="saveProfile">{{ $t('settings.profileModal.saveChanges') }}</button>
          </div>
        </div>
      </div>
    </Transition>

    <!-- Add/Edit Address Modal -->
    <Transition name="modal">
      <div v-if="showAddressModal" class="modal-backdrop" @click.self="showAddressModal = false">
        <div class="modal">
          <div class="modal-header">
            <div class="modal-title">{{ isEditingAddress ? $t('settings.address.editAddress') : $t('settings.address.addAddress') }}</div>
          </div>
          <div class="form-group">
            <label>{{ $t('settings.address.recipientName') }}</label>
            <input type="text" v-model="addressForm.recipientName" required>
          </div>
          <div class="form-group">
            <label>{{ $t('settings.address.phoneNumber') }}</label>
            <input type="tel" v-model="addressForm.phoneNumber" required>
          </div>
          <div class="form-group">
            <label>{{ $t('settings.address.streetAddress') }}</label>
            <textarea v-model="addressForm.detailedAddress" required></textarea>
          </div>
          <div class="modal-actions">
            <button class="btn btn-secondary" @click="showAddressModal = false">{{ $t('settings.common.cancel') }}</button>
            <button class="btn btn-primary" type="submit" @click.prevent="saveAddress">{{ $t('settings.address.saveAddress') }}</button>
          </div>
        </div>
      </div>
    </Transition>

    <!-- Password Modal -->
    <Transition name="modal">
      <div v-if="showPasswordModal" class="modal-backdrop" @click.self="showPasswordModal = false">
        <div class="modal">
          <!-- Step 1: 验证邮箱 -->
          <div v-if="passwordStep === 1">
            <div class="modal-header">
              <div class="modal-title">{{ $t('settings.passwordModal.verifyEmail') }}</div>
            </div>
            <div class="form-group">
              <label>{{ $t('settings.passwordModal.currentEmail') }}</label>
              <div class="email-display">{{ userProfile.email }}</div>
            </div>
            <div class="modal-actions">
              <button class="btn btn-secondary" @click="showPasswordModal = false">{{ $t('settings.common.cancel') }}</button>
              <button 
                class="btn btn-primary" 
                @click="sendPasswordVerificationCode"
                :disabled="sendingCode"
              >
                <span v-if="!sendingCode">{{ $t('settings.passwordModal.sendCode') }}</span>
                <span v-else class="loading-text">
                  <span class="spinner"></span>
                  {{ $t('settings.passwordModal.sending') }}
                </span>
              </button>
            </div>
          </div>

          <!-- Step 2: 输入验证码 -->
          <div v-else-if="passwordStep === 2">
            <div class="modal-header">
              <div class="modal-title">{{ $t('settings.passwordModal.enterCode') }}</div>
            </div>
            <div class="otp-container">
              <input 
                type="text" 
                maxlength="1" 
                class="otp-input" 
                ref="otp1"
                required
                pattern="[0-9]"
                @input="(e) => handlePasswordOtpInput(e, 0)"
                @keydown="(e) => handlePasswordOtpKeydown(e, 0)"
              >
              <input 
                type="text" 
                maxlength="1" 
                class="otp-input" 
                ref="otp2"
                required
                pattern="[0-9]"
                @input="(e) => handlePasswordOtpInput(e, 1)"
                @keydown="(e) => handlePasswordOtpKeydown(e, 1)"
              >
              <input 
                type="text" 
                maxlength="1" 
                class="otp-input" 
                ref="otp3"
                required
                pattern="[0-9]"
                @input="(e) => handlePasswordOtpInput(e, 2)"
                @keydown="(e) => handlePasswordOtpKeydown(e, 2)"
              >
              <input 
                type="text" 
                maxlength="1" 
                class="otp-input" 
                ref="otp4"
                required
                pattern="[0-9]"
                @input="(e) => handlePasswordOtpInput(e, 3)"
                @keydown="(e) => handlePasswordOtpKeydown(e, 3)"
              >
            </div>
            <p class="resend-text">
              {{ $t('settings.passwordModal.didntReceive') }} 
              <span v-if="!canResendPassword" class="resend-disabled">{{ passwordCountdown }}s</span>
              <span v-else @click="resendPasswordCode" class="resend-active">{{ $t('settings.passwordModal.resend') }}</span>
            </p>
            <div class="modal-actions">
              <button class="btn btn-secondary" @click="showPasswordModal = false">{{ $t('settings.common.cancel') }}</button>
              <button class="btn btn-primary" type="submit" @click.prevent="verifyPasswordOtp">{{ $t('settings.passwordModal.verify') }}</button>
            </div>
          </div>

          <!-- Step 3: 输入新密码 -->
          <div v-else-if="passwordStep === 3">
            <div class="modal-header">
              <div class="modal-title">{{ $t('settings.passwordModal.setNewPassword') }}</div>
            </div>
            <div class="form-group">
              <label>{{ $t('settings.passwordModal.newPassword') }}</label>
              <div class="password-input-wrapper">
                <input 
                  :type="showNewPassword ? 'text' : 'password'" 
                  v-model="passwordForm.newPassword"
                  :placeholder="$t('settings.passwordModal.passwordPlaceholder')"
                  required
                  minlength="6"
                >
                <button 
                  type="button" 
                  class="password-toggle-btn" 
                  @click="showNewPassword = !showNewPassword"
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
            <div class="form-group">
              <label>{{ $t('settings.passwordModal.confirmPassword') }}</label>
              <div class="password-input-wrapper">
                <input 
                  :type="showConfirmPassword ? 'text' : 'password'" 
                  v-model="passwordForm.confirmPassword"
                  :placeholder="$t('settings.passwordModal.passwordPlaceholder')"
                  required
                  minlength="6"
                >
                <button 
                  type="button" 
                  class="password-toggle-btn" 
                  @click="showConfirmPassword = !showConfirmPassword"
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
            <div class="modal-actions">
              <button class="btn btn-secondary" @click="showPasswordModal = false">{{ $t('settings.common.cancel') }}</button>
              <button class="btn btn-primary" type="submit" @click.prevent="saveNewPassword">{{ $t('settings.passwordModal.save') }}</button>
            </div>
          </div>
        </div>
      </div>
    </Transition>

    <!-- Language Selection Modal -->
    <Transition name="modal">
      <div v-if="showLanguageModal" class="modal-backdrop" @click.self="showLanguageModal = false">
        <div class="modal">
          <div class="modal-header">
            <div class="modal-title">{{ $t('settings.languageModal.title') }}</div>
          </div>
          <div class="language-options">
            <div 
              class="language-option" 
              :class="{ 'active': locale === 'zh' }"
              @click="changeLanguage('zh')"
            >
              <div class="language-info">
                <span class="language-name">中文</span>
                <span class="language-native">简体中文</span>
              </div>
              <svg v-if="locale === 'zh'" class="check-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            </div>
            <div 
              class="language-option" 
              :class="{ 'active': locale === 'en' }"
              @click="changeLanguage('en')"
            >
              <div class="language-info">
                <span class="language-name">English</span>
                <span class="language-native">English</span>
              </div>
              <svg v-if="locale === 'en'" class="check-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            </div>
          </div>
        </div>
      </div>
    </Transition>

    <!-- Logout Confirmation Modal -->
    <Transition name="modal">
      <div v-if="showLogoutModal" class="modal-backdrop" @click.self="showLogoutModal = false">
        <div class="modal">
          <div class="modal-header">
            <div class="modal-title">{{ $t('settings.logoutModal.title') }}</div>
            <div class="modal-desc">{{ $t('settings.logoutModal.description') }}</div>
          </div>
          <div class="modal-actions">
            <button class="btn btn-secondary" @click="showLogoutModal = false">{{ $t('settings.common.cancel') }}</button>
            <button class="btn btn-danger" @click="performLogout">{{ $t('settings.logoutModal.confirm') }}</button>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style>
/* Global reset - remove default margins */
body {
  margin: 0;
  padding: 0;
}
</style>

<style scoped>
:root {
  /* Apple Color System */
  --bg-body: #F5F5F7;
  --bg-card: #FFFFFF;
  --primary: #0071E3;
  --primary-hover: #0077ED;
  --text-primary: #1D1D1F;
  --text-secondary: #86868B;
  --border: #D2D2D7;
  --border-light: #E5E5EA;
  --danger: #FF3B30;
  --success: #34C759;
  --focus-ring: rgba(0, 113, 227, 0.25);
  
  /* Spacing & Layout */
  --radius-l: 20px;
  --radius-m: 12px;
  --radius-s: 8px;
  --shadow-card: 0 4px 24px rgba(0, 0, 0, 0.04);
  --shadow-hover: 0 8px 32px rgba(0, 0, 0, 0.08);
  --font-stack: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
}

.settings-page {
  min-height: 100vh;
  background-color: #F5F5F7;
  color: #000;
  padding-bottom: 60px;
  margin: 0;
  padding-top: 0;
}

/* --- Main Layout --- */
main {
  max-width: 720px;
  margin: 0 auto;
  padding: 32px 20px 0;
  animation: fadeIn 0.6s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

/* 页面头部 */
.page-header {
  position: relative;
  margin-bottom: -10px;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 60px;
}

.back-btn {
  position: absolute;
  left: 0;
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
  margin-top: 6%;
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

h1 {
  font-size: 3.2rem;
  font-weight: 700;
  color: #000;
  letter-spacing: -0.02em;
  margin-bottom: 0;
  text-align: center;
}

.section-title {
  font-size: 20px;
  font-weight: 500;
  margin-bottom: 16px;
  margin-top: 40px;
}

/* --- Cards & Groups --- */
.settings-group {
  background: #FFFFFF;
  border-radius: 20px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.04);
  overflow: hidden;
  border: 1px solid rgba(0,0,0,0.02);
}

.settings-row {
  padding: 12px 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #E5E5EA;
  transition: background 0.2s;
  min-height: 20px;
  font-size: 1rem;
  font-weight: 500;
  color: #000;
}

.settings-row:last-child {
  border-bottom: none;
}

.settings-row.action-row {
  cursor: pointer;
}

.settings-row.action-row:hover {
  background-color: #FAFAFA;
}

/* --- Profile Section --- */
.profile-header {
  display: flex;
  align-items: center;
  gap: 20px;
}

.avatar-container {
  width: 70px;
  height: 70px;
  border-radius: 50%;
  background: #E5E5EA;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32px;
  color: #86868B;
  overflow: hidden;
  position: relative;
  flex-shrink: 0; /* 防止头像被压缩 */
}

.avatar-container img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.profile-info {
  flex: 1; /* 占据剩余空间 */
  min-width: 0; /* 允许内容被压缩 */
  overflow: hidden; /* 隐藏溢出内容 */
}

.profile-info h3 {
  font-size: 19px;
  font-weight: 600;
  color: #000;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.profile-info p {
  color: #666;
  font-size: 15px;
  font-weight: 500;
  margin-top: -1rem;
  overflow: hidden; /* 隐藏溢出的邮箱 */
  text-overflow: ellipsis; /* 显示省略号 */
  white-space: nowrap; /* 不换行 */
}

.edit-btn {
  margin-left: auto;
  color: #1D1D1F;
  font-weight: 500;
  font-size: 15px;
  background: #F5F5F7;
  border: none;
  cursor: pointer;
  padding: 8px 16px;
  border-radius: 20px;
  transition: all 0.2s;
  flex-shrink: 0; /* 防止按钮被压缩 */
  white-space: nowrap; /* 防止按钮文字换行 */
  align-self: flex-start; /* 顶部对齐，与用户名在同一水平线 */
  margin-top: 12px; /* 微调垂直位置 */
}

.edit-btn:hover {
  background: #E8E8ED;
  transform: scale(1.02);
}

/* --- Address Module --- */
.address-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;
}

.address-card {
  background: #FFFFFF;
  border: 1px solid #E5E5EA;
  border-radius: 20px;
  padding: 20px;
  position: relative;
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.address-card.is-default {
  border-color: #0071E3;
  box-shadow: 0 0 0 1px #0071E3;
}

.address-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08);
}

.address-card.clickable {
  cursor: pointer;
}

.address-card.clickable:hover {
  border-color: #0071E3;
}

.address-card.clickable:active {
  transform: translateY(0);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06);
}

.address-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 20px;
}

.address-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.name-with-badge {
  display: flex;
  align-items: center;
  gap: 12px;
}

.name-with-badge .address-detail-line {
  font-weight: 700;
}

.badge-default {
  background: #0071E3;
  color: white;
  font-size: 11px;
  font-weight: 600;
  padding: 4px 10px;
  border-radius: 100px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  display: inline-block;
  width: fit-content;
  flex-shrink: 0;
}

.address-buttons {
  display: flex;
  flex-direction: row;
  gap: 8px;
  align-items: center;
}

.action-btn {
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
  white-space: nowrap;
}

.edit-btn-small {
  background: #F5F5F7;
  color: #1D1D1F;
}

.edit-btn-small:hover {
  background: #E8E8ED;
}

.delete-btn-small {
  background: #FFE5E5;
  color: #FF3B30;
}

.delete-btn-small:hover {
  background: #FFD5D5;
}

.address-name {
  font-weight: 600;
  font-size: 17px;
  color: #000;
}

.address-detail-line {
  color: #1D1D1F;
  font-size: 15px;
  font-weight: 500;
  line-height: 1.4;
}

.address-details {
  color: #666;
  font-size: 15px;
  font-weight: 500;
  line-height: 1.4;
}

.add-address-btn {
  width: 100%;
  padding: 16px;
  margin-top: 16px;
  background: rgba(255,255,255,0.5);
  border: 2px dashed #D2D2D7;
  border-radius: 20px;
  color: #666;
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.add-address-btn:hover {
  border-color: #0071E3;
  color: #0071E3;
  background: rgba(0, 113, 227, 0.05);
}

/* --- Security Section --- */
.arrow-icon {
  color: #C7C7CC;
  font-size: 30px;
  font-weight: 300;
  line-height: 1;
  height: 30px;
  display: inline-flex;
  align-items: center;
  vertical-align: middle;
  transform: translateY(-1px);
}

.toggle-switch {
  width: 51px;
  height: 31px;
  background: #E5E5EA;
  border-radius: 30px;
  position: relative;
  cursor: pointer;
  transition: background 0.3s;
}

.toggle-switch.active {
  background: #34C759;
}

.toggle-knob {
  width: 27px;
  height: 27px;
  background: white;
  border-radius: 50%;
  position: absolute;
  top: 2px;
  left: 2px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.2);
  transition: transform 0.3s;
}

.toggle-switch.active .toggle-knob {
  transform: translateX(20px);
}

/* --- Logout Button --- */
.logout-container {
  margin-top: 40px;
  text-align: center;
}

.btn-logout {
  background: #FFFFFF;
  color: #FF3B30;
  border: none;
  padding: 17px 40px;
  border-radius: 20px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.04);
  transition: all 0.2s;
  width: 100%;
}

.btn-logout:hover {
  background: #FFF5F5;
  transform: scale(0.99);
}

/* --- Modals --- */
.modal-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.3);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal {
  background: #FFFFFF;
  width: 90%;
  max-width: 440px;
  border-radius: 20px;
  padding: 32px;
  box-shadow: 0 20px 60px rgba(0,0,0,0.15);
}

.modal-header {
  text-align: center;
  margin-bottom: 24px;
}

.modal-title {
  font-size: 20px;
  font-weight: 500;
  margin-bottom: 8px;
}

.modal-desc {
  color: #666;
  font-size: 14px;
  font-weight: 500;
}

.form-group {
  margin-bottom: 20px;
}

label {
  display: block;
  font-size: 14px;
  color: #000;
  margin-bottom: 8px;
  font-weight: 500;
}

input,
textarea {
  width: 100%;
  padding: 0 22px;
  height: 55px;
  font-size: 16px;
  font-weight: 500;
  background: #e8e8ed;
  border: 2px solid transparent;
  border-radius: 16px;
  outline: none;
  transition: all 0.3s ease;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  box-sizing: border-box;
  color: #1D1D1F;
}

input::placeholder,
textarea::placeholder {
  color: #a1a1a6;
}

textarea {
  min-height: 80px;
  padding: 16px 22px;
  height: auto;
  line-height: 1.5;
  resize: vertical;
}

input:focus,
textarea:focus {
  background: #fff;
  border-color: #0071E3;
  box-shadow: 0 0 0 4px rgba(0, 113, 227, 0.15);
}

.modal-actions {
  display: flex;
  gap: 12px;
  margin-top: 24px;
}

/* Language Selection Styles */
.language-options {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 20px;
}

.language-option {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  background: #F5F5F7;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 2px solid transparent;
}

.language-option:hover {
  background: #EBEBED;
}

.language-option.active {
  background: #E8F1FB;
  border-color: #0071E3;
}

.language-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.language-name {
  font-size: 16px;
  font-weight: 600;
  color: #1D1D1F;
}

.language-native {
  font-size: 13px;
  color: #86868B;
}

.check-icon {
  width: 20px;
  height: 20px;
  color: #0071E3;
}

/* Row Value Styles */
.row-value {
  display: flex;
  align-items: center;
  gap: 8px;
  height: 100%;
}

.current-value {
  font-size: 1rem;
  color: #666;
  font-weight: 500;
  display: inline-flex;
  align-items: center;
}

.btn {
  flex: 1;
  padding: 14px;
  border-radius: 30px;
  border: none;
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
  transition: transform 0.1s;
}

.btn:active {
  transform: scale(0.96);
}

.btn-primary {
  background: #0071E3;
  color: white;
}

.btn-primary:hover {
  background: #0077ED;
}

.btn-primary:disabled {
  background: #0071E3;
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-secondary {
  background: #F2F2F7;
  color: #1D1D1F;
}

.btn-secondary:hover {
  background: #E5E5EA;
}

.btn-danger {
  background: #FF3B30;
  color: white;
}

/* Email Display */
.email-display {
  height: 55px;
  padding: 0 22px;
  background: #e8e8ed;
  border: 2px solid transparent;
  border-radius: 16px;
  font-size: 16px;
  color: #1D1D1F;
  font-weight: 500;
  margin-top: 8px;
  display: flex;
  align-items: center;
}

/* OTP Container */
.otp-container {
  display: flex;
  gap: 12px;
  justify-content: center;
  margin: 20px 0;
}

.otp-input {
  width: 48px !important;
  height: 56px !important;
  text-align: center;
  font-size: 22px;
  font-weight: 600;
  border-radius: 16px !important;
  border: 2px solid transparent !important;
  background: #e8e8ed !important;
  padding: 0 !important;
}

.otp-input:focus {
  border-color: #0071E3 !important;
  background: #fff !important;
  box-shadow: 0 0 0 4px rgba(0, 113, 227, 0.15) !important;
}

/* Resend Text */
.resend-text {
  text-align: center;
  font-size: 13px;
  color: #86868B;
  margin: 10px 0;
}

.resend-disabled {
  color: #a1a1a6;
  cursor: not-allowed;
  font-weight: 600;
}

.resend-active {
  color: #0071E3;
  font-weight: 500;
  cursor: pointer;
  transition: color 0.2s ease;
}

.resend-active:hover {
  color: #005bb5;
  text-decoration: underline;
}

/* Password Input Wrapper */
.password-input-wrapper {
  position: relative;
  width: 100%;
}

.password-input-wrapper input {
  width: 100%;
  padding-left: 22px;
  padding-right: 50px;
}

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
  color: #1D1D1F;
  background: rgba(0, 0, 0, 0.04);
}

.password-toggle-btn:active {
  transform: translateY(-50%) scale(0.95);
}

.password-toggle-btn svg {
  width: 20px;
  height: 20px;
}

/* Modal Transitions */
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
}

.modal-enter-active .modal,
.modal-leave-active .modal {
  transition: all 0.4s cubic-bezier(0.19, 1, 0.22, 1);
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-from .modal {
  transform: translateY(100px);
}

.modal-leave-to .modal {
  transform: translateY(100px);
}

/* Loading 动画 */
.loading-text {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-size: 15px;
  font-weight: 500;
}

.spinner {
  display: inline-block;
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
  flex-shrink: 0;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* 移动端适配 - 竖屏设备 */
@media (max-aspect-ratio: 1/1) {
  main {
    padding: 1rem 1rem 0; /* 顶部间距缩小，与订单页面一致 */
  }
  
  .back-btn {
    width: 36px;
    height: 36px;
    padding: 0.3rem;
    margin-top: 10%;
  }
  
  .back-btn svg {
    width: 20px;
    height: 20px;
  }
  
  h1 {
    font-size: 2rem; /* 与订单页面标题大小一致 */
    font-weight: 700;
    margin-bottom: -1rem;
  }
}

</style>
