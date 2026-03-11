<template>
  <div class="admin-order-detail-page-container">
    <main class="order-detail-main-content">
      <div v-if="loading" class="loading-state">
        <p>加载中...</p>
      </div>
      <div v-else-if="!order" class="not-found-state">
        <p>未找到订单</p>
        <router-link to="/admin" class="btn btn-primary">返回订单管理</router-link>
      </div>
      <div v-else class="order-detail-layout">
        <div class="order-detail-header">
          <router-link to="/admin" class="btn btn-outline back-to-orders-btn">&larr; 返回订单管理</router-link>
        </div>

        <!-- 管理员操作按钮 -->
        <div v-if="['REFUND_IN_PROGRESS','PROCESSING', 'SHIPPED', 'REFUND_FAILED'].includes(order.status)" class="admin-actions card">
          <h3>管理员操作</h3>
          <div class="action-buttons">
            <button v-if="order.status === 'PROCESSING'" @click="handleShipOrder" class="btn btn-primary">发货</button>
            <button v-if="order.status === 'SHIPPED'" @click="handleUpdateShippingInfo" class="btn btn-outline">更新物流信息</button>
            <button v-if="['REFUND_IN_PROGRESS', 'REFUND_FAILED'].includes(order.status)" @click="handleApproveRefund" class="btn btn-success">同意退款</button>
            <button v-if="['REFUND_IN_PROGRESS', 'REFUND_FAILED'].includes(order.status)" @click="handleRejectRefund" class="btn btn-danger">拒绝退款</button>
          </div>
        </div>

        <div class="order-meta-info card">
          <div class="meta-item">
            <span class="meta-label">订单ID:</span>
            <span class="meta-value">{{ order.id }}</span>
          </div>
          <div class="meta-item">
            <span class="meta-label">订单号:</span>
            <span class="meta-value">{{ order.orderNumber }}</span>
          </div>
          <div class="meta-item">
            <span class="meta-label">下单时间:</span>
            <span class="meta-value">{{ formatDate(order.orderedTime) }}</span>
          </div>
          <div class="meta-item">
            <span class="meta-label">订单状态:</span>
            <span class="meta-value status-text">{{ getStatusText(order.status) }}</span>
          </div>
          <div class="meta-item" v-if="order.paymentMethod">
            <span class="meta-label">支付方式:</span>
            <span class="meta-value">{{ order.paymentMethod }}</span>
          </div>
          <div class="meta-item" v-if="order.userEmail">
            <span class="meta-label">用户邮箱:</span>
            <span class="meta-value">{{ order.userEmail }}</span>
          </div>
          <div class="meta-item" v-if="order.paidTime">
            <span class="meta-label">支付时间:</span>
            <span class="meta-value">{{ formatDate(order.paidTime) }}</span>
          </div>
          <div class="meta-item" v-if="order.shippedTime">
            <span class="meta-label">发货时间:</span>
            <span class="meta-value">{{ formatDate(order.shippedTime) }}</span>
          </div>
          <div class="meta-item" v-if="order.deliveredTime">
            <span class="meta-label">送达时间:</span>
            <span class="meta-value">{{ formatDate(order.deliveredTime) }}</span>
          </div>

          <!-- Tracking Information -->
          <div class="meta-item" v-if="order.trackingNumber">
            <span class="meta-label">物流单号:</span>
            <span class="meta-value">{{ order.trackingNumber }}</span>
          </div>
          <div class="meta-item" v-if="order.shippingCarrier">
            <span class="meta-label">物流公司:</span>
            <span class="meta-value">{{ order.shippingCarrier }}</span>
          </div>
          <div class="meta-item" v-if="order.customerNotes">
            <span class="meta-label">客户备注:</span>
            <span class="meta-value">{{ order.customerNotes }}</span>
          </div>
        </div>

        <div class="order-contents-grid">
          <section class="shipping-address-section card">
            <h2>收货地址</h2>
            <!-- 使用地址快照信息（订单创建时保存的地址信息） -->
            <div v-if="order.shippingRecipientName">
              <p><strong>{{ order.shippingRecipientName }}</strong></p>
              <p>{{ order.shippingPhoneNumber }}</p>
              <p>{{ order.shippingDetailedAddress }}</p>
            </div>
            <div v-else><p>地址不可用</p></div>
          </section>

          <section class="order-summary-section card">
            <h2>订单总览</h2>
            <div class="summary-item">
              <span>商品小计 ({{ order.items?.length || 0 }} 件)</span>
              <span>{{ Math.round(order.itemsSubtotal) }}￥</span>
            </div>
            <div class="summary-item">
              <span>运费</span>
              <span>0￥</span> <!-- Admin side might also have fixed shipping cost or display 0 -->
            </div>
            <div v-if="discount > 0" class="summary-item">
              <span>折扣</span>
              <span>-{{ Math.round(discount) }}￥</span>
            </div>
            <div class="summary-item total-line">
              <span>订单总计</span>
              <span>{{ Math.round(order.totalAmount) }}￥</span>
            </div>
          </section>
        </div>

        <section class="order-items-section card">
          <h2>订单商品</h2>
          <ul class="order-items-list">
            <li v-for="item in order.items" :key="item.productId" class="order-item">
              <img :src="item.mainImageUrl || '/src/assets/images/placeholder-product.png'" :alt="item.productName" class="item-image" />
              <div class="item-info">
                <p class="item-name">{{ item.productName }}</p>
                <p class="item-qty-price">{{ item.color || '默认' }} / {{ item.size || '默认' }} / x{{ item.quantity }}</p>
              </div>
              <p class="item-total-price">{{ Math.round(item.quantity * item.priceAtPurchase) }}￥</p>
            </li>
          </ul>
        </section>
      </div>
    </main>

    <!-- 物流信息模态框 -->
    <div v-if="showShippingModal" class="modal-backdrop" @click="closeShippingModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>{{ modalTitle }}</h3>
          <button class="modal-close-btn" @click="closeShippingModal">×</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>物流公司 <span class="required">*</span></label>
            <input 
              v-model="shippingForm.carrier" 
              type="text" 
              class="form-input" 
              placeholder="请输入物流公司名称（如：顺丰速运）"
            />
          </div>
          <div class="form-group">
            <label>物流单号 <span class="required">*</span></label>
            <input 
              v-model="shippingForm.trackingNumber" 
              type="text" 
              class="form-input" 
              placeholder="请输入物流单号"
            />
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="closeShippingModal">取消</button>
          <button 
            class="btn btn-primary" 
            @click="confirmShipping"
            :disabled="!shippingForm.carrier || !shippingForm.trackingNumber"
          >
            确认发货
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
// import { useI18n } from 'vue-i18n'; // 暂时移除国际化
import { getOrderById, updateOrderStatus, shipOrder } from '@/api/order';
// import ShippingInfoModal from '../../components/admin/ShippingInfoModal.vue';

