<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useMotion } from '@vueuse/motion'
import { useI18n } from 'vue-i18n'
import { orderAPI } from '@/api'
import { requestRefund } from '@/api/order'
import { BASE_URL } from '@/config'

const router = useRouter()
const route = useRoute()
const { t } = useI18n()

// --- State ---
const step = ref(0)
const direction = ref(1) // 1 for forward, -1 for backward
const containerHeight = ref('auto')
const contentRef = ref(null)
const loading = ref(false)
const orderData = ref(null)

// 订单商品列表（从后端获取）
const orderItems = ref([])

const returnReason = ref('')
const refundMethod = ref('original') // 默认选中原始支付方式
// 原因键值数组
const reasonKeys = ['sizeSmall', 'sizeBig', 'quality', 'changedMind']
// 动态生成原因列表
const reasons = computed(() => reasonKeys.map(key => t(`returnRefund.reasons.${key}`)))

// --- Actions ---
const nextStep = async () => {
  if (step.value === 0 && !orderItems.value.some(i => i.selected)) return
  if (step.value === 1 && !returnReason.value) return
  
  // 第3步：提交退款申请
  if (step.value === 2) {
    await submitRefund()
    return
  }
  
  direction.value = 1
  step.value++
}

const prevStep = () => {
  direction.value = -1
  step.value--
}

const selectItem = (id) => {
  const item = orderItems.value.find(i => i.id === id)
  item.selected = !item.selected
}

const closeWizard = () => {
  router.replace('/orders')
}

const handleDone = () => {
  router.replace('/orders')
}

// 提交退款申请
const submitRefund = async () => {
  if (!orderData.value || !returnReason.value) return
  
  loading.value = true
  try {
    // 获取退款理由的翻译文本
    const reasonText = t(`returnRefund.reasons.${returnReason.value}`)
    
    // 调用后端API申请退款
    await requestRefund(orderData.value.id, reasonText)
    
    // 成功后进入下一步
    direction.value = 1
    step.value++
  } catch (error) {
    console.error('申请退款失败:', error)
    alert(error.response?.data?.message || '申请退款失败，请重试')
  } finally {
    loading.value = false
  }
}

// 获取订单数据
const fetchOrderData = async () => {
  const orderId = route.query.orderId
  if (!orderId) {
    alert('订单ID不存在')
    router.replace('/orders')
    return
  }
  
  loading.value = true
  try {
    const res = await orderAPI.getOrderById(orderId)
    orderData.value = res.data
    
    // 验证订单状态必须是已发货或已完成
    if (res.data.status !== 'SHIPPED' && res.data.status !== 'DELIVERED') {
      alert('只能对已发货或已完成的订单申请退货')
      router.replace('/orders')
      return
    }
    
    // 转换订单商品数据
    orderItems.value = (res.data.items || []).map(item => {
      // 判断图片URL是否已经是完整URL
      let imgUrl = '/assets/images/1.png' // 默认图片
      if (item.mainImageUrl) {
        if (item.mainImageUrl.startsWith('http://') || item.mainImageUrl.startsWith('https://')) {
          imgUrl = item.mainImageUrl
        } else {
          imgUrl = `${BASE_URL}${item.mainImageUrl}`
        }
      }
      
      return {
        id: item.id,
        name: item.productName,
        price: item.priceAtPurchase,
        quantity: item.quantity,
        image: imgUrl,
        selected: false
      }
    })
    
  } catch (error) {
    console.error('获取订单失败:', error)
    alert('获取订单信息失败，请重试')
    router.replace('/orders')
  } finally {
    loading.value = false
  }
}

// 组件挂载时获取订单数据
onMounted(() => {
  fetchOrderData()
})

// --- Motion Config (Apple Spring Physics) ---
const transition = {
  type: 'spring',
  stiffness: 250,
  damping: 25,
  mass: 0.5
}

// Custom Motion Variants for Steps
const variants = computed(() => ({
  initial: { 
    opacity: 0, 
    x: direction.value === 1 ? 100 : -100,
    filter: 'blur(8px)'
  },
  enter: { 
    opacity: 1, 
    x: 0,
    filter: 'blur(0px)',
    transition 
  },
  leave: { 
    opacity: 0, 
    x: direction.value === 1 ? -100 : 100,
    filter: 'blur(8px)',
    transition: { duration: 300, ease: 'easeIn' }
  }
}))

