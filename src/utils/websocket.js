import SockJS from 'sockjs-client/dist/sockjs';
import { Stomp } from '@stomp/stompjs';

/**
 * WebSocket客户端封装
 */
class WebSocketClient {
  constructor() {
    this.stompClient = null;
    this.connected = false;
    this.subscriptions = {};
  }

  /**
   * 连接WebSocket
   */
  connect(token) {
    return new Promise((resolve, reject) => {
      const socket = new SockJS(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8081'}/ws-chat`);
      this.stompClient = Stomp.over(socket);

      // 禁用调试日志
      this.stompClient.debug = () => {};

      const headers = {
        Authorization: `Bearer ${token}`
      };

      this.stompClient.connect(
        headers,
        (frame) => {
          console.log('WebSocket已连接:', frame);
          this.connected = true;
          resolve(frame);
        },
        (error) => {
          console.error('WebSocket连接失败:', error);
          this.connected = false;
          reject(error);
        }
      );
    });
  }

  /**
   * 断开连接
   */
  disconnect() {
    if (this.stompClient && this.connected) {
      // 取消所有订阅
      Object.values(this.subscriptions).forEach(subscription => {
        subscription.unsubscribe();
      });
      this.subscriptions = {};
      
      this.stompClient.disconnect(() => {
        console.log('WebSocket已断开');
        this.connected = false;
      });
    }
  }

  /**
   * 订阅会话消息
   */
  subscribeToConversation(conversationId, callback) {
    if (!this.connected || !this.stompClient) {
      console.error('WebSocket未连接');
      return null;
    }

    const destination = `/topic/conversation/${conversationId}`;
    
    // 如果已经订阅，先取消
    if (this.subscriptions[destination]) {
      this.subscriptions[destination].unsubscribe();
    }

    // 订阅新消息
    const subscription = this.stompClient.subscribe(destination, (message) => {
      const messageData = JSON.parse(message.body);
      callback(messageData);
    });

    this.subscriptions[destination] = subscription;
    return subscription;
  }

  /**
   * 取消订阅
   */
  unsubscribe(destination) {
    if (this.subscriptions[destination]) {
      this.subscriptions[destination].unsubscribe();
      delete this.subscriptions[destination];
    }
  }

  /**
   * 发送消息
   */
  sendMessage(conversationId, senderId, content, messageType = 'TEXT') {
    if (!this.connected || !this.stompClient) {
      console.error('WebSocket未连接');
      return false;
    }

    const message = {
      conversationId,
      senderId,
      content,
      messageType
    };

    this.stompClient.send('/app/chat.sendMessage', {}, JSON.stringify(message));
    return true;
  }

  /**
   * 检查连接状态
   */
  isConnected() {
    return this.connected;
  }
}

// 导出单例
export default new WebSocketClient();
