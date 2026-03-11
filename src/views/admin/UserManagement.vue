<template>
  <div class="admin-module-container user-management-table">
    <h2 class="module-title">用户管理</h2>
    <div class="search-filters-container">
      <input type="text" v-model="searchQuery" placeholder="按邮箱搜索用户..." class="search-input">
      
      <select v-model="selectedRoleFilter" class="filter-select">
        <option value="all">所有角色</option>
        <option value="admin">管理员</option>
        <option value="user">普通用户</option>
      </select>

      <select v-model="selectedStatusFilter" class="filter-select">
        <option value="all">所有状态</option>
        <option value="active">活跃</option>
        <option value="disabled">禁用</option>
      </select>
    </div>
    <table>
      <thead>
        <tr>
          <th>ID</th>
          <th>邮箱</th>
          <th>角色</th>
          <th>状态</th>
          <th>创建时间</th>
          <th>操作</th>
          <th>删除</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="user in filteredUsers" :key="user.id">
          <td>{{ user.id }}</td>
          <td>{{ user.email }}</td>
          <td>{{ user.roleId === 2 ? '管理员' : '普通用户' }}</td>
          <td>
            <span class="status-badge" :class="getStatusClass(user.enabled)">{{ user.enabled ? '活跃' : '禁用' }}</span>
          </td>
          <td>{{ formatDateTime(user.createdTime) }}</td>
          <td>
            <button @click="promptToggleUserStatus(user)" class="btn btn-outline">
              {{ user.enabled ? '禁用账户' : '启用账户' }}
            </button>
          </td>
          <td>
            <button @click="promptDeleteUser(user)" class="btn btn-danger-outline">
              删除用户
            </button>
          </td>
        </tr>
        <tr v-if="loading">
          <td colspan="7" class="text-center">加载中...</td>
        </tr>
        <tr v-if="!loading && filteredUsers.length === 0 && users.length > 0">
          <td colspan="7" class="text-center">未找到匹配的用户</td>
        </tr>
        <tr v-if="!loading && users.length === 0">
          <td colspan="7" class="text-center">没有用户数据</td>
        </tr>
      </tbody>
    </table>

    <div v-if="showConfirmDialog" class="dialog-overlay">
      <div class="dialog-paper">
        <h3 class="dialog-title">{{ confirmDialogTitle }}</h3>
        <p class="dialog-content-text">{{ confirmDialogMessage }}</p>
        <div class="dialog-actions">
          <button @click="cancelAction" class="btn btn-text">取消</button>
          <button @click="executeConfirmedAction" class="btn btn-primary-dialog">确认</button>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { getAllUsers, updateUser, deleteUser as apiDeleteUser } from '@/api/user'; // Corrected API import path with .js extension

const users = ref([]);
const loading = ref(true);
const searchQuery = ref('');
const selectedRoleFilter = ref('all'); // Default to 'all'
const selectedStatusFilter = ref('all'); // Default to 'all'

// Dialog state
const showConfirmDialog = ref(false);
const userToConfirm = ref(null);
const actionToConfirm = ref(''); // 'toggleStatus' or 'delete'
const confirmDialogTitle = ref('');
const confirmDialogMessage = ref('');

const fetchUsers = async () => {
  loading.value = true;
  try {
    const response = await getAllUsers(); 
    // The API response holds data in a 'data' property
    users.value = response.data; 
  } catch (error) {
    console.error('获取用户列表失败:', error);
    users.value = []; // Clear users or handle error state
  } finally {
    loading.value = false;
  }
};

const filteredUsers = computed(() => {
  let filtered = users.value;

  // Filter by email (searchQuery)
  if (searchQuery.value && Array.isArray(filtered)) {
    filtered = filtered.filter(user => 
      user.email.toLowerCase().includes(searchQuery.value.toLowerCase())
    );
  }

  // Filter by role
  if (selectedRoleFilter.value !== 'all' && Array.isArray(filtered)) {
    const roleIdToFilter = selectedRoleFilter.value === 'admin' ? 2 : 1;
    filtered = filtered.filter(user => user.roleId === roleIdToFilter);
  }

  // Filter by status
  if (selectedStatusFilter.value !== 'all' && Array.isArray(filtered)) {
    const statusToFilter = selectedStatusFilter.value === 'active'; // true for active, false for disabled
    filtered = filtered.filter(user => user.enabled === statusToFilter);
  }

  return filtered;
});