// Auto-resize logic
watch(step, async () => {
  setTimeout(() => {
    if(contentRef.value) {
      containerHeight.value = `${contentRef.value.offsetHeight}px`
    }
  }, 50)
}, { flush: 'post' })

</script>

<template>
  <div class="return-page">
    <!-- Glass Backdrop -->
    <div class="backdrop" @click="closeWizard" />

    <!-- Main Card -->
    <div 
      class="return-card"
      :style="{ height: containerHeight === 'auto' ? 'auto' : containerHeight }"
    >
      <div ref="contentRef" class="card-content">
        
        <!-- Header -->
        <header class="card-header">
          <button 
            v-if="step > 0 && step < 3" 
            @click="prevStep"
            class="btn-icon"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="15 18 9 12 15 6"></polyline>
            </svg>
          </button>
          <div v-else class="spacer"></div>

          <h2 class="header-title">
            <span v-if="step === 0">{{ $t('returnRefund.selectItems') }}</span>
            <span v-else-if="step === 1">{{ $t('returnRefund.reasonForReturn') }}</span>
            <span v-else-if="step === 2">{{ $t('returnRefund.refundMethod') }}</span>
            <span v-else>{{ $t('returnRefund.complete') }}</span>
          </h2>

          <button class="btn-icon" @click="closeWizard">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </header>

        <!-- Dynamic Content Area -->
        <div class="content-area">
          
          <!-- Loading State -->
          <div v-if="loading" class="step-content loading-step">
            <div class="loading-spinner"></div>
            <p class="loading-text">{{ $t('returnRefund.loadingOrder') || '加载订单中...' }}</p>
          </div>
          
          <!-- Step 1: Selection -->
          <div v-else-if="step === 0" v-motion="variants" class="step-content">
            <div class="items-list">
              <div 
                v-for="item in orderItems" 
                :key="item.id"
                @click="selectItem(item.id)"
                :class="['item-card', { selected: item.selected }]"
              >
                <!-- Custom Checkbox Visual -->
                <div :class="['checkbox', { checked: item.selected }]">
                  <svg v-if="item.selected" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                </div>
                
                <img :src="item.image" class="item-image" />
                
                <div class="item-info">
                  <h3>{{ item.name }}</h3>
                  <p>${{ item.price }} × {{ item.quantity }}</p>
                </div>
              </div>
            </div>
            
            <div class="step-footer">
              <button 
                class="btn-primary" 
                @click="nextStep" 
                :disabled="!orderItems.some(i => i.selected)"
              >
                {{ $t('returnRefund.buttons.continue') }}
              </button>
            </div>
          </div>

          <!-- Step 2: Reason -->
          <div v-if="step === 1" v-motion="variants" class="step-content">
            <div class="reason-grid">
              <button
                v-for="(reason, index) in reasons"
                :key="reasonKeys[index]"
                @click="returnReason = reasonKeys[index]"
                :class="['reason-card', { selected: returnReason === reasonKeys[index] }]"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="reason-icon">
                  <line x1="16.5" y1="9.4" x2="7.5" y2="4.21"></line>
                  <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                  <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
                  <line x1="12" y1="22.08" x2="12" y2="12"></line>
                </svg>
                <span>{{ reason }}</span>
              </button>
            </div>

            <div class="step-footer">
              <button 
                class="btn-primary" 
                @click="nextStep" 
                :disabled="!returnReason"
              >
                {{ $t('returnRefund.buttons.continue') }}
              </button>
            </div>
          </div>

          <!-- Step 3: Method -->
          <div v-if="step === 2" v-motion="variants" class="step-content">
            <div class="method-list">

              <!-- Original Payment Option -->
              <div 
                @click="refundMethod = 'original'"
                :class="['method-card', { selected: refundMethod === 'original' }]"
              >
                <div class="method-content">
                  <div class="method-left">
                    <div class="method-icon">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect>
                        <line x1="1" y1="10" x2="23" y2="10"></line>
                      </svg>
                    </div>
                    <div>
                      <h3>{{ $t('returnRefund.originalPayment') }}</h3>
                      <p>{{ $t('returnRefund.businessDays') }}</p>
                    </div>
                  </div>
                  <div v-if="refundMethod === 'original'" class="check-icon">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            <div class="step-footer">
              <button 
                class="btn-primary" 
                @click="nextStep" 
                :disabled="!refundMethod || loading"
              >
                {{ loading ? $t('returnRefund.submitting') || '提交中...' : $t('returnRefund.buttons.confirmReturn') }}
              </button>
            </div>
          </div>

          <!-- Step 4: Success -->
          <div v-if="step === 3" v-motion="variants" class="step-content success-step">
            <div 
              v-motion
              :initial="{ scale: 0, rotate: -45 }"
              :enter="{ scale: 1, rotate: 0, transition: { type: 'spring', stiffness: 200, damping: 15 } }"
              class="success-icon"
            >
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            </div>
            
            <h3 class="success-title">{{ $t('returnRefund.returnInitiated') }}</h3>
            <p class="success-text">
              {{ $t('returnRefund.shippingLabelSent') }}
            </p>

            <div class="step-footer">
              <button class="btn-secondary" @click="handleDone">{{ $t('returnRefund.buttons.done') }}</button>
            </div>
          </div>

        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.return-page {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  z-index: 9999;
}