const route = useRoute();
const router = useRouter();
// const { t } = useI18n(); // 暂时移除国际化
const loading = ref(true);
const order = ref(null);

const shippingCost = ref(0.00); // 暂定免运费
const discount = ref(0.00);    // 暂无折扣

// 控制物流信息模态框显示
const showShippingModal = ref(false);
const modalTitle = ref('');

// 物流信息表单
const shippingForm = ref({
  carrier: '',
  trackingNumber: ''
});

const orderStatusMap = {
  PENDING: '待支付',
  PROCESSING: '处理中/待发货',
  SHIPPED: '已发货',
  DELIVERED: '已送达/已完成',
  CANCELED: '已取消',
  REFUNDED: '已退款',
  REFUND_FAILED: '退款失败',
  REFUND_IN_PROGRESS: '退款中'
};

const getStatusText = (statusKey) => {
  return orderStatusMap[statusKey] || statusKey;
};


const formatDate = (dateString) => {
  if (!dateString) return '';
  const options = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' };
  return new Date(dateString).toLocaleDateString(undefined, options);
};

const fetchOrderDetails = async () => {
  loading.value = true;
  const orderId = route.params.orderId; // 确保路由参数名正确

  if (orderId) {
    try {
      const response = await getOrderById(orderId);
      // 处理API响应，提取data字段
      order.value = response.data || response;
      console.log('Fetched admin order details:', order.value);
    } catch (error) {
      console.error('Error fetching admin order details:', error);
      alert('获取订单详情失败: ' + (error.response?.data?.message || error.message));
      // 重定向回订单管理
      router.push({ path: '/admin' });
    } finally {
      loading.value = false;
    }
  } else {
    console.warn('Order ID is missing from route params for admin order detail.');
    loading.value = false;
    router.push({ path: '/admin' }); // 重定向回后台管理
  }
};

