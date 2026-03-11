/**
 * 地址管理API
 */
import { get, post, put, del, patch } from './request';

/**
 * 创建收货地址
 * @param {object} data - 地址数据
 */
export function createAddress(data) {
  return post('/api/addresses', data);
}

/**
 * 更新收货地址
 * @param {number} id - 地址ID
 * @param {object} data - 地址数据
 */
export function updateAddress(id, data) {
  return put(`/api/addresses/${id}`, data);
}

/**
 * 删除收货地址
 * @param {number} id - 地址ID
 */
export function deleteAddress(id) {
  return del(`/api/addresses/${id}`);
}

/**
 * 获取地址详情
 * @param {number} id - 地址ID
 */
export function getAddressById(id) {
  return get(`/api/addresses/${id}`);
}

/**
 * 获取用户所有地址
 */
export function getUserAddresses() {
  return get('/api/addresses');
}

/**
 * 设置默认地址
 * @param {number} id - 地址ID
 */
export function setDefaultAddress(id) {
  return patch(`/api/addresses/${id}/default`);
}
