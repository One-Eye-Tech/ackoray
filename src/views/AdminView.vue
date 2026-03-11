<template>
  <div class="admin-dashboard">
    <aside class="admin-sidebar">
      <div class="sidebar-header">
        <h2>后台管理</h2>
      </div>
      <nav class="sidebar-nav">
        <button 
          :class="['nav-button', { active: activeModule === 'products' }]"
          @click="activeModule = 'products'"
        >
          <i class="fas fa-box"></i> 产品管理
        </button>
        <button 
          :class="['nav-button', { active: activeModule === 'orders' }]"
          @click="activeModule = 'orders'"
        >
          <i class="fas fa-shopping-cart"></i> 订单管理
        </button>
        <button 
          :class="['nav-button', { active: activeModule === 'users' }]"
          @click="activeModule = 'users'"
        >
          <i class="fas fa-users"></i> 用户管理
        </button>
        <button 
          :class="['nav-button', { active: activeModule === 'attributes' }]"
          @click="activeModule = 'attributes'"
        >
          <i class="fas fa-cog"></i> 属性管理
        </button>
        <button 
          class="nav-button nav-button-chat"
          @click="goToChat"
        >
           客服聊天
        </button>
        <button class="nav-button nav-button-secondary" @click="backToHome">
          <i class="fas fa-arrow-left"></i> 返回首页
        </button>
      </nav>
    </aside>

    <main class="admin-content">
      <component :is="currentComponent" />
    </main>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import ProductManagement from './admin/ProductManagement.vue';
import OrderManagement from './admin/OrderManagement.vue';
import UserManagement from './admin/UserManagement.vue';
import AttributeManagement from './admin/AttributeManagement.vue';

const router = useRouter();
const activeModule = ref('products');

const currentComponent = computed(() => {
  const components = {
    products: ProductManagement,
    orders: OrderManagement,
    users: UserManagement,
    attributes: AttributeManagement
  };
  return components[activeModule.value];
});

const goToChat = () => {
  router.push({ name: 'ChatManagement' });
};

const backToHome = () => {
  router.push('/');
};
</script>

<style scoped>
/* 后台管理系统 - 浅色配色方案 */
.admin-dashboard {
  display: flex;
  min-height: 100vh;
  background: linear-gradient(135deg, #f0f4f8 0%, #e2e8f0 100%);
}

.admin-sidebar {
  width: 250px;
  background: linear-gradient(180deg, #2d3748 0%, #1a202c 100%);
  color: white;
  position: fixed;
  height: 100vh;
  overflow-y: auto;
  box-shadow: 4px 0 12px rgba(0, 0, 0, 0.1);
}

.sidebar-header {
  padding: 1.5rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.sidebar-header h2 {
  font-size: 1.5rem;
  font-weight: 600;
  margin: 0;
}

.sidebar-nav {
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.nav-button {
  width: 100%;
  padding: 0.75rem 1rem;
  background-color: transparent;
  border: none;
  color: #cbd5e0;
  text-align: left;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 0.95rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-weight: 500;
}

.nav-button:hover {
  background-color: rgba(255, 255, 255, 0.1);
  color: white;
  transform: translateX(4px);
}

.nav-button.active {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.back-home-button {
  width: 100%;
  padding: 0.75rem 1rem;
  background-color: transparent;
  border: 1px solid rgba(255, 255, 255, 0.3);
  color: white;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 0.95rem;
  margin-top: 1rem;
  font-weight: 500;
}

.back-home-button:hover {
  background: rgba(255, 255, 255, 0.15);
  border-color: rgba(255, 255, 255, 0.5);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.admin-content {
  margin-left: 250px;
  padding: 2rem;
  flex: 1;
  background: transparent;
}

@media (max-width: 768px) {
  .admin-sidebar {
    width: 100%;
    position: relative;
    height: auto;
  }

  .admin-content {
    margin-left: 0;
    padding: 1rem;
  }

  .sidebar-nav {
    flex-direction: row;
    overflow-x: auto;
    padding: 0.5rem;
  }

  .nav-button {
    white-space: nowrap;
    min-width: fit-content;
  }
}
</style>
