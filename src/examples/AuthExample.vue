<template>
  <div class="auth-example">
    <h2>认证功能示例</h2>

    <!-- 注册 -->
    <div class="section">
      <h3>用户注册</h3>
      <input v-model="registerForm.email" placeholder="邮箱" />
      <button @click="sendRegisterCode" :disabled="registerCountdown > 0">
        {{ registerCountdown > 0 ? `${registerCountdown}秒后重试` : '发送验证码' }}
      </button>
      <input v-model="registerForm.code" placeholder="验证码" maxlength="4" />
      <input v-model="registerForm.username" placeholder="用户名" />
      <input v-model="registerForm.password" type="password" placeholder="密码" />
      <button @click="handleRegister">注册</button>
    </div>

    <!-- 登录 -->
    <div class="section">
      <h3>用户登录</h3>
      <input v-model="loginForm.email" placeholder="邮箱" />
      <input v-model="loginForm.password" type="password" placeholder="密码" />
      <label>
        <input v-model="loginForm.rememberMe" type="checkbox" />
        记住我
      </label>
      <button @click="handleLogin">登录</button>
    </div>

    <!-- 重置密码 -->
    <div class="section">
      <h3>重置密码</h3>
      <input v-model="resetForm.email" placeholder="邮箱" />
      <button @click="sendResetCode" :disabled="resetCountdown > 0">
        {{ resetCountdown > 0 ? `${resetCountdown}秒后重试` : '发送验证码' }}
      </button>
      <input v-model="resetForm.code" placeholder="验证码" maxlength="4" />
      <input v-model="resetForm.newPassword" type="password" placeholder="新密码" />
      <button @click="handleResetPassword">重置密码</button>
    </div>

    <!-- 登出 -->
    <div class="section">
      <h3>用户登出</h3>
      <button @click="handleLogout">登出</button>
    </div>

    <!-- 当前用户信息 -->
    <div class="section" v-if="currentUser">
      <h3>当前用户</h3>
      <pre>{{ currentUser }}</pre>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { authAPI } from '@/api';

// 注册表单
const registerForm = ref({
  email: '',
  username: '',
  password: '',
  code: ''
});

// 登录表单
const loginForm = ref({
  email: '',
  password: '',
  rememberMe: false
});

// 重置密码表单
const resetForm = ref({
  email: '',
  code: '',
  newPassword: ''
});

// 倒计时
const registerCountdown = ref(0);
const resetCountdown = ref(0);

// 当前用户
const currentUser = ref(null);

// 发送注册验证码
async function sendRegisterCode() {
  if (!registerForm.value.email) {
    alert('请输入邮箱');
    return;
  }

  try {
    const res = await authAPI.sendRegisterCode(registerForm.value.email);
    alert(res.message || '验证码已发送');

    // 开始倒计时
    registerCountdown.value = 60;
    const timer = setInterval(() => {
      registerCountdown.value--;
      if (registerCountdown.value <= 0) {
        clearInterval(timer);
      }
    }, 1000);

  } catch (error) {
    alert(error.message);
  }
}

// 用户注册
async function handleRegister() {
  try {
    const res = await authAPI.register(registerForm.value);
    alert('注册成功！');
    console.log('注册结果:', res);

    // 清空表单
    registerForm.value = { email: '', username: '', password: '', code: '' };

  } catch (error) {
    alert(error.message);
  }
}

// 用户登录
async function handleLogin() {
  try {
    const res = await authAPI.login(loginForm.value);
    
    // 保存token和用户信息
    localStorage.setItem('token', res.data.token);
    localStorage.setItem('user', JSON.stringify(res.data.user));
    
    currentUser.value = res.data.user;
    
    alert('登录成功！');
    console.log('登录结果:', res);

  } catch (error) {
    alert(error.message);
  }
}

// 发送重置密码验证码
async function sendResetCode() {
  if (!resetForm.value.email) {
    alert('请输入邮箱');
    return;
  }

  try {
    const res = await authAPI.sendResetCode(resetForm.value.email);
    alert(res.message || '验证码已发送');

    // 开始倒计时
    resetCountdown.value = 60;
    const timer = setInterval(() => {
      resetCountdown.value--;
      if (resetCountdown.value <= 0) {
        clearInterval(timer);
      }
    }, 1000);

  } catch (error) {
    alert(error.message);
  }
}

// 重置密码
async function handleResetPassword() {
  try {
    const res = await authAPI.resetPassword(resetForm.value);
    alert('密码重置成功！');
    console.log('重置结果:', res);

    // 清空表单
    resetForm.value = { email: '', code: '', newPassword: '' };

  } catch (error) {
    alert(error.message);
  }
}

// 用户登出
async function handleLogout() {
  try {
    await authAPI.logout();
    
    // 清除本地存储
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    
    currentUser.value = null;
    
    alert('登出成功！');

  } catch (error) {
    alert(error.message);
  }
}

// 加载当前用户
onMounted(() => {
  const userStr = localStorage.getItem('user');
  if (userStr) {
    currentUser.value = JSON.parse(userStr);
  }
});
</script>

<style scoped>
.auth-example {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

.section {
  margin-bottom: 30px;
  padding: 20px;
  border: 1px solid #ddd;
  border-radius: 8px;
}

input {
  display: block;
  width: 100%;
  margin: 10px 0;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

button {
  margin: 5px 5px 5px 0;
  padding: 8px 16px;
  background: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

button:hover {
  background: #0056b3;
}

button:disabled {
  background: #ccc;
  cursor: not-allowed;
}

pre {
  background: #f5f5f5;
  padding: 10px;
  border-radius: 4px;
  overflow: auto;
}
</style>