// 管理员操作方法
const handleShipOrder = () => {
  modalTitle.value = '填写发货信息';
  // 重置表单
  shippingForm.value = {
    carrier: '',
    trackingNumber: ''
  };
  showShippingModal.value = true;
};

// 关闭物流信息模态框
const closeShippingModal = () => {
  showShippingModal.value = false;
  shippingForm.value = {
    carrier: '',
    trackingNumber: ''
  };
};

// 确认发货
const confirmShipping = async () => {
  if (!shippingForm.value.carrier || !shippingForm.value.trackingNumber) {
    alert('请填写完整的物流信息！');
    return;
  }

  try {
    const response = await shipOrder(
      order.value.id,
      shippingForm.value.trackingNumber,
      shippingForm.value.carrier
    );
    
    order.value = response.data || response;
    alert('发货成功！物流信息已更新，订单状态已变更为"已发货"。');
    closeShippingModal();
  } catch (error) {
    console.error('发货失败:', error);
    alert('发货失败: ' + (error.response?.data?.message || error.message));
  }
};

const handleDeliverOrder = async () => {
  if (confirm('确认标记为已送达？')) {
    try {
      const response = await updateOrderStatus(order.value.id, 'DELIVERED');
      order.value = response.data || response;
      alert('订单已成功标记为已送达！');
    } catch (error) {
      console.error('标记为已送达失败:', error);
      alert('标记为已送达失败: ' + (error.response?.data?.message || error.message));
    }
  }
};

const handleCancelOrder = async () => {
  if (confirm('确认取消订单？此操作不可撤销！')) {
    try {
      const response = await updateOrderStatus(order.value.id, 'CANCELED');
      order.value = response.data || response;
      alert('订单已成功取消！');
    } catch (error) {
      console.error('取消订单失败:', error);
      alert('取消订单失败: ' + (error.response?.data?.message || error.message));
    }
  }
};

// 同意退款 - 将订单状态改为已退款
const handleApproveRefund = async () => {
  if (confirm('确认同意退款吗？订单状态将变更为"已退款"。')) {
    try {
      const response = await updateOrderStatus(order.value.id, 'REFUNDED');
      order.value = response.data || response;
      alert('退款已批准！订单状态已更新为"已退款"。');
    } catch (error) {
      console.error('同意退款失败:', error);
      alert('同意退款失败: ' + (error.response?.data?.message || error.message));
    }
  }
};

// 拒绝退款 - 将订单状态改回已发货
const handleRejectRefund = async () => {
  if (confirm('确认拒绝退款吗？订单状态将恢复为"已发货"。')) {
    try {
      const response = await updateOrderStatus(order.value.id, 'SHIPPED');
      order.value = response.data || response;
      alert('已拒绝退款！订单状态已恢复为"已发货"。');
    } catch (error) {
      console.error('拒绝退款失败:', error);
      alert('拒绝退款失败: ' + (error.response?.data?.message || error.message));
    }
  }
};

