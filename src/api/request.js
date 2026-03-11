/**
 * 统一的HTTP请求封装
 * 基于fetch API
 */

import { BASE_URL } from '@/config';

/**
 * 发送HTTP请求
 * @param {string} url - 请求URL
 * @param {object} options - 请求选项
 * @returns {Promise} - 响应数据
 */
async function request(url, options = {}) {
  const {
    method = 'GET',
    headers = {},
    body = null,
    auth = true, // 是否需要认证
  } = options;

  // 构建完整URL
  const fullUrl = url.startsWith('http') ? url : `${BASE_URL}${url}`;
  
  console.log(`[API请求] ${method} ${fullUrl}`);

  // 构建请求头
  const requestHeaders = {
    'Content-Type': 'application/json',
    ...headers,
  };

  // 添加认证令牌
  if (auth) {
    const token = localStorage.getItem('token');
    if (token) {
      requestHeaders['Authorization'] = `Bearer ${token}`;
    }
  }

  // 构建请求配置
  const config = {
    method,
    headers: requestHeaders,
  };

  // 添加请求体
  if (body && method !== 'GET') {
    config.body = JSON.stringify(body);
  }

  try {
    console.log('[API请求配置]', config);
    const response = await fetch(fullUrl, config);
    console.log('[API响应状态]', response.status, response.statusText);
    
    const data = await response.json();
    console.log('[API响应数据]', data);

    // 处理响应
    if (response.ok) {
      return data;
    } else {
      // 处理错误响应
      const error = new Error(data.message || '请求失败');
      error.response = data;
      error.status = response.status;
      console.error('[API错误]', error);
      throw error;
    }
  } catch (error) {
    // 处理网络错误
    if (!error.response) {
      error.message = '网络错误，请检查网络连接';
    }
    console.error('[API异常]', error);
    throw error;
  }
}

/**
 * GET请求
 */
export function get(url, options = {}) {
  return request(url, { ...options, method: 'GET' });
}

/**
 * POST请求
 */
export function post(url, body, options = {}) {
  return request(url, { ...options, method: 'POST', body });
}

/**
 * PUT请求
 */
export function put(url, body, options = {}) {
  return request(url, { ...options, method: 'PUT', body });
}

/**
 * DELETE请求
 */
export function del(url, options = {}) {
  return request(url, { ...options, method: 'DELETE' });
}

/**
 * PATCH请求
 */
export function patch(url, body, options = {}) {
  return request(url, { ...options, method: 'PATCH', body });
}

export default request;