const openConfirmDialog = (user, actionType, title, message) => {
  userToConfirm.value = user;
  actionToConfirm.value = actionType;
  confirmDialogTitle.value = title;
  confirmDialogMessage.value = message;
  showConfirmDialog.value = true;
};

const promptToggleUserStatus = (user) => {
  const newStatus = !user.enabled;
  const title = newStatus ? '启用用户确认' : '禁用用户确认';
  const message = `您确定要${newStatus ? '启用' : '禁用'}用户 ${user.email} 吗？`;
  openConfirmDialog(user, 'toggleStatus', title, message);
};

const promptDeleteUser = (user) => {
  const title = '删除用户确认';
  const message = `您确定要永久删除用户 ${user.email} 吗？此操作无法撤销。`;
  openConfirmDialog(user, 'delete', title, message);
};

const cancelAction = () => {
  showConfirmDialog.value = false;
  userToConfirm.value = null;
  actionToConfirm.value = '';
};

const executeConfirmedAction = async () => {
  if (!userToConfirm.value || !actionToConfirm.value) return;

  const user = userToConfirm.value;
  const action = actionToConfirm.value;
  showConfirmDialog.value = false; // Close dialog immediately

  try {
    if (action === 'toggleStatus') {
      const newEnabledState = !user.enabled;
      const updatedUserData = await updateUser(user.id, { enabled: newEnabledState });
      
      const targetUser = users.value.find(u => u.id === user.id);
      if (targetUser) {
        // Use response data from '.data' property to update the user's state
        targetUser.enabled = updatedUserData.data.enabled !== undefined ? updatedUserData.data.enabled : newEnabledState;
      }
      // Optionally: show success notification
    } else if (action === 'delete') {
      await apiDeleteUser(user.id); // Call the imported deleteUser as apiDeleteUser
      users.value = users.value.filter(u => u.id !== user.id); // Remove user from local list
      // Optionally: show success notification
    }
  } catch (error) {
    console.error(`操作失败 (${action}):`, error);
    // Optionally: show error notification
  } finally {
    userToConfirm.value = null;
    actionToConfirm.value = '';
  }
};

const formatDateTime = (dateTimeString) => {
  if (!dateTimeString) return '-';
  try {
    return new Date(dateTimeString).toLocaleString('zh-CN', { hour12: false });
  } catch (e) {
    return dateTimeString; // 如果格式化失败，返回原始字符串
  }
};

const getStatusClass = (enabled) => {
  if (enabled) return 'status-active';
  return 'status-banned'; // Assuming 'banned' is the class for disabled
};

onMounted(() => {
  fetchUsers();
});
</script>

<style scoped>
.admin-module-container {
  background-color: var(--color-card);
  padding: 1.5rem;
  border-radius: 8px;
  color: var(--color-text);
  border: 1px solid var(--color-border);
}

.module-title {
  font-size: 1.5rem; /* 调整标题大小 */
  font-weight: 600;
  margin-bottom: 1.5rem;
  color: var(--color-text);
}

.search-filters-container {
  display: flex;
  gap: 1rem; /* Space between search input and select dropdowns */
  margin-bottom: 1.5rem;
  align-items: center; /* Align items vertically */
}

.search-input {
  flex-grow: 1; /* Allow email search to take more space if needed */
  max-width: 300px; /* Adjust as necessary */
  padding: 0.75rem 1rem; /* 统一内边距 */
  border: 1px solid var(--color-border);
  border-radius: 6px;
  background-color: var(--color-card);
  color: var(--color-text);
  font-size: 0.9rem; /* 统一字体大小 */
  line-height: 1.4; /* 确保行高一致以统一高度 */
  box-sizing: border-box; /* 确保padding和border不影响总高度计算 */
}

.search-input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 2px rgba(var(--color-primary-rgb), 0.2);
}

.filter-select {
  padding: 0.75rem 2.5rem 0.75rem 1rem; /* 上下左padding与input一致，右padding为箭头留空间 */
  border: 1px solid var(--color-border);
  border-radius: 6px;
  background-color: var(--color-card);
  color: var(--color-text);
  font-size: 0.9rem; /* 与搜索框一致 */
  line-height: 1.4; /* 与搜索框一致 */
  min-width: 130px; /* Give select some base width */
  box-sizing: border-box; /* 确保padding和border不影响总高度计算 */

  /* 隐藏默认箭头 */
  appearance: none;
  -webkit-appearance: none;
  -moz-appearance: none;

  /* 自定义箭头 - 使用SVG作为背景图片 */
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='%2394A3B8'%3E%3Cpath fill-rule='evenodd' d='M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z' clip-rule='evenodd' /%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 0.7rem center; /* 定位箭头 */
  background-size: 1em 1em; /* 箭头大小 */
}

