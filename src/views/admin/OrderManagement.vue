<template>
  <div class="admin-module-container order-management-table">
    <div class="toolbar">
      <h2 class="module-title">订单管理</h2>
    </div>

    <div class="search-and-filter-container">
      <div class="search-bar-wrapper">
        <input type="text" v-model="searchQuery" placeholder="搜索订单号或用户邮箱..." class="search-input">
      </div>
      <div class="status-filter-tabs">
        <span 
          v-for="tab in statusTabs" 
          :key="tab.value"
          class="status-tab"
          :class="{ active: statusFilter === tab.value }"
          @click="changeStatusFilter(tab.value)"
        >
          {{ tab.text }}
          <span v-if="tab.count > 0" class="order-count-badge">{{ tab.count }}</span>
        </span>
      </div>
    </div>

    <table>
      <thead>
        <tr>
          <th>订单ID</th>
          <th>订单号</th>
          <th>用户邮箱</th>
          <th>总金额</th>
          <th>状态</th>
          <th>下单时间</th>
          <th>操作</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="order in filteredOrders" :key="order.id">
          <td>{{ order.id }}</td>
          <td>{{ order.orderNumber }}</td>
          <td>{{ order.userEmail }}</td>
          <td>{{ order.totalAmount.toFixed(2) }} RMB</td>
          <td>
            <span class="status-badge" :class="getStatusClass(order.status)">
              {{ getStatusText(order.status) }}
            </span>
          </td>
          <td>{{ formatDateTime(order.orderedTime) }}</td>
          <td>
            <button @click="viewOrderDetail(order.id)" class="btn btn-outline btn-sm">查看详情</button>
          </td>
        </tr>
        <tr v-if="loading">
          <td colspan="7" class="text-center">加载中...</td>
        </tr>
        <tr v-if="!loading && filteredOrders.length === 0 && orders.length > 0">
          <td colspan="7" class="text-center">未找到匹配的订单</td>
        </tr>
        <tr v-if="!loading && orders.length === 0">
          <td colspan="7" class="text-center">没有订单数据</td>
        </tr>
      </tbody>
    </table>

    <!-- 移动端卡片布局 -->
    <div class="mobile-order-list">
      <div v-for="order in filteredOrders" :key="order.id" class="mobile-order-card">
        <div class="mobile-order-header">
          <div class="mobile-order-info">
            <div class="mobile-order-id">订单ID: {{ order.id }}</div>
            <div class="mobile-order-number">{{ order.orderNumber }}</div>
            <div class="mobile-order-email">{{ order.userEmail }}</div>
          </div>
          <div class="mobile-order-status">
            <span class="status-badge" :class="getStatusClass(order.status)">
              {{ getStatusText(order.status) }}
            </span>
          </div>
        </div>
        <div class="mobile-order-details">
          <div>
            <div class="mobile-order-amount">{{ order.totalAmount.toFixed(2) }} RMB</div>
            <div class="mobile-order-time">{{ formatDateTime(order.orderedTime) }}</div>
          </div>
          <div class="mobile-order-actions">
            <button @click="viewOrderDetail(order.id)" class="btn btn-outline btn-sm">查看详情</button>
          </div>
        </div>
      </div>
      
      <!-- 移动端加载和空状态 -->
      <div v-if="loading" class="mobile-order-card">
        <div class="text-center">加载中...</div>
      </div>
      <div v-if="!loading && filteredOrders.length === 0 && orders.length > 0" class="mobile-order-card">
        <div class="text-center">未找到匹配的订单</div>
      </div>
      <div v-if="!loading && orders.length === 0" class="mobile-order-card">
        <div class="text-center">没有订单数据</div>
      </div>
    </div>

      <!-- 分页控件 -->
      <div v-if="totalPages > 1" class="pagination-controls">
        <button 
          @click="goToPreviousPage" 
          :disabled="currentPage === 0" 
          class="pagination-button"
        >
          上一页
        </button>
        <button 
          v-for="page in paginationPages" 
          :key="page" 
          @click="goToPage(page)"
          :class="['pagination-button', { active: currentPage === page }]"
        >
          {{ page + 1 }}
        </button>
        <button 
          @click="goToNextPage" 
          :disabled="currentPage === totalPages - 1" 
          class="pagination-button"
        >
          下一页
        </button>
      </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue';
import { useRouter } from 'vue-router';
import { getAllOrders, getOrderCounts } from '@/api/order'; // 导入新的API

// debounce function for search input
const debounce = (fn, delay) => {
  let timeoutId;
  return (...args) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => {
      fn(...args);
    }, delay);
  };
};

const orders = ref([]);
const loading = ref(true);
const statusFilter = ref('');
const searchQuery = ref('');
const router = useRouter();
const orderCounts = ref({});

