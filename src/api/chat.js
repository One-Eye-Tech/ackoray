import { get, post } from './request';

/**
 * 获取所有聊天会话（管理员）
 */
export function getAllConversations() {
  return get('/api/conversations');
}

/**
 * 获取会话消息列表（管理员）
 */
export function getConversationMessages(conversationId) {
  return get(`/api/conversations/${conversationId}/messages`);
}

/**
 * 获取我的聊天历史（用户）
 */
export function getMyMessages() {
  return get('/api/conversations/my-messages');
}

/**
 * 获取未读消息数（用户）
 */
export function getUnreadCount() {
  return get('/api/conversations/unread-count');
}

/**
 * 标记会话为已读（管理员）
 */
export function markConversationAsRead(conversationId) {
  return post(`/api/conversations/${conversationId}/read`);
}