// 更新物流信息
const handleUpdateShippingInfo = () => {
  modalTitle.value = '更新物流信息';
  // 使用订单现有的物流信息作为初始值
  shippingForm.value = {
    carrier: order.value.shippingCarrier || '',
    trackingNumber: order.value.trackingNumber || ''
  };
  showShippingModal.value = true;
};

onMounted(() => {
  fetchOrderDetails();
});
</script>

<style scoped>
.admin-order-detail-page-container {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background-color: transparent;
  color: var(--color-text);
  padding: 1.5rem;
}

.order-detail-main-content {
  padding-top: 1rem;
  padding-bottom: 2rem;
  flex-grow: 1;
  max-width: 1000px;
  margin: 0 auto;
  width: 100%;
  background-color: #FFFFFF;
  border-radius: 12px;
  border: 1px solid #E2E8F0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  padding: 2rem;
}

.order-detail-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.page-title {
  font-size: clamp(1.8rem, 4.5vw, 2.4rem);
  font-weight: 600;
  color: #1E293B;
}

.card {
  background-color: #F8FAFC;
  border-radius: 10px;
  border: 1px solid #E2E8F0;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  transition: all 0.2s ease;
}

.card:hover {
  border-color: #3B82F6;
  box-shadow: 0 2px 6px rgba(59, 130, 246, 0.1);
}

.btn-outline {
  background-color: #FFFFFF;
  border: 2px solid #64748B;
  color: #64748B;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  font-size: 0.95rem;
  transition: all 0.2s ease;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.btn-outline:hover {
  background-color: #64748B;
  color: #FFFFFF;
  border-color: #64748B;
  transform: translateY(-1px);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
}

.order-meta-info {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 1.5rem;
  padding: 0.5rem 0;
}

.meta-item {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  padding: 0.75rem;
  background-color: #FFFFFF;
  border-radius: 8px;
  border-left: 3px solid #3B82F6;
  border: 1px solid #E2E8F0;
  transition: all 0.2s ease;
}

.meta-item:hover {
  background-color: #F0F7FF;
  border-color: #3B82F6;
  transform: translateY(-2px);
  box-shadow: 0 2px 4px rgba(59, 130, 246, 0.1);
}

.meta-label {
  font-size: 0.85rem;
  color: #64748B;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.meta-value {
  font-size: 1.05rem;
  color: #1E293B;
  font-weight: 600;
}

.status-text {
  padding: 0.4rem 0.9rem;
  border-radius: 6px;
  font-size: 0.85rem;
  font-weight: 600;
  color: #FFFFFF;
  background-color: #3B82F6;
  display: inline-block;
  width: fit-content;
  box-shadow: 0 1px 3px rgba(59, 130, 246, 0.3);
}

.order-contents-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.5rem;
}

@media (min-width: 768px) {
  .order-contents-grid {
    grid-template-columns: 1fr 1fr; /* Two columns on larger screens */
  }
}

.shipping-address-section h2,
.order-summary-section h2,
.order-items-section h2 {
  font-size: 1.25rem;
  color: #1E293B;
  margin-bottom: 1rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid #E2E8F0;
}

.shipping-address-section p {
  color: #475569;
  margin: 0.5rem 0;
  line-height: 1.6;
}

.shipping-address-section p strong {
  color: #1E293B;
  font-weight: 600;
}

.order-summary-section .summary-item {
  display: flex;
  justify-content: space-between;
  padding: 0.5rem 0;
  border-bottom: 1px dashed #E2E8F0;
  font-size: 0.95rem;
  color: #475569;
}

.order-summary-section .summary-item:last-of-type {
  border-bottom: none;
}

.order-summary-section .total-line {
  font-weight: 600;
  font-size: 1.1rem;
  color: #1E293B;
  border-top: none;
}
/* Ensure there's no border-top for .total-line here if it was present in source */