// 分页相关的响应式数据
const currentPage = ref(0); // 后端页码从0开始
const itemsPerPage = ref(20); // 每页显示条目数
const totalPages = ref(0); // 总页数
const totalElements = ref(0); // 总条目数

// 订单状态映射，此部分不变，用于前端显示
const orderStatusMap = {
  PENDING: '待支付',
  PROCESSING: '处理中/待发货',
  SHIPPED: '已发货/待收货',
  DELIVERED: '已完成',
  CANCELED: '已取消',
  REFUNDED: '退货/退款',
  REFUND_IN_PROGRESS: '退货/退款处理中'
};

const statusTabs = computed(() => [
  { text: '全部订单', value: '', count: orderCounts.value.ALL || 0 },
  { text: '待付款', value: 'PENDING', count: orderCounts.value.PENDING || 0 },
  { text: '待发货', value: 'PROCESSING', count: orderCounts.value.PROCESSING || 0 },
  { text: '待收货', value: 'SHIPPED', count: orderCounts.value.SHIPPED || 0 },
  { text: '已完成', value: 'DELIVERED', count: orderCounts.value.DELIVERED || 0 },
  { text: '已取消', value: 'CANCELED', count: orderCounts.value.CANCELED || 0 },
  { 
    text: '退货/退款', 
    value: 'REFUNDED,REFUND_IN_PROGRESS', 
    count: (orderCounts.value.REFUNDED || 0) + (orderCounts.value.REFUND_IN_PROGRESS || 0) 
  },
]);

const getStatusText = (statusKey) => {
  return orderStatusMap[statusKey] || statusKey;
};

// 实际从后端获取订单数据的方法
const fetchOrders = async () => {
  loading.value = true;
  try {
    // 传递状态筛选、搜索查询和分页参数给后端
    const params = {
      page: currentPage.value,
      size: itemsPerPage.value,
      // 如果后端需要status和query参数，也在这里添加
      ...(statusFilter.value && { status: statusFilter.value }),
      ...(searchQuery.value && { query: searchQuery.value })
    };
    const response = await getAllOrders(params);

    // 处理不同的响应格式
    if (response && response.data) {
      orders.value = Array.isArray(response.data) ? response.data : (response.data.content || []);
      totalPages.value = response.data.totalPages || 0;
      totalElements.value = response.data.totalElements || 0;
    } else if (response && response.content) {
      orders.value = response.content || [];
      totalPages.value = response.totalPages || 0;
      totalElements.value = response.totalElements || 0;
    } else {
      orders.value = [];
      totalPages.value = 0;
      totalElements.value = 0;
    }

    console.log('Fetched orders from backend:', orders.value);
    console.log('Pagination info:', { totalPages: totalPages.value, totalElements: totalElements.value });

  } catch (error) {
    console.error('获取订单列表失败:', error);
    orders.value = [];
    alert('获取订单列表失败: ' + (error.response?.data?.message || error.message));
  } finally {
    loading.value = false;
  }
};

const fetchOrderCounts = async () => {
  try {
    const counts = await getOrderCounts();
    // 计算所有订单的总数
    const totalCount = Object.values(counts).reduce((sum, current) => sum + current, 0);
    orderCounts.value = { ...counts, ALL: totalCount };
  } catch (error) {
    console.error('获取订单数量失败:', error);
  }
};

// 过滤和搜索逻辑现在主要在后端进行，前端只负责渲染和触发 fetchOrders
const filteredOrders = computed(() => {
  return orders.value; // 直接返回从后端获取的当前页订单
});

const changeStatusFilter = (newStatus) => {
  statusFilter.value = newStatus;
  currentPage.value = 0; // 更改筛选条件时重置到第一页
  fetchOrders();
};

const viewOrderDetail = (orderId) => {
  // 导航到新的管理员订单详情页
  router.push({ name: 'AdminOrderDetailPage', params: { orderId: orderId } });
};

const formatDateTime = (dateTimeString) => {
  if (!dateTimeString) return '-';
  try {
    return new Date(dateTimeString).toLocaleString('zh-CN', { hour12: false });
  } catch (e) {
    return dateTimeString;
  }
};

const getStatusClass = (status) => {
  switch (status) {
    case 'PENDING': return 'status-pending';
    case 'PROCESSING': return 'status-processing';
    case 'SHIPPED': return 'status-shipped';
    case 'DELIVERED': return 'status-delivered';
    case 'CANCELED': return 'status-canceled';
    case 'REFUNDED': return 'status-refunded';
    case 'REFUND_IN_PROGRESS': return 'status-refund-in-progress';
    default: return '';
  }
};

// 分页导航方法
const goToPage = (page) => {
  if (page >= 0 && page < totalPages.value) {
    currentPage.value = page;
    fetchOrders();
  }
};

const goToPreviousPage = () => {
  if (currentPage.value > 0) {
    currentPage.value--;
    fetchOrders();
  }
};

