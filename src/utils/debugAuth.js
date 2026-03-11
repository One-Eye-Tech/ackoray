/**
 * 认证调试工具
 * 在浏览器控制台运行此文件中的函数来诊断认证问题
 */

// 检查localStorage中的认证信息
export function checkAuthStorage() {
  console.log('=== 认证信息检查 ===')
  
  const token = localStorage.getItem('token')
  const user = localStorage.getItem('user')
  
  console.log('1. Token存在:', !!token)
  if (token) {
    console.log('   Token长度:', token.length)
    console.log('   Token前20字符:', token.substring(0, 20))
    console.log('   完整Token:', token)
  }
  
  console.log('2. User存在:', !!user)
  if (user) {
    try {
      const userObj = JSON.parse(user)
      console.log('   User数据:', userObj)
    } catch (e) {
      console.error('   User数据解析失败:', e)
    }
  }
  
  console.log('==================')
  
  return { hasToken: !!token, hasUser: !!user }
}

// 手动测试登录
export async function testLogin(email, password) {
  console.log('=== 测试登录 ===')
  console.log('邮箱:', email)
  
  try {
    const response = await fetch('http://localhost:8081/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: email,
        password: password,
        rememberMe: false
      })
    })
    
    console.log('响应状态:', response.status)
    console.log('响应头:', Object.fromEntries(response.headers.entries()))
    
    const data = await response.json()
    console.log('响应数据:', data)
    
    if (response.ok && data.data && data.data.token) {
      console.log('✅ 登录成功')
      console.log('Token:', data.data.token)
      console.log('User:', data.data.user)
      
      // 保存到localStorage
      localStorage.setItem('token', data.data.token)
      localStorage.setItem('user', JSON.stringify(data.data.user))
      console.log('已保存到localStorage')
    } else {
      console.error('❌ 登录失败:', data.message)
    }
    
    return data
  } catch (error) {
    console.error('❌ 请求失败:', error)
    throw error
  }
}

// 测试订单接口
export async function testOrderAPI() {
  console.log('=== 测试订单接口 ===')
  
  const token = localStorage.getItem('token')
  if (!token) {
    console.error('❌ 未找到token，请先登录')
    return
  }
  
  console.log('使用Token:', token.substring(0, 20) + '...')
  
  try {
    const response = await fetch('http://localhost:8081/api/orders/my-orders?page=0&size=20', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    })
    
    console.log('响应状态:', response.status)
    console.log('响应头:', Object.fromEntries(response.headers.entries()))
    
    if (response.ok) {
      const data = await response.json()
      console.log('✅ 订单数据:', data)
      return data
    } else {
      const error = await response.json()
      console.error('❌ 请求失败:', error)
      
      if (response.status === 403 || response.status === 401) {
        console.error('认证失败，可能原因:')
        console.error('1. Token无效或已过期')
        console.error('2. Token格式不正确')
        console.error('3. 后端JWT验证失败')
      }
      
      return error
    }
  } catch (error) {
    console.error('❌ 请求失败:', error)
    throw error
  }
}

// 清除认证信息
export function clearAuth() {
  localStorage.removeItem('token')
  localStorage.removeItem('user')
  console.log('✅ 已清除所有认证信息')
}

// 在window上挂载调试函数（方便在控制台直接调用）
if (typeof window !== 'undefined') {
  window.debugAuth = {
    check: checkAuthStorage,
    testLogin,
    testOrderAPI,
    clear: clearAuth
  }
  
  console.log('🛠️  调试工具已加载，使用方法:')
  console.log('- window.debugAuth.check() // 检查认证信息')
  console.log('- window.debugAuth.testLogin(email, password) // 测试登录')
  console.log('- window.debugAuth.testOrderAPI() // 测试订单接口')
  console.log('- window.debugAuth.clear() // 清除认证信息')
}
