/**
 * 颜色管理API
 */
import { get, post, put, del } from './request';

/**
 * 获取所有颜色
 */
export function getAllColors() {
  return get('/api/colors', { auth: false });
}

/**
 * 获取颜色详情
 * @param {number} id - 颜色ID
 */
export function getColorById(id) {
  return get(`/api/colors/${id}`, { auth: false });
}

/**
 * 创建颜色（管理员）
 * @param {object} data - 颜色数据 {name, hexCode}
 */
export function createColor(data) {
  // 后端使用@RequestParam，需要URL参数而不是JSON body
  const params = new URLSearchParams();
  params.append('name', data.name);
  if (data.hexCode) {
    params.append('hexCode', data.hexCode);
  }
  return post(`/api/colors?${params.toString()}`);
}

/**
 * 更新颜色（管理员）
 * @param {number} id - 颜色ID
 * @param {object} data - 颜色数据 {name, hexCode}
 */
export function updateColor(id, data) {
  // 后端使用@RequestParam，需要URL参数而不是JSON body
  const params = new URLSearchParams();
  params.append('name', data.name);
  if (data.hexCode) {
    params.append('hexCode', data.hexCode);
  }
  return put(`/api/colors/${id}?${params.toString()}`);
}

/**
 * 删除颜色（管理员）
 * @param {number} id - 颜色ID
 */
export function deleteColor(id) {
  return del(`/api/colors/${id}`);
}
