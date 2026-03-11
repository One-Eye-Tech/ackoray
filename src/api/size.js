/**
 * 尺码管理API
 */
import { get, post, put, del } from './request';

/**
 * 获取所有尺码
 */
export function getAllSizes() {
  return get('/api/sizes', { auth: false });
}

/**
 * 获取尺码详情
 * @param {number} id - 尺码ID
 */
export function getSizeById(id) {
  return get(`/api/sizes/${id}`, { auth: false });
}

/**
 * 创建尺码（管理员）
 * @param {object} data - 尺码数据 {name, orderIndex}
 */
export function createSize(data) {
  // 后端使用@RequestParam，需要URL参数而不是JSON body
  const params = new URLSearchParams();
  params.append('name', data.name);
  return post(`/api/sizes?${params.toString()}`);
}

/**
 * 更新尺码（管理员）
 * @param {number} id - 尺码ID
 * @param {object} data - 尺码数据 {name}
 */
export function updateSize(id, data) {
  // 后端使用@RequestParam，需要URL参数而不是JSON body
  const params = new URLSearchParams();
  params.append('name', data.name);
  return put(`/api/sizes/${id}?${params.toString()}`);
}

/**
 * 删除尺码（管理员）
 * @param {number} id - 尺码ID
 */
export function deleteSize(id) {
  return del(`/api/sizes/${id}`);
}