.filter-select:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 2px rgba(var(--color-primary-rgb), 0.2);
}

table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 1rem;
}

thead th {
  background-color: transparent; /* 表头背景透明 */
  color: var(--color-text-secondary); /* 表头文字使用次要颜色 */
  padding: 0.75rem 1rem;
  text-align: left;
  font-weight: 500; /* 表头文字稍细 */
  border-bottom: 1px solid var(--color-border);
}

tbody td {
  padding: 0.85rem 1rem; /* 稍微增加单元格内边距 */
  border-bottom: 1px solid var(--color-border);
  color: var(--color-text);
}

tbody tr:last-child td {
  border-bottom: none;
}

tbody tr:hover td {
  background-color: var(--color-surface);
  color: var(--color-text);
}

.text-center {
  text-align: center;
}

/* 统一按钮样式 */
.btn {
  padding: 0.4rem 0.8rem;
  font-size: 0.8rem; /* 略微减小字体 */
  border-radius: 5px;
  cursor: pointer;
  font-weight: 500;
  transition: background-color 0.2s ease, border-color 0.2s ease, color 0.2s ease;
  background-color: transparent;
  text-align: center;
}

.btn-outline {
  border: 1px solid var(--color-border);
  color: var(--color-text);
}

.btn-outline:hover {
  border-color: var(--color-text-secondary);
  color: var(--color-text);
  background-color: var(--color-surface);
}

/* 状态徽章 */
.status-badge {
  padding: 0.25em 0.6em;
  font-size: 0.75rem;
  font-weight: 600;
  border-radius: 0.375rem; /* rounded-md */
  display: inline-block;
}

.status-active {
  background-color: rgba(16, 185, 129, 0.2); /* Emerald 500 with opacity */
  color: #10B981; /* Emerald 500 */
}

.status-banned {
  background-color: rgba(245, 158, 11, 0.2); /* Amber 500 with opacity */
  color: #F59E0B; /* Amber 500 */
}

.btn-danger-outline {
  border: 1px solid var(--admin-danger-color, #E53E3E); /* Example danger color */
  color: var(--admin-danger-color, #E53E3E);
}

.btn-danger-outline:hover {
  background-color: rgba(229, 62, 62, 0.1); /* Danger color with opacity */
  border-color: var(--admin-danger-color-dark, #C53030);
  color: var(--admin-danger-color-dark, #C53030);
}

/* Dialog Styles (similar to LoginPage, adjust as needed for admin theme) */
.dialog-overlay {
  position: fixed;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.6); /* Slightly darker overlay for admin */
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000; /* Ensure it's on top */
}

.dialog-paper {
  background-color: var(--color-card);
  padding: 2rem;
  border-radius: 8px;
  width: 100%;
  max-width: 450px;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  border: 1px solid var(--color-border);
  color: var(--color-text);
}

.dialog-title {
  font-size: 1.3rem;
  font-weight: 600;
  text-align: center;
  margin-bottom: 0.5rem;
}

.dialog-content-text {
  font-size: 0.95rem;
  color: var(--color-text-secondary);
  margin-bottom: 1rem;
  line-height: 1.6;
  text-align: center;
}

.dialog-actions {
  display: flex;
  justify-content: space-between; /* 使按钮分布在两端 */
  gap: 0.75rem;
  margin-top: 1rem;
}

/* 取消按钮样式调整 */
.btn-text {
  background-color: var(--color-card);
  color: var(--color-text);
  border: 1px solid var(--color-border);
  padding: 0.5rem 1rem;
  font-weight: 500;
  border-radius: 5px;
}
.btn-text:hover {
  background-color: var(--color-surface);
  color: var(--color-text);
  border-color: var(--color-text-secondary);
}

/* 确认按钮样式调整 */
.btn-primary-dialog {
  background-color: var(--color-primary);
  color: var(--color-button-primary-text);
  border: 1px solid var(--color-primary);
  padding: 0.5rem 1rem;
  font-weight: 500;
  border-radius: 5px;
}
.btn-primary-dialog:hover {
  background-color: var(--color-primary-hover);
  border-color: var(--color-primary-hover);
}
</style>