.order-items-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.order-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem 0;
  border-bottom: 1px solid #E2E8F0;
}

.order-item:last-child {
  border-bottom: none;
}

.item-image {
  width: 80px;
  height: 80px;
  object-fit: cover;
  border-radius: 4px;
  border: 1px solid #E2E8F0;
}

.item-info {
  flex-grow: 1;
}

.item-name {
  font-weight: 600;
  color: #1E293B;
  margin-bottom: 0.25rem;
}

.item-qty-price {
  font-size: 0.9rem;
  color: #64748B;
}

.item-total-price {
  font-weight: 600;
  color: #1E293B;
  font-size: 1rem;
  min-width: 80px;
  text-align: right;
}

/* Admin Actions Section */
.admin-actions {
  margin-bottom: 2rem;
  background: linear-gradient(135deg, #F0F9FF 0%, #E0F2FE 100%);
  border-left: 4px solid #3B82F6;
}

.admin-actions h3 {
  font-size: 1.3rem;
  color: #1E293B;
  font-weight: 700;
  margin-bottom: 1.25rem;
  padding-bottom: 0.75rem;
  border-bottom: 2px solid #3B82F6;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.admin-actions h3::before {
  content: "⚡";
  font-size: 1.5rem;
}

.admin-actions .action-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
}

/* Base button styles - ensure they match admin theme */
.btn {
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  font-size: 0.95rem;
  transition: all 0.2s ease;
  border: none;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
}

.btn-primary { 
  background-color: #3B82F6; 
  color: #FFFFFF;
  border: 2px solid #3B82F6;
}

.btn-primary:hover { 
  background-color: #2563EB;
  border-color: #2563EB;
}

.btn-success { 
  background-color: #10B981; 
  color: #FFFFFF;
  border: 2px solid #10B981;
}

.btn-success:hover { 
  background-color: #059669;
  border-color: #059669;
}

.btn-danger { 
  background-color: #EF4444; 
  color: #FFFFFF;
  border: 2px solid #EF4444;
}

.btn-danger:hover { 
  background-color: #DC2626;
  border-color: #DC2626;
}

.btn-warning { 
  background-color: #F59E0B; 
  color: #FFFFFF;
  border: 2px solid #F59E0B;
}

.btn-warning:hover { 
  background-color: #D97706;
  border-color: #D97706;
}

/* Loading and Not Found States */
.loading-state,
.not-found-state {
  text-align: center;
  padding: 3rem 1rem;
  color: #64748B;
}

.loading-state p,
.not-found-state p {
  font-size: 1.1rem;
  margin-bottom: 1rem;
}

