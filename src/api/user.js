/**
 * 用户管理API
 */
import { get, put, del } from './request';

/**
 * 获取当前登录用户信息
 */
export function getCurrentUser() {
  return get('/api/users/me');
}

/**
 * 更新当前用户信息
 * @param {object} data - 用户数据
 */
export function updateCurrentUser(data) {
  return put('/api/users/me', data);
}

/**
 * 检查邮箱是否存在
 * @param {string} email - 邮箱
 */
export function checkEmailExists(email) {
  return get(`/api/users/exists/email?email=${email}`, { auth: false });
}

/**
 * 检查用户名是否存在
 * @param {string} username - 用户名
 */
export function checkUsernameExists(username) {
  return get(`/api/users/exists/username?username=${username}`, { auth: false });
}

/**
 * 获取用户列表（分页）
 * @param {object} params - 查询参数
 */
export function getUserList(params) {
  const query = new URLSearchParams(params).toString();
  return get(`/api/users?${query}`);
}

/**
 * 获取所有用户
 */
export function getAllUsers() {
  return get('/api/users/all');
}

/**
 * 获取用户详情
 * @param {number} id - 用户ID
 */
export function getUserById(id) {
  return get(`/api/users/${id}`);
}

/**
 * 更新用户信息
 * @param {number} id - 用户ID
 * @param {object} data - 用户数据
 */
export function updateUser(id, data) {
  return put(`/api/users/${id}`, data);
}

/**
 * 删除用户
 * @param {number} id - 用户ID
 */
export function deleteUser(id) {
  return del(`/api/users/${id}`);
}