.backdrop {
  position: absolute;
  inset: 0;
  background: rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(40px);
  -webkit-backdrop-filter: blur(40px);
}

.return-card {
  position: relative;
  width: 100%;
  max-width: 32rem;
  background: white;
  border-radius: 32px;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  overflow: hidden;
  transition: all 0.5s cubic-bezier(0.16, 1, 0.3, 1);
}

.card-content {
  padding: 1.5rem;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.5rem;
}

.btn-icon {
  padding: 0.5rem;
  border-radius: 50%;
  background: #f3f4f6;
  border: none;
  cursor: pointer;
  color: #1d1d1f;
  transition: background 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-icon:hover {
  background: #e5e7eb;
}

.spacer {
  width: 2.5rem;
}

.header-title {
  font-size: 1.125rem;
  font-weight: 700;
  letter-spacing: 0.01em;
  color: #000;
}

.content-area {
  position: relative;
  min-height: 300px;
}

.step-content {
  position: absolute;
  inset: 0;
  width: 100%;
  display: flex;
  flex-direction: column;
}

.success-step,
.loading-step {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #f3f3f3;
  border-top: 3px solid #1d1d1f;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.loading-text {
  margin-top: 1rem;
  color: #666;
  font-size: 0.9375rem;
}

/* Step 1: Items */
.items-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  max-height: 220px; /* 显示2个产品 + 第3个产品的一部分 */
  overflow-y: auto;
  flex-shrink: 0;
  scroll-behavior: smooth;
}

/* 隐藏滚动条但保留滚动功能 - WebKit (Chrome, Safari, Edge) */
.items-list::-webkit-scrollbar {
  display: none;
}

/* 隐藏滚动条但保留滚动功能 - Firefox */
.items-list {
  scrollbar-width: none;
}

/* 隐藏滚动条但保留滚动功能 - IE/Edge */
.items-list {
  -ms-overflow-style: none;
}

.item-card {
  display: flex;
  align-items: center;
  padding: 0.5rem 1rem;
  border-radius: 1rem;
  border: 1px solid #f5f5f7;
  cursor: pointer;
  transition: all 0.3s ease;
}

.item-card:hover {
  border-color: #e8e8ed;
  background: #fafafa;
}

.item-card.selected {
  border-color: #0071e3;
  background: rgba(0, 113, 227, 0.05);
  box-shadow: inset 0 0 0 1px rgba(0, 113, 227, 0.1);
}

.checkbox {
  width: 1.3rem;
  height: 1.3rem;
  border-radius: 9999px;
  border: 2px solid #d2d2d7;
  margin-right: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
}

.checkbox.checked {
  background: #0071e3;
  border-color: #0071e3;
  color: white;
}

.item-image {
  width: 3rem;
  height: 4rem;
  object-fit: cover;
  border-radius: 0.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  margin-right: 1rem;
}

.item-info {
  flex: 1;
}

.item-info h3 {
  font-size: 1.1rem;
  font-weight: 500;
  color: #000;
  margin-bottom: -0.75rem;
}

