import { ref, computed } from 'vue'

// 全局状态
const isAuthenticated = ref(false)
const currentUser = ref(null)

// 初始化：从 localStorage 读取登录状态
const initAuth = () => {
  const token = localStorage.getItem('token')
  const savedUser = localStorage.getItem('user')
  
  if (token && savedUser) {
    try {
      isAuthenticated.value = true
      currentUser.value = JSON.parse(savedUser)
    } catch (error) {
      // 清除无效数据
      localStorage.removeItem('token')
      localStorage.removeItem('user')
    }
  }
}

// 登录
const login = (userData) => {
  isAuthenticated.value = true
  currentUser.value = userData
  
  // 持久化到 localStorage
  localStorage.setItem('isAuthenticated', 'true')
  localStorage.setItem('currentUser', JSON.stringify(userData))
}

// 登出
const logout = () => {
  isAuthenticated.value = false
  currentUser.value = null
  
  // 清除 localStorage
  localStorage.removeItem('token')
  localStorage.removeItem('user')
  localStorage.removeItem('isAuthenticated')
  localStorage.removeItem('currentUser')
}

// 更新用户信息
const updateUser = (userData) => {
  currentUser.value = { ...currentUser.value, ...userData }
  localStorage.setItem('currentUser', JSON.stringify(currentUser.value))
}

// 导出 composable
export const useAuth = () => {
  return {
    // 状态
    isAuthenticated: computed(() => isAuthenticated.value),
    currentUser: computed(() => currentUser.value),
    
    // 方法
    login,
    logout,
    updateUser,
    initAuth
  }
}
