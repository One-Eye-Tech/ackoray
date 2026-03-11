<template>
  <div class="chat-management-container">
    <div class="chat-header">
      <h1>💬 客服聊天</h1>
      <p class="subtitle">管理所有用户的聊天会话</p>
    </div>

    <!-- 加载状态 -->
    <div v-if="loading" class="loading-state">
      <p>加载中...</p>
    </div>

    <!-- 空状态 -->
    <div v-else-if="conversations.length === 0" class="empty-state">
      <div class="empty-icon">💭</div>
      <p>暂无聊天会话</p>
    </div>

    <!-- 聊天会话列表 -->
    <div v-else class="conversations-grid">
      <div 
        v-for="conversation in conversations" 
        :key="conversation.id"
        class="conversation-card"
        @click="openChat(conversation)"
      >
        <!-- 用户头像 -->
        <div class="user-avatar">
          <img 
            v-if="conversation.userAvatar" 
            :src="conversation.userAvatar" 
            :alt="conversation.userName"
          />
          <div v-else class="avatar-placeholder">
            {{ conversation.userName.charAt(0).toUpperCase() }}
          </div>
          <span v-if="conversation.unreadCount > 0" class="unread-badge">
            {{ conversation.unreadCount }}
          </span>
        </div>

        <!-- 聊天信息 -->
        <div class="conversation-info">
          <div class="conversation-header">
            <h3 class="user-name">{{ conversation.userName }}</h3>
            <span class="time">{{ formatTime(conversation.lastMessageTime) }}</span>
          </div>
          <p class="last-message">{{ conversation.lastMessage || '暂无消息' }}</p>
          <p class="user-email">{{ conversation.userEmail }}</p>
        </div>

        <!-- 未读标记 -->
        <div class="conversation-status">
          <span v-if="conversation.unreadCount > 0" class="new-message-indicator">
            新消息
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue';
import { useRouter } from 'vue-router';
import { getAllConversations } from '@/api/chat';

const router = useRouter();
const conversations = ref([]);
const loading = ref(false);

const loadConversations = async () => {
  loading.value = true;
  try {
    const response = await getAllConversations();
    conversations.value = response.data || response;
  } catch (error) {
    console.error('加载聊天列表失败:', error);
    alert('加载聊天列表失败: ' + (error.response?.data?.message || error.message));
  } finally {
    loading.value = false;
  }
};

const openChat = (conversation) => {
  router.push({
    name: 'ChatDetail',
    params: { id: conversation.id },
    query: {
      userName: conversation.userName,
      userEmail: conversation.userEmail
    }
  });
};

const formatTime = (time) => {
  if (!time) return '';
  const date = new Date(time);
  const now = new Date();
  const diff = now - date;
  
  if (diff < 60000) return '刚刚';
  if (diff < 3600000) return Math.floor(diff / 60000) + '分钟前';
  if (diff < 86400000) return Math.floor(diff / 3600000) + '小时前';
  if (diff < 604800000) return Math.floor(diff / 86400000) + '天前';
  
  return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
};

onMounted(() => {
  loadConversations();
  
  // 每30秒刷新一次列表
  const interval = setInterval(loadConversations, 30000);
  
  onBeforeUnmount(() => {
    clearInterval(interval);
  });
});
</script>

<style scoped>
.chat-management-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

.chat-header {
  margin-bottom: 2rem;
}

.chat-header h1 {
  font-size: 2rem;
  color: #1E293B;
  margin-bottom: 0.5rem;
}

.subtitle {
  color: #64748B;
  font-size: 0.95rem;
}

.loading-state,
.empty-state {
  text-align: center;
  padding: 4rem 2rem;
  color: #64748B;
}

.empty-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
}

.conversations-grid {
  display: grid;
  gap: 1rem;
}

.conversation-card {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  padding: 1.5rem;
  background: #FFFFFF;
  border: 2px solid #E2E8F0;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.conversation-card:hover {
  border-color: #3B82F6;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.1);
  transform: translateY(-2px);
}

.user-avatar {
  position: relative;
  flex-shrink: 0;
}

.user-avatar img,
.avatar-placeholder {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  object-fit: cover;
}

.avatar-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #FFFFFF;
  font-size: 1.5rem;
  font-weight: 600;
}

.unread-badge {
  position: absolute;
  top: -5px;
  right: -5px;
  background: #EF4444;
  color: #FFFFFF;
  font-size: 0.75rem;
  font-weight: 600;
  padding: 0.25rem 0.5rem;
  border-radius: 10px;
  min-width: 20px;
  text-align: center;
}

.conversation-info {
  flex: 1;
  min-width: 0;
}

.conversation-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.user-name {
  font-size: 1.1rem;
  font-weight: 600;
  color: #1E293B;
  margin: 0;
}

.time {
  font-size: 0.85rem;
  color: #94A3B8;
}

.last-message {
  color: #64748B;
  font-size: 0.95rem;
  margin: 0.5rem 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.user-email {
  color: #94A3B8;
  font-size: 0.85rem;
  margin: 0;
}

.conversation-status {
  flex-shrink: 0;
}

.new-message-indicator {
  display: inline-block;
  padding: 0.5rem 1rem;
  background: linear-gradient(135deg, #10B981 0%, #059669 100%);
  color: #FFFFFF;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 600;
}

@media (max-width: 768px) {
  .chat-management-container {
    padding: 1rem;
  }

  .conversation-card {
    padding: 1rem;
    gap: 1rem;
  }

  .user-avatar img,
  .avatar-placeholder {
    width: 50px;
    height: 50px;
  }
}
</style>
