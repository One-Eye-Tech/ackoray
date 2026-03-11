<template>
  <div class="chat-detail-container">
    <!-- 头部 -->
    <div class="chat-header">
      <button @click="goBack" class="back-button">
        ← 返回
      </button>
      <div class="user-info">
        <div class="user-avatar">
          {{ userName.charAt(0).toUpperCase() }}
        </div>
        <div>
          <h2>{{ userName }}</h2>
          <p class="user-email">{{ userEmail }}</p>
        </div>
      </div>
    </div>

    <!-- 消息列表 -->
    <div class="messages-container" ref="messagesContainer">
      <div v-if="messages.length === 0" class="empty-state">
        暂无消息
      </div>
      
      <div 
        v-for="msg in messages" 
        :key="msg.id"
        :class="['message', msg.senderId === adminId ? 'message-admin' : 'message-user']"
      >
        <div class="message-content">{{ msg.content }}</div>
        <div class="message-time">{{ formatTime(msg.sentTime) }}</div>
      </div>
    </div>

    <!-- 输入框 -->
    <div class="input-container">
      <input 
        v-model="inputMessage"
        @keyup.enter="sendMessage"
        placeholder="输入消息..."
        class="message-input"
      />
      <button @click="sendMessage" class="send-button">发送</button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, nextTick } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { markConversationAsRead, getConversationMessages } from '@/api/chat';
import SockJS from 'sockjs-client';
import { Stomp } from '@stomp/stompjs';

const route = useRoute();
const router = useRouter();

const conversationId = ref(route.params.id);
const userName = ref(route.query.userName || '用户');
const userEmail = ref(route.query.userEmail || '');
const adminId = ref(JSON.parse(localStorage.getItem('user') || '{}').id);
const messages = ref([]);
const inputMessage = ref('');
const messagesContainer = ref(null);
const stompClient = ref(null);

const goBack = () => {
  router.push('/admin/chat');
};

const formatTime = (time) => {
  if (!time) return '';
  const date = new Date(time);
  return date.toLocaleString('zh-CN', { 
    month: 'short', 
    day: 'numeric', 
    hour: '2-digit', 
    minute: '2-digit' 
  });
};

const scrollToBottom = () => {
  nextTick(() => {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
    }
  });
};

// 连接WebSocket
const connectWebSocket = () => {
  try {
    const token = localStorage.getItem('token');
    if (!token) return;

    const socket = new SockJS(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8081'}/ws-chat`);
    const client = Stomp.over(socket);
    
    client.debug = () => {};

    const headers = {
      Authorization: `Bearer ${token}`
    };

    client.connect(headers, (frame) => {
      console.log('管理员WebSocket已连接');
      stompClient.value = client;
      
      // 订阅会话消息
      client.subscribe(`/topic/conversation/${conversationId.value}`, (message) => {
        const newMsg = JSON.parse(message.body);
        messages.value.push(newMsg);
        scrollToBottom();
        
        // 自动标记为已读
        if (newMsg.senderId !== adminId.value) {
          markAsRead();
        }
      });
    }, (error) => {
      console.error('WebSocket连接失败:', error);
    });
  } catch (error) {
    console.error('连接WebSocket失败:', error);
  }
};

// 发送消息
const sendMessage = () => {
  if (!inputMessage.value.trim()) return;
  if (!stompClient.value) {
    alert('未连接到服务器');
    return;
  }

  const message = {
    conversationId: parseInt(conversationId.value),
    senderId: adminId.value,
    content: inputMessage.value,
    messageType: 'TEXT'
  };

  try {
    stompClient.value.send('/app/chat.sendMessage', {}, JSON.stringify(message));
    inputMessage.value = '';
  } catch (error) {
    console.error('发送消息失败:', error);
    alert('发送失败，请重试');
  }
};

// 标记为已读
const markAsRead = async () => {
  try {
    await markConversationAsRead(conversationId.value);
  } catch (error) {
    console.error('标记已读失败:', error);
  }
};

// 加载历史消息
const loadMessages = async () => {
  try {
    const response = await getConversationMessages(conversationId.value);
    messages.value = response.data || response;
    scrollToBottom();
  } catch (error) {
    console.error('加载消息失败:', error);
  }
};

onMounted(() => {
  connectWebSocket();
  loadMessages();
  markAsRead();
});

onBeforeUnmount(() => {
  if (stompClient.value) {
    stompClient.value.disconnect();
  }
});
</script>

<style scoped>
.chat-detail-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: #F7FAFC;
}

.chat-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem 2rem;
  background: #FFFFFF;
  border-bottom: 2px solid #E2E8F0;
}

.back-button {
  padding: 0.5rem 1rem;
  background: #F1F5F9;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 1rem;
  transition: background 0.2s;
}

.back-button:hover {
  background: #E2E8F0;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.user-avatar {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #FFFFFF;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  font-weight: 600;
}

.user-info h2 {
  margin: 0;
  font-size: 1.2rem;
  color: #1E293B;
}

.user-email {
  margin: 0;
  font-size: 0.9rem;
  color: #64748B;
}

.messages-container {
  flex: 1;
  overflow-y: auto;
  padding: 2rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.empty-state {
  text-align: center;
  color: #94A3B8;
  padding: 4rem 2rem;
}

.message {
  display: flex;
  flex-direction: column;
  max-width: 60%;
}

.message-user {
  align-items: flex-start;
}

.message-user .message-content {
  background: #FFFFFF;
  color: #1E293B;
}

.message-admin {
  align-items: flex-end;
  align-self: flex-end;
}

.message-admin .message-content {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #FFFFFF;
}

.message-content {
  padding: 1rem 1.25rem;
  border-radius: 12px;
  word-wrap: break-word;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.message-time {
  font-size: 0.75rem;
  color: #94A3B8;
  margin-top: 0.25rem;
  padding: 0 0.25rem;
}

.input-container {
  display: flex;
  gap: 1rem;
  padding: 1.5rem 2rem;
  background: #FFFFFF;
  border-top: 2px solid #E2E8F0;
}

.message-input {
  flex: 1;
  padding: 1rem;
  border: 2px solid #E2E8F0;
  border-radius: 8px;
  font-size: 1rem;
  transition: border-color 0.2s;
}

.message-input:focus {
  outline: none;
  border-color: #667eea;
}

.send-button {
  padding: 1rem 2rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #FFFFFF;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.2s;
}

.send-button:hover {
  opacity: 0.9;
}

@media (max-width: 768px) {
  .chat-header {
    padding: 1rem;
  }

  .messages-container {
    padding: 1rem;
  }

  .message {
    max-width: 80%;
  }

  .input-container {
    padding: 1rem;
  }
}
</style>