.item-info p {
  font-size: 0.9rem;
  font-weight: 500;
  color: #666;
}

/* Step 2: Reason */
.reason-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.75rem;
  flex-shrink: 0;
  margin-top: -1.2rem;
}

.reason-card {
  padding: 1rem;
  border-radius: 1rem;
  text-align: left;
  border: 1px solid #f5f5f7;
  background: white;
  color: #1d1d1f;
  cursor: pointer;
  transition: all 0.2s ease;
  height: 7.5rem;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.reason-card:hover {
  border-color: #d2d2d7;
  color: #1d1d1f;
}

.reason-card.selected {
  border-color: #1d1d1f;
  background: #1d1d1f;
  color: white;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  transform: scale(1.02);
}

.reason-icon {
  opacity: 0.5;
}

.reason-card span {
  font-weight: 500;
  font-size: 0.9375rem;
}

/* Step 3: Method */
.method-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  flex-shrink: 0;
}

.method-card {
  padding: 0.5rem 1.5rem;
  border-radius: 1.5rem;
  border: 2px solid #000;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
  background: white;
}

.method-card:hover {
  background: #fafafa;
}

.method-card.selected {
  border-color: #000;
  background: white;
}

.method-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.method-left {
  display: flex;
  align-items: center;
  gap: 1.2rem;
  flex: 1;
}

.method-icon {
  width: 3rem;
  height: 3rem;
  border-radius: 0.5rem;
  background: #f5f5f7;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #1d1d1f;
  flex-shrink: 0;
}

.method-card h3 {
  font-size: 1.1rem;
  font-weight: 600;
  color: #000;
  margin-bottom: -0.5rem;
}

.method-card p {
  font-size: 0.875rem;
  font-weight: 500;
  color: #666;
}

.check-icon {
  width: 1.75rem;
  height: 1.75rem;
  border-radius: 9999px;
  background: #000;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  flex-shrink: 0;
}

/* Step 4: Success */
.success-icon {
  width: 6rem;
  height: 6rem;
  border-radius: 9999px;
  background: #34c759;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: -0.5rem;
  color: white;
  box-shadow: 0 10px 30px rgba(52, 199, 89, 0.4);
}

.success-title {
  font-size: 1.5rem;
  font-weight: 500;
  color: #000;
  margin-bottom: 0.5rem;
}

.success-text {
  color: #666;
  font-size: 1rem;
  font-weight: 500;
  max-width: 250px;
  margin: 0 auto;
  line-height: 1.5;
}

/* Buttons */
.step-footer {
  margin-top: auto;
  width: 100%;
  flex-shrink: 0;
}

.btn-primary,
.btn-secondary {
  padding: 1rem 1.5rem;
  border-radius: 9999px;
  font-weight: 500;
  font-size: 15px;
  transition: all 0.3s ease;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  cursor: pointer;
}

.btn-primary {
  background: #1d1d1f;
  color: white;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

.btn-primary:hover:not(:disabled) {
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
  transform: translateY(-1px);
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-secondary {
  background: #f5f5f7;
  color: #1d1d1f;
}

.btn-secondary:hover {
  background: #e8e8ed;
}

/* 移动端适配 - 竖屏设备 */
@media (max-aspect-ratio: 1/1) {
  .reason-card {
    color: #1d1d1f !important; /* 确保移动端文字为黑色 */
    -webkit-text-fill-color: #1d1d1f; /* 针对iOS Safari */
  }
  
  .reason-card:hover {
    color: #1d1d1f !important;
  }
  
  .reason-card span {
    color: #1d1d1f !important; /* 明确设置为黑色 */
    -webkit-text-fill-color: #1d1d1f; /* 针对iOS Safari */
  }
  
  .reason-icon {
    stroke: #1d1d1f; /* SVG图标也设置为黑色 */
    color: #1d1d1f;
  }
  
  .reason-card.selected {
    color: white !important; /* 选中状态整体白色 */
  }
  
  .reason-card.selected span {
    color: white !important; /* 选中状态保持白色 */
    -webkit-text-fill-color: white;
  }
  
  .reason-card.selected .reason-icon {
    stroke: white; /* 选中状态图标白色 */
    color: white;
  }
}
</style>