const goToNextPage = () => {
  if (currentPage.value < totalPages.value - 1) {
    currentPage.value++;
    fetchOrders();
  }
};

// 计算要显示的分页页码 (例如: 1 2 [3] 4 5)
const paginationPages = computed(() => {
  const pages = [];
  const maxPagesToShow = 5; // 最多显示5个页码按钮
  let startPage = Math.max(0, currentPage.value - Math.floor(maxPagesToShow / 2));
  let endPage = Math.min(totalPages.value - 1, startPage + maxPagesToShow - 1);

  // 调整startPage以确保显示maxPagesToShow个页码（如果总页数足够）
  if (endPage - startPage + 1 < maxPagesToShow && totalPages.value > maxPagesToShow) {
    startPage = Math.max(0, endPage - maxPagesToShow + 1);
  }

  for (let i = startPage; i <= endPage; i++) {
    pages.push(i);
  }
  return pages;
});


onMounted(() => {
  fetchOrders(); // 页面加载时获取订单
  fetchOrderCounts(); // 页面加载时获取订单数量
});

// 监听搜索查询的变化，并进行去抖动处理
watch(searchQuery, debounce(() => {
  currentPage.value = 0; // 搜索时重置到第一页
  fetchOrders();
}, 500)); // 0.5 秒去抖
</script>

<style scoped>
.admin-module-container {
  background-color: var(--color-card);
  padding: 1.5rem;
  border-radius: 8px;
  color: var(--color-text);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem; /* Reduced margin as tabs will be below */
}

.module-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--admin-text-primary);
  margin: 0;
}

.search-and-filter-container {
  /* Container for both search and filter tabs if they are grouped */
  margin-bottom: 1.5rem;
}

.search-bar-wrapper {
  margin-bottom: 1rem; /* Space between search bar and filter tabs */
}

.search-input {
  width: 100%;
  max-width: 400px; 
  padding: 0.65rem 0.9rem;
  border: 1px solid var(--color-border);
  border-radius: 6px;
  background-color: var(--color-card);
  color: var(--color-text);
  font-size: 0.9rem;
  box-sizing: border-box;
}

.search-input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
}

.status-filter-tabs {
  display: flex;
  gap: 1rem; /* Spacing between tabs */
  padding-bottom: 0.75rem; /* Space for the active tab indicator line */
  border-bottom: 1px solid var(--color-border); /* Line below tabs */
  position: relative;
}

.status-tab {
  padding: 0.5rem 0.25rem; /* Adjust padding for tighter look if needed */
  cursor: pointer;
  color: var(--color-text-secondary);
  font-size: 0.9rem;
  font-weight: 500;
  position: relative;
  transition: color 0.2s ease;
}

.status-tab:hover {
  color: var(--color-text);
}

.status-tab.active {
  color: var(--color-primary); /* Active tab color */
  font-weight: 600;
}

.status-tab.active::after {
  content: '';
  position: absolute;
  bottom: -12px; /* Align with the parent's padding-bottom and border */
  left: 0;
  right: 0;
  height: 2px;
  background-color: var(--color-primary);
}

.order-count-badge {
  position: absolute;
  top: 0;
  right: -5px;
  background-color: #007BFF !important; /* 固定颜色 */
  color: #FFFFFF !important; /* 固定颜色 */
  border-radius: 10px;
  padding: 0 6px;
  font-size: 12px;
  line-height: 18px;
  font-weight: 600;
  min-width: 18px;
  text-align: center;
  transition: none;
  transform: translate(50%, -50%);
}

table {
  width: 100%;
  border-collapse: collapse;
}

thead th {
  background-color: transparent;
  color: var(--color-text-secondary);
  padding: 0.75rem 1rem;
  text-align: left;
  font-weight: 500;
  border-bottom: 1px solid var(--color-border);
}

tbody td {
  padding: 0.85rem 1rem;
  border-bottom: 1px solid var(--color-border);
  color: var(--color-text-secondary);
  vertical-align: middle;
}

tbody tr:last-child td {
  border-bottom: none;
}

tbody tr:hover td {
  background-color: rgba(51, 65, 85, 0.5);
  color: var(--admin-text-primary);
}

.text-center {
  text-align: center;
}