/* 移动端响应式布局 */
@media (max-aspect-ratio: 1/1) {
  .admin-order-detail-page-container {
    padding: 0;
  }
  
  .order-detail-main-content {
    padding: 1rem;
  }
  
  .order-detail-layout {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }
  
  .order-detail-header {
    margin-bottom: 0.5rem;
  }
  
  .back-to-orders-btn {
    font-size: 0.85rem;
    padding: 0.6rem 1rem;
  }
  
  /* 管理员操作区域 */
  .admin-actions {
    margin-bottom: 1rem;
    padding: 1rem;
  }
  
  .admin-actions h3 {
    font-size: 1.1rem;
    margin-bottom: 0.8rem;
    padding-bottom: 0.5rem;
  }
  
  .admin-actions .action-buttons {
    flex-direction: column;
    gap: 0.8rem;
  }
  
  .admin-actions .btn {
    width: 100%;
    justify-content: center;
    padding: 0.8rem 1rem;
    font-size: 0.9rem;
  }
  
  /* 订单信息区域 */
  .order-meta-info.card {
    padding: 1rem;
    display: block;
  }
  
  .meta-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.8rem 0;
    border-bottom: 1px solid var(--color-border-subtle);
  }
  
  .meta-item:last-child {
    border-bottom: none;
  }
  
  .meta-label {
    font-size: 0.9rem;
    font-weight: 500;
    color: var(--color-text);
  }
  
  .meta-value {
    font-size: 0.9rem;
    color: var(--color-text);
    text-align: right;
    max-width: 60%;
    word-break: break-word;
  }
  
  .status-text {
    font-weight: 600;
  }
  
  /* 订单商品区域 */
  .order-items-section.card {
    padding: 1rem;
  }
  
  .order-items-section h2 {
    font-size: 1.1rem;
    margin-bottom: 0.8rem;
    padding-bottom: 0.5rem;
  }
  
  .order-items-list {
    margin: -0.5rem 0;
  }
  
  .order-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.8rem;
    padding: 1rem 0;
  }
  
  .item-image {
    width: 60px;
    height: 60px;
    align-self: center;
  }
  
  .item-info {
    width: 100%;
    text-align: center;
  }
  
  .item-name {
    font-size: 0.95rem;
    margin-bottom: 0.5rem;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  
  .item-qty-price {
    font-size: 0.85rem;
    margin-bottom: 0.3rem;
  }
  
  .item-total-price {
    font-size: 0.9rem;
    text-align: center;
    min-width: auto;
  }
  
  /* 收货地址区域 */
  .shipping-address-section.card,
  .order-summary-section.card {
    padding: 1rem;
  }
  
  .shipping-address-section h2,
  .order-summary-section h2 {
    font-size: 1.1rem;
    margin-bottom: 0.8rem;
    padding-bottom: 0.5rem;
  }
  
  .address-info p {
    margin-bottom: 0.5rem;
    font-size: 0.9rem;
    line-height: 1.4;
  }
  
  /* 订单汇总区域 */
  .summary-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.8rem 0;
    font-size: 0.9rem;
  }
  
  .total-line {
    border-top: 1px solid var(--color-border-subtle);
    padding-top: 0.8rem;
    margin-top: 0.5rem;
    font-weight: 600;
  }
}

/* 物流信息模态框样式 */
.modal-backdrop {
  position: fixed;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(4px);
}

.modal-content {
  background-color: #FFFFFF;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  max-width: 500px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid #E2E8F0;
}

.modal-header h3 {
  font-size: 1.25rem;
  font-weight: 600;
  color: #1E293B;
  margin: 0;
}

.modal-close-btn {
  background: none;
  border: none;
  font-size: 1.75rem;
  color: #64748B;
  cursor: pointer;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: all 0.2s;
}

.modal-close-btn:hover {
  background-color: #F1F5F9;
  color: #1E293B;
}

.modal-body {
  padding: 1.5rem;
}

.form-group {
  margin-bottom: 1.25rem;
}

.form-group:last-child {
  margin-bottom: 0;
}

.form-group label {
  display: block;
  font-size: 0.9rem;
  font-weight: 500;
  color: #1E293B;
  margin-bottom: 0.5rem;
}

.form-group .required {
  color: #EF4444;
  margin-left: 0.25rem;
}

.form-input {
  width: 100%;
  padding: 0.75rem 1rem;
  border: 1px solid #E2E8F0;
  border-radius: 8px;
  font-size: 0.95rem;
  color: #1E293B;
  background-color: #FFFFFF;
  transition: all 0.2s;
  box-sizing: border-box;
}

.form-input:focus {
  outline: none;
  border-color: #3B82F6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.form-input::placeholder {
  color: #94A3B8;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  padding: 1.5rem;
  border-top: 1px solid #E2E8F0;
}

.btn-secondary {
  background-color: #F1F5F9;
  color: #475569;
  border: 2px solid #E2E8F0;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  font-size: 0.95rem;
  transition: all 0.2s ease;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.btn-secondary:hover {
  background-color: #E2E8F0;
  border-color: #CBD5E1;
  color: #334155;
  transform: translateY(-1px);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none !important;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1) !important;
}

.btn:disabled:hover {
  transform: none !important;
}
</style>