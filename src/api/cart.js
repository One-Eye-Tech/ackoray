/**
 * 购物车管理API
 */
import { get, post, put, del } from './request';

/**
 * 获取购物车列表
 */
export function getCartItems() {
  return get('/api/cart');
}

/**
 * 添加商品到购物车
 * @param {object} data - 购物车项数据
 */
export function addCartItem(data) {
  return post('/api/cart', data);
}

/**
 * 更新购物车商品数量
 * @param {number} id - 购物车项ID
 * @param {number} quantity - 数量
 */
export function updateCartItemQuantity(id, quantity) {
  return put(`/api/cart/${id}`, { quantity });
}

/**
 * 删除购物车商品
 * @param {number} id - 购物车项ID
 */
export function deleteCartItem(id) {
  return del(`/api/cart/${id}`);
}

/**
 * 清空购物车
 */
export function clearCart() {
  return del('/api/cart/clear');
}

/**
 * 获取购物车商品数量
 */
export function getCartCount() {
  return get('/api/cart/count');
}
