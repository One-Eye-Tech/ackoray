/**
 * 认证相关API
 */
import { post } from './request';

/**
 * 发送注册验证码
 * @param {string} email - 邮箱地址
 */
export function sendRegisterCode(email) {
  return post('/api/auth/send-register-code', { email }, { auth: false });
}

/**
 * 发送重置密码验证码
 * @param {string} email - 邮箱地址
 */
export function sendResetCode(email) {
  return post('/api/auth/send-reset-code', { email }, { auth: false });
}

/**
 * 用户注册
 * @param {object} data - 注册数据
 * @param {string} data.username - 用户名
 * @param {string} data.email - 邮箱
 * @param {string} data.password - 密码
 * @param {string} data.code - 验证码
 */
export function register(data) {
  return post('/api/auth/register', data, { auth: false });
}

/**
 * 用户登录
 * @param {object} data - 登录数据
 * @param {string} data.email - 邮箱
 * @param {string} data.password - 密码
 * @param {boolean} data.rememberMe - 记住我
 */
export function login(data) {
  return post('/api/auth/login', data, { auth: false });
}

/**
 * 重置密码（忘记密码）
 * @param {object} data - 重置密码数据
 * @param {string} data.email - 邮箱
 * @param {string} data.code - 验证码
 * @param {string} data.newPassword - 新密码
 */
export function resetPassword(data) {
  return post('/api/auth/reset-password', data, { auth: false });
}

/**
 * 验证验证码
 * @param {object} data - 验证验证码数据
 * @param {string} data.email - 邮箱
 * @param {string} data.code - 验证码
 */
export function verifyCode(data) {
  return post('/api/auth/verify-code', data)
}

/**
 * 修改密码（登录后）
 * @param {object} data - 修改密码数据
 * @param {string} data.code - 验证码
 * @param {string} data.newPassword - 新密码
 */
export function changePassword(data) {
  return post('/api/auth/change-password', data)
}

/**
 * 用户登出
 */
export function logout() {
  return post('/api/auth/logout');
}
