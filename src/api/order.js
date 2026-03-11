/**
 * 订单管理API
 */
import { get, post, patch } from './request';

/**
 * 创建订单
 * @param {object} data - 订单数据
 */
export function createOrder(data) {
  return post('/api/orders', data);
}

/**
 * 根据订单号获取订单
 * @param {string} orderNumber - 订单号
 */
export function getOrderByNumber(orderNumber) {
  return get(`/api/orders/order-number/${orderNumber}`);
}

/**
 * 获取用户订单列表
 * @param {object} params - 查询参数
 */
export function getMyOrders(params) {
  const query = new URLSearchParams(params).toString();
  return get(`/api/orders/my-orders?${query}`);
}

/**
 * 按状态获取用户订单
 * @param {string} status - 订单状态
 * @param {object} params - 查询参数
 */
export function getMyOrdersByStatus(status, params) {
  const query = new URLSearchParams(params).toString();
  return get(`/api/orders/my-orders/status/${status}?${query}`);
}

/**
 * 统计用户订单状态
 */
export function getMyOrderCounts() {
  return get('/api/orders/my-orders/counts');
}

/**
 * 确认收货
 * @param {number} id - 订单ID
 */
export function confirmDelivery(id) {
  return post(`/api/orders/${id}/confirm-delivery`);
}

/**
 * 取消订单
 * @param {number} id - 订单ID
 */
export function cancelOrder(id) {
  return post(`/api/orders/${id}/cancel`);
}

/**
 * 支付成功
 * @param {number} id - 订单ID
 */
export function paymentSuccess(id) {
  return post(`/api/orders/${id}/payment-success`);
}

/**
 * 申请退款
 * @param {number} id - 订单ID
 * @param {string} reason - 退款理由
 */
export function requestRefund(id, reason) {
  return post(`/api/orders/${id}/refund`, { reason });
}

/**
 * 获取所有订单（管理员）
 * @param {object} params - 查询参数
 */
export function getAllOrders(params) {
  const query = new URLSearchParams(params).toString();
  return get(`/api/orders?${query}`);
}

/**
 * 获取订单详情（管理员）
 * @param {number} id - 订单ID
 */
export function getOrderById(id) {
  return get(`/api/orders/${id}`);
}

/**
 * 统计订单状态（管理员）
 */
export function getOrderCounts() {
  return get('/api/orders/counts');
}

/**
 * 更新订单状态（管理员）
 * @param {number} id - 订单ID
 * @param {string} status - 订单状态
 */
export function updateOrderStatus(id, status) {
  return patch(`/api/orders/${id}/status`, { status });
}

/**
 * 发货（更新物流信息和状态）
 * @param {number} id - 订单ID
 * @param {string} trackingNumber - 物流单号
 * @param {string} shippingCarrier - 物流公司
 */
export function shipOrder(id, trackingNumber, shippingCarrier) {
  return post(`/api/orders/${id}/ship`, { trackingNumber, shippingCarrier });
}

/**
 * 更新物流单号（管理员）
 * @param {number} id - 订单ID
 * @param {string} trackingNumber - 物流单号
 */
export function updateTrackingNumber(id, trackingNumber) {
  return patch(`/api/orders/${id}/tracking`, { trackingNumber });
}

/**
 * 发起退款（管理员）
 * @param {number} id - 订单ID
 */
export function initiateRefund(id) {
  return post(`/api/orders/${id}/refund`);
}