/* Buttons */
.btn {
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  transition: background-color 0.2s ease, border-color 0.2s ease, color 0.2s ease;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.btn-sm {
  padding: 0.3rem 0.7rem;
  font-size: 0.75rem;
  gap: 0.3rem;
}

.btn-outline {
  background-color: transparent;
  border: 1px solid var(--color-text-secondary);
  color: var(--color-text-secondary);
}
.btn-outline:hover {
  border-color: var(--color-text);
  color: var(--color-text);
  background-color: rgba(71, 85, 105, 0.3);
}

/* Status Badges */
.status-badge {
  padding: 0.3em 0.65em;
  font-size: 0.75rem;
  font-weight: 600;
  border-radius: 0.375rem;
  display: inline-block;
  line-height: 1.2;
  text-align: center;
  min-width: 90px; /* 稍微增加徽章最小宽度以适应文字 */
}

.status-pending {
  background-color: rgba(245, 158, 11, 0.2); /* Amber 500 */
  color: #F59E0B;
}

.status-processing {
  background-color: rgba(59, 130, 246, 0.2); /* Blue 500 */
  color: #3B82F6;
}

.status-shipped {
  background-color: rgba(139, 92, 246, 0.2); /* Violet 500 */
  color: #8B5CF6;
}

.status-delivered {
  background-color: rgba(16, 185, 129, 0.2); /* Emerald 500 */
  color: #10B981;
}

.status-canceled {
  background-color: rgba(107, 114, 128, 0.2); /* Gray 500 */
  color: #6B7280;
}

.status-refunded {
  background-color: rgba(239, 68, 68, 0.2); /* Red 500 */
  color: #EF4444;
}

.status-refund-in-progress {
  background-color: rgba(245, 158, 11, 0.2); /* Amber 500 */
  color: #F59E0B;
}

/* Pagination Styles */
.pagination-controls {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 0.5rem;
  margin-top: 2rem;
}

.pagination-button {
  padding: 0.5rem 1rem;
  background-color: var(--admin-card-bg, #2A2A2D);
  color: var(--color-text-secondary);
  border: 1px solid var(--color-border);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.pagination-button:hover:not(:disabled),
.pagination-button.active {
  background-color: var(--color-primary);
  color: #fff;
  border-color: var(--color-primary);
}

.pagination-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* 默认隐藏移动端卡片布局 */
.mobile-order-list {
  display: none;
}

/* 移动端响应式布局 */
@media (max-aspect-ratio: 1/1) {
  .admin-module-container {
    padding: 1rem;
  }
  
  .toolbar {
    margin-bottom: 1rem;
  }
  
  .module-title {
    font-size: 1.3rem;
  }
  
  /* 搜索和筛选区域 */
  .search-and-filter-container {
    flex-direction: column;
    gap: 1rem;
    margin-bottom: 1rem;
  }
  
  .search-bar-wrapper {
    width: 100%;
  }
  
  .search-input {
    font-size: 0.9rem;
    padding: 0.8rem;
  }
  
  .status-filter-tabs {
    flex-wrap: wrap;
    gap: 0.5rem;
    justify-content: flex-start;
  }
  
  .status-tab {
    font-size: 0.85rem;
    padding: 0.6rem 0.8rem;
    white-space: nowrap;
  }
  
  /* 表格移动端适配 - 改为卡片布局 */
  table {
    display: none; /* 隐藏表格 */
  }
  
  /* 显示移动端卡片布局 */
  .mobile-order-list {
    display: flex !important;
    flex-direction: column;
    gap: 1rem;
  }
  
  .mobile-order-card {
    background-color: var(--admin-card-bg);
    border: 1px solid var(--admin-border-color);
    border-radius: 8px;
    padding: 1rem;
  }
  
  .mobile-order-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 0.8rem;
    gap: 1rem;
  }
  
  .mobile-order-info {
    flex-grow: 1;
  }
  
  .mobile-order-id {
    font-size: 0.85rem;
    color: var(--admin-text-secondary);
    margin-bottom: 0.2rem;
  }
  
  .mobile-order-number {
    font-weight: 600;
    color: var(--admin-text-primary);
    font-size: 0.95rem;
    margin-bottom: 0.3rem;
  }
  
  .mobile-order-email {
    font-size: 0.85rem;
    color: var(--admin-text-secondary);
  }
  
  .mobile-order-status {
    flex-shrink: 0;
  }
  
  .mobile-order-details {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-top: 0.8rem;
    border-top: 1px solid var(--admin-border-color);
  }
  
  .mobile-order-amount {
    font-weight: 600;
    color: var(--admin-text-primary);
    font-size: 1rem;
  }
  
  .mobile-order-time {
    font-size: 0.8rem;
    color: var(--admin-text-secondary);
    margin-bottom: 0.5rem;
  }
  
  .mobile-order-actions {
    display: flex;
    gap: 0.5rem;
  }
  
  .btn-sm {
    font-size: 0.8rem;
    padding: 0.5rem 0.8rem;
  }
  
  /* 分页控件移动端适配 */
  .pagination-controls {
    flex-wrap: wrap;
    gap: 0.3rem;
    margin-top: 1.5rem;
  }
  
  .pagination-button {
    font-size: 0.85rem;
    padding: 0.6rem 0.8rem;
    min-width: 44px; /* 确保触控友好 */
  }
}
</style> 