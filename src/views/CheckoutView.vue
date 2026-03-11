<template>
  <div class="checkout-page">
    <div class="checkout-container">
      
      <!-- STEP 1: ORDER CREATION -->
      <div v-if="currentStep === 'order'" class="view-section active">
        <h1>{{ $t('checkout.title') }}</h1>
        
        <div class="product-summary">
          <div class="product-thumb" :style="{ backgroundImage: `url(${productData.image})` }"></div>
          <div class="product-details">
            <h3>{{ productData.name }}</h3>
            <div class="product-meta">
              <span>{{ $t('checkout.size') }}: {{ productData.size || 'M' }}</span>
              <span style="margin: 0 12px; color: #D2D2D7;">|</span>
              <span>{{ $t('checkout.qty') }}: {{ productData.quantity || 1 }}</span>
            </div>
            <div class="price-tag">{{ formatPrice(productData.price) }}</div>
          </div>
        </div>

        <div class="shipping-section">
          <h2>{{ $t('checkout.shippingAddress') }}</h2>
          <div v-if="loadingAddresses" class="loading-msg">
            {{ $t('checkout.loadingAddresses') }}
          </div>
          <div v-else-if="userAddresses.length === 0" class="no-address-msg">
            <p>{{ $t('checkout.noAddressMessage') }}</p>
            <button class="btn btn-secondary" @click="goToSettings">
              {{ $t('checkout.goToSettings') }}
            </button>
          </div>
          <div v-else class="form-group">
            <AppleSelect 
              v-model="selectedAddress"
              :options="addressOptions"
            />
          </div>
        </div>

        <div class="payment-section">
          <h2>{{ $t('checkout.paymentMethod') }}</h2>
          <div class="payment-grid">
            <div 
              v-for="method in paymentMethods" 
              :key="method.id"
              :class="['payment-option', { selected: selectedPayment === method.id }]"
              @click="selectedPayment = method.id"
            >
              <div class="radio-circle"></div>
              <span>{{ $t(`checkout.${method.label}`) }}</span>
            </div>
          </div>
        </div>

        <div class="divider"></div>

        <div class="summary-totals">
          <div class="row-spread">
            <span class="text-sub">{{ $t('checkout.subtotal') }}</span>
            <span class="text-bold">{{ formatPrice(totalPrice) }}</span>
          </div>
          <div class="row-spread">
            <span class="text-sub">{{ $t('checkout.shipping') }}</span>
            <span class="text-bold">{{ $t('checkout.free') }}</span>
          </div>
          <div class="row-spread total-row">
            <span>{{ $t('checkout.total') }}</span>
            <span>{{ formatPrice(totalPrice) }}</span>
          </div>
        </div>

        <button class="btn btn-primary" @click="goToPayment" :disabled="isProcessing">
          {{ isProcessing ? $t('checkout.processing') : $t('checkout.placeOrder') }}
        </button>
        <button class="btn btn-secondary" @click="goBack">{{ $t('checkout.cancel') }}</button>
      </div>

      <!-- STEP 2: PAYMENT QR -->
      <div v-if="currentStep === 'payment'" class="view-section active">
        <h1>{{ $t('checkout.scanToPay') }}</h1>
        <p class="page-description">
          {{ $t('checkout.scanDescription') }}
        </p>

        <div class="qr-container">
          <div class="qr-frame">
            <div class="qr-image">
              <img src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=https://example.com/payment/demo" alt="Payment QR Code" style="width: 100%; height: 100%; object-fit: contain;">
            </div>
            <div class="scan-line"></div>
          </div>
        </div>

        <div class="summary-totals">
          <div class="row-spread total-row payment-total">
            <span>{{ $t('checkout.totalDue') }}:</span>
            <span class="total-amount">{{ formatPrice(totalPrice) }}</span>
          </div>
        </div>

        <!-- Simulation Button - 仅管理员可见 -->
        <button v-if="isAdmin" class="btn btn-primary simulate-btn" @click="goToSuccess">
          {{ $t('checkout.simulatePayment') }}
        </button>
        <button class="btn btn-secondary" @click="handleCancelOrder">
          {{ $t('checkout.cancelOrder') }}
        </button>
      </div>

      <!-- STEP 3: SUCCESS -->
      <div v-if="currentStep === 'success'" class="view-section active">
        <div class="success-content">
          <div class="success-icon-wrapper">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
          </div>
          
          <h1>{{ $t('checkout.paymentSuccessful') }}</h1>
          <p class="success-message">
            {{ $t('checkout.thankYouMessage', { orderNumber: orderNumber }) }}
          </p>

          <div class="divider"></div>

          <div class="row-spread">
            <span class="text-sub">{{ $t('checkout.paymentMethodLabel') }}</span>
            <span class="text-bold">{{ $t(`checkout.${paymentMethodLabel}`) }}</span>
          </div>
          <div class="row-spread">
            <span class="text-sub">{{ $t('checkout.amountPaid') }}</span>
            <span class="text-bold">{{ formatPrice(totalPrice) }}</span>
          </div>
          
          <button class="btn btn-primary" @click="continueShopping">
            {{ $t('checkout.continueShopping') }}
          </button>
        </div>
      </div>

    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import AppleSelect from '@/components/AppleSelect.vue'
import { getUserAddresses } from '@/api/address'
import { createOrder, cancelOrder, paymentSuccess } from '@/api/order'

export default {
  name: 'CheckoutView',
  components: {
    AppleSelect
  },
  setup() {
    const router = useRouter()
    const route = useRoute()
    const { t } = useI18n()
    // 检查是否为管理员
    const isAdmin = computed(() => {
      const user = JSON.parse(localStorage.getItem('user') || '{}')
      return user.roleId === 2
    })

    // Steps
    const currentStep = ref('order')
    const isProcessing = ref(false)

    // Product Data (from route params or props)
    const productData = ref({
      id: '',
      name: 'Ackoray Pro Air',
      specs: 'Midnight Black · 512GB · Ultra-Wide',
      price: 1299.00,
      image: 'https://store.storeimages.cdn-apple.com/8756/as-images.apple.com/is/iphone-15-pro-finish-select-202309-6-7inch-naturaltitanium?wid=5120&hei=2880&fmt=p-jpg&qlt=80&.v=1692845702708'
    })

    // Address Management
    const userAddresses = ref([])
    const selectedAddress = ref(null)
    const loadingAddresses = ref(false)
    
    // Format addresses for AppleSelect component
    const addressOptions = computed(() => {
      return userAddresses.value.map(addr => ({
        id: addr.id,
        label: `${addr.recipientName} - ${addr.phoneNumber} - ${addr.detailedAddress}`
      }))
    })
    
    // 计算总价（单价 * 数量）
    const totalPrice = computed(() => {
      const price = productData.value.price || 0
      const quantity = productData.value.quantity || 1
      return price * quantity
    })
    
    // 获取地址列表
    const fetchAddresses = async () => {
      try {
        loadingAddresses.value = true
        const response = await getUserAddresses()
        const addresses = response.data || response
        userAddresses.value = Array.isArray(addresses) ? addresses : []
        
        // 自动选择默认地址
        const defaultAddr = userAddresses.value.find(addr => addr.isDefault)
        if (defaultAddr) {
          selectedAddress.value = defaultAddr.id
        } else if (userAddresses.value.length > 0) {
          selectedAddress.value = userAddresses.value[0].id
        }
      } catch (error) {
        console.error('获取地址列表失败:', error)
        alert('获取地址列表失败，请重试')
      } finally {
        loadingAddresses.value = false
      }
    }

    // Payment Methods
    const paymentMethods = ref([
      { id: 'wechatPay', label: 'wechatPay' },
      { id: 'alipay', label: 'alipay' }
    ])
    const selectedPayment = ref('wechatPay')

    // Payment Method Label for success page
    const paymentMethodLabel = computed(() => selectedPayment.value)

    // Order Number and ID
    const orderNumber = ref('')
    const createdOrderId = ref(null)  // 保存创建的订单ID

    // Countdown Timer
    const countdown = ref('14:59')
    let countdownInterval = null

    // Methods
    const formatPrice = (price) => {
      if (typeof price !== 'number') {
        price = parseFloat(price) || 0
      }
      return `${price.toFixed(2)} RMB`
    }

    const goToPayment = async () => {
      if (userAddresses.value.length === 0) {
        alert('请先添加收货地址')
        router.push('/settings')
        return
      }
      
      if (!selectedAddress.value) {
        alert('请选择收货地址')
        return
      }
      
      if (!selectedPayment.value) {
        alert('请选择支付方式')
        return
      }
      
      isProcessing.value = true
      
      try {
        // 获取选中的地址
        const address = userAddresses.value.find(addr => addr.id === selectedAddress.value)
        if (!address) {
          throw new Error('地址不存在')
        }
        
        // 准备订单数据
        const orderData = {
          items: [
            {
              productId: productData.value.id,
              variantId: productData.value.variantId, // 传递变体ID
              color: null,
              size: productData.value.size,
              quantity: productData.value.quantity
            }
          ],
          shippingRecipientName: address.recipientName,
          shippingPhoneNumber: address.phoneNumber,
          shippingDetailedAddress: address.detailedAddress,
          paymentMethod: selectedPayment.value === 'wechatPay' ? 'WECHAT_PAY' : 'ALIPAY'
        }
        
        
        // 调用创建订单API
        const response = await createOrder(orderData)
        const order = response.data || response
        
        // 保存订单号和订单ID
        orderNumber.value = order.orderNumber || `AK-${order.id}`
        createdOrderId.value = order.id  // 保存订单ID，用于取消订单
        
        console.log('订单创建成功:', order)
        console.log('订单ID:', createdOrderId.value)
        
        // 进入支付页面
        currentStep.value = 'payment'
        startCountdown()
      } catch (error) {
        console.error('创建订单失败:', error)
        alert(error.response?.data?.message || '创建订单失败，请重试')
      } finally {
        isProcessing.value = false
      }
    }

    const goToSuccess = async () => {
      try {
        if (!createdOrderId.value) {
          alert('订单ID不存在，无法支付')
          return
        }
        
        // 调用支付成功API，将订单状态从待付款改为待发货
        await paymentSuccess(createdOrderId.value)
        console.log('支付成功，订单ID:', createdOrderId.value)
        
        stopCountdown()
        currentStep.value = 'success'
      } catch (error) {
        console.error('支付失败:', error)
        alert(error.response?.data?.message || '支付失败，请重试')
      }
    }
    
    // 取消订单
    const handleCancelOrder = async () => {
      // 显示浏览器默认确认框
      const confirmed = confirm(t('checkout.cancelOrderConfirm'))
      
      if (!confirmed) {
        return  // 用户点击了取消
      }
      
      if (!createdOrderId.value) {
        alert(t('checkout.orderIdNotFound'))
        return
      }
      
      try {
        console.log('开始取消订单，订单ID:', createdOrderId.value)
        
        // 调用后端取消订单API
        await cancelOrder(createdOrderId.value)
        
        console.log('订单取消成功')
        
        // 停止倒计时
        stopCountdown()
        
        // 显示成功消息
        alert(t('checkout.cancelOrderSuccess'))
        
        // 返回首页
        router.push('/')
        
      } catch (error) {
        console.error('取消订单失败:', error)
        alert(error.response?.data?.message || t('checkout.cancelOrderError'))
      }
    }

    const goBack = () => {
      // 返回首页（产品列表页面）
      router.push('/')
    }
    
    const goToSettings = () => {
      // 跳转到设置页面
      router.push('/settings')
    }

    const continueShopping = () => {
      router.push('/')
    }

    const startCountdown = () => {
      let seconds = 14 * 60 + 59
      countdownInterval = setInterval(() => {
        const minutes = Math.floor(seconds / 60)
        const secs = seconds % 60
        countdown.value = `${minutes}:${secs.toString().padStart(2, '0')}`
        seconds--
        if (seconds < 0) {
          stopCountdown()
        }
      }, 1000)
    }

    const stopCountdown = () => {
      if (countdownInterval) {
        clearInterval(countdownInterval)
        countdownInterval = null
      }
    }

    onMounted(() => {
      // Get product data from route query or state
      if (route.query.product) {
        try {
          const product = JSON.parse(decodeURIComponent(route.query.product))
          productData.value = { ...productData.value, ...product }
          console.log('产品数据:', productData.value)
        } catch (e) {
          console.error('Failed to parse product data:', e)
        }
      }
      
      // 获取地址列表
      fetchAddresses()
    })

    onUnmounted(() => {
      stopCountdown()
    })

    return {
      currentStep,
      isProcessing,
      productData,
      userAddresses,
      selectedAddress,
      addressOptions,
      paymentMethods,
      selectedPayment,
      paymentMethodLabel,
      orderNumber,
      createdOrderId,
      countdown,
      loadingAddresses,
      isAdmin,
      totalPrice,
      formatPrice,
      goToPayment,
      goToSuccess,
      handleCancelOrder,
      goBack,
      goToSettings,
      continueShopping
    }
  }
}
</script>

<style scoped>
/* 
 * APPLE DESIGN SYSTEM - CORE VARIABLES 
 */
:root {
  --bg-color: #F5F5F7;
  --card-bg: #FFFFFF;
  --text-primary: #1D1D1F;
  --text-secondary: #86868B;
  --accent-blue: #0071E3;
  --accent-blue-hover: #0077ED;
  --border-color: #D2D2D7;
  --input-bg: #FAFAFA;
  --error-red: #FF3B30;
  --success-green: #34C759;
  --radius-card: 24px;
  --radius-input: 12px;
  --shadow-card: 0 12px 32px rgba(0, 0, 0, 0.04);
  --shadow-float: 0 24px 48px rgba(0, 0, 0, 0.08);
  
  /* Apple Spring Physics Easing */
  --ease-apple: cubic-bezier(0.19, 1, 0.22, 1);
}

.checkout-page {
  background-color: var(--bg-color);
  color: var(--text-primary);
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 30px 20px 30px 20px;
  width: 100%;
  box-sizing: border-box;
}

/* 
 * LAYOUT & CONTAINERS 
 */
.checkout-container {
  width: 100%;
  max-width: 650px;
  position: relative;
  perspective: 1000px;
  margin: 0 auto;
}

/* 
 * VIEW MANAGEMENT (SPA LOGIC)
 */
.view-section {
  background: #f5f5f7;
  border-radius: 16px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
  padding: 10px 40px 36px 40px;
  width: 100%;
  opacity: 0;
  transform: scale(0.98) translateY(20px);
  transition: 
    opacity 0.5s ease, 
    transform 0.6s var(--ease-apple), 
    filter 0.5s ease;
  animation: viewEnter 0.6s var(--ease-apple) forwards;
  border: 1px solid rgba(0, 0, 0, 0.06);
}

.view-section.active {
  opacity: 1;
  transform: scale(1) translateY(0);
  position: relative;
  visibility: visible;
  z-index: 10;
}

h1 {
  font-size: 32px;
  font-weight: 600;
  letter-spacing: -0.02em;
  margin-bottom: 24px;
  color: #000;
  text-align: center;
}

h2 {
  font-size: 20px;
  font-weight: 600;
  margin-bottom: 16px;
  margin-top: 32px;
  color: #000;
}

/* 
 * COMPONENTS: PRODUCT SUMMARY
 */
.product-summary {
  display: flex;
  gap: 16px;
  padding-bottom: 24px;
  border-bottom: 1px solid #E5E5E5;
  margin-bottom: 24px;
}

.product-thumb {
  width: 100px;
  height: 100px;
  background: #f0f0f0;
  border-radius: 16px;
  background-size: cover;
  background-position: center;
  flex-shrink: 0;
  border: 1px solid #E5E5E5;
}

.product-details h3 {
  font-size: 20px;
  font-weight: 600;
  margin-bottom: 6px;
  color: #000;
  margin-top: 10px;
}

.product-details p {
  color: #666;
  font-size: 14px;
  margin-bottom: 6px;
  line-height: 1.5;
}

.product-meta {
  color: #666;
  font-size: 14px;
  font-weight: 400;
  margin-bottom: 6px;
  display: flex;
  align-items: center;
}

.product-meta span {
  font-weight: 500;
}

.price-tag {
  font-size: 17px;
  font-weight: 600;
  color: #000;
}

.loading-msg,
.no-address-msg {
  text-align: center;
  color: #666;
  font-size: 14px;
  font-weight: 500;
}

.no-address-msg p {
  margin-bottom: 16px;
  line-height: 1.6;
}

.no-address-msg .btn {
  margin: 0 auto;
}

/* 
 * COMPONENTS: FORMS & INPUTS 
 */
.form-group {
  margin-bottom: 16px;
}

.input-row {
  display: flex;
  gap: 16px;
}

label {
  display: block;
  font-size: 14px;
  color: #666;
  margin-bottom: 8px;
  font-weight: 500;
}

.select-wrapper {
  position: relative;
}

input {
  width: 100%;
  height: 55px;
  padding: 0 16px;
  border: 1px solid #E5E5E5;
  border-radius: 16px;
  font-size: 16px;
  font-weight: 500;
  background: #FAFAFA;
  transition: all 0.2s ease;
  outline: none;
  appearance: none;
}

input:focus {
  border-color: #0071E3;
  box-shadow: 0 0 0 3px rgba(0, 113, 227, 0.1);
  background: #fff;
}

.new-address-form {
  animation: fadeInUp 0.5s ease;
}

/* 
 * COMPONENTS: PAYMENT METHODS 
 */
.payment-grid {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.payment-option {
  border: 1px solid #E5E5E5;
  border-radius: 16px;
  padding: 0 20px;
  height: 55px;
  display: flex;
  align-items: center;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
  background: #FAFAFA;
  font-size: 16px;
  font-weight: 500;
  color: #000;
}

.payment-option:hover:not(.selected) {
  border-color: #D2D2D7;
  background: #fff;
}

.payment-option.selected {
  border-color: #0071E3;
  border-width: 1px;
  background: rgba(0, 113, 227, 0.05);
  box-shadow: 0 0 0 0px var(--accent-blue);
}

.radio-circle {
  width: 20px;
  height: 20px;
  border: 2px solid #D2D2D7;
  border-radius: 50%;
  margin-right: 12px;
  position: relative;
  flex-shrink: 0;
  transition: all 0.2s ease;
}

.payment-option.selected .radio-circle {
  border-color: #0071E3;
  background: #0071E3;
}

.payment-option.selected .radio-circle::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 8px;
  height: 8px;
  background: white;
  border-radius: 50%;
}

/* 
 * BUTTONS 
 */
.btn {
  width: 100%;
  height: 55px;
  border-radius: 16px;
  border: none;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: transform 0.1s ease, background 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  letter-spacing: -0.01em;
}

.btn:active {
  transform: scale(0.98);
}

.btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.btn-primary {
  background: #0071E3;
  color: white;
  margin-top: 24px;
  font-weight: 500;
  font-size: 16px;
  border: none;
}

.btn-primary:hover:not(:disabled) {
  background: #0077ED;
}

.btn-secondary {
  background: transparent;
  color: #0071E3;
  margin-top: 12px;
  font-weight: 500;
  font-size: 16px;
  border: 1px solid #E5E5E5;
}

.btn-secondary:hover {
  border-color: #D2D2D7;
  background: #FAFAFA;
}

.btn-cancel {
  color: #000 !important;
  border-color: #E5E5E5 !important;
}

.btn-cancel:hover {
  border-color: #D2D2D7;
  background: #FAFAFA;
}

/* 
 * PAGE 2: QR CODE 
 */
.page-description {
  text-align: center;
  color: #666;
  font-size: 15px;
  font-weight: 500;
  line-height: 1.5;
  margin-bottom: 16px;
}

.qr-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 20px 0;
}

.qr-frame {
  width: 240px;
  height: 240px;
  border: 1px solid var(--border-color);
  border-radius: 16px;
  padding: 20px;
  background: white;
  box-shadow: var(--shadow-card);
  position: relative;
  overflow: hidden;
}

.qr-image {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.scan-line {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 4px;
  background: var(--accent-blue);
  box-shadow: 0 0 15px var(--accent-blue);
  animation: scan 2s infinite linear;
}

.timer {
  font-variant-numeric: tabular-nums;
  color: #666;
  font-size: 15px;
  font-weight: 500;
  margin-top: 10px;
}

/* 
 * PAGE 3: SUCCESS 
 */
.success-content {
  text-align: center;
  padding: 60px 0;
}

.success-message {
  color: #666;
  font-size: 16px;
  font-weight: 500;
  line-height: 1.6;
  max-width: 420px;
  margin: 0 auto 32px auto;
}

.success-icon-wrapper {
  width: 80px;
  height: 80px;
  background: #34c759;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 30px auto;
  animation: successIconPop 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
  transform: scale(0);
  box-shadow: 0 10px 30px rgba(52, 199, 89, 0.4);
}

.success-icon-wrapper svg {
  width: 36px;
  height: 36px;
  stroke-width: 3;
  color: white;
  stroke-dasharray: 50;
  stroke-dashoffset: 50;
  animation: checkDraw 0.4s cubic-bezier(0.65, 0, 0.45, 1) 0.3s forwards;
}

@keyframes successIconPop {
  0% {
    transform: scale(0);
    opacity: 0;
  }
  50% {
    transform: scale(1.1);
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

@keyframes checkDraw {
  to {
    stroke-dashoffset: 0;
  }
}

@keyframes scan {
  0% { top: 0; opacity: 0; }
  10% { opacity: 1; }
  90% { opacity: 1; }
  100% { top: 100%; opacity: 0; }
}

@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes viewEnter {
  from { opacity: 0; transform: scale(0.98) translateY(20px); }
  to { opacity: 1; transform: scale(1) translateY(0); }
}

/* Utilities */
.divider { 
  height: 1px; 
  background: #E5E5E5; 
  width: 100%; 
  margin: 24px 0; 
}

.row-spread { 
  display: flex; 
  justify-content: space-between; 
  align-items: center; 
  margin-bottom: 35px; 
}

.text-sub { 
  color: #666; 
  font-size: 16px; 
  font-weight: 500;
}

.text-bold { 
  font-weight: 600; 
  font-size: 16px; 
  color: #000;
}

.total-row { 
  font-size: 20px; 
  font-weight: 500; 
  margin-top: 16px; 
  color: #000;
  padding-top: 12px;
  border-top: 1px solid #E5E5E5;
}

.payment-total {
  justify-content: center;
  gap: 12px;
  border-top: none;
  padding-top: 0;
}

.total-amount {
  color: #0071E3;
  font-weight: 600;
}

.simulate-btn {
  margin-top: 40px;
}

/* 移动端适配 - 竖屏设备 */
@media (max-aspect-ratio: 1/1) {
  .checkout-page {
    padding: 0;
  }
  
  .checkout-container {
    max-width: 100%;
  }
  
  /* 移除圆角边框 */
  .view-section {
    border-radius: 0 !important;
    padding: 1.5rem 1.5rem 2rem;
    box-shadow: none;
    border: none;
    min-height: 100vh;
  }
  
  /* 缩小标题 */
  h1 {
    font-size: 1.6rem;
    margin-bottom: 1.2rem;
    margin-top: 0.1rem;
  }
  
  h2 {
    font-size: 1rem;
    margin-bottom: 0.8rem;
    margin-top: 1.5rem;
  }
  
  /* 产品摘要 */
  .product-summary {
    gap: 0.8rem;
    padding-bottom: 1.2rem;
    margin-bottom: 1.2rem;
  }
  
  .product-thumb {
    width: 70px;
    height: 70px;
    border-radius: 12px;
  }
  
  .product-details h3 {
    font-size: 1rem;
    margin-bottom: 0.3rem;
    margin-top: 0.5rem;
  }
  
  .product-details p {
    font-size: 0.75rem;
    margin-bottom: 0.3rem;
  }
  
  .product-meta {
    font-size: 0.75rem;
    margin-bottom: 0.3rem;
  }
  
  .price-tag {
    font-size: 0.9rem;
  }
  
  /* 表单元素 */
  .form-group {
    margin-bottom: 0.8rem;
  }
  
  input {
    height: 45px;
    padding: 0 0.8rem;
    border-radius: 12px;
    font-size: 0.85rem;
  }
  
  /* 支付方式 */
  .payment-grid {
    gap: 0.6rem;
  }
  
  .payment-option {
    border-radius: 12px;
    padding: 0 1rem;
    height: 45px;
    font-size: 0.85rem;
  }
  
  .radio-circle {
    width: 16px;
    height: 16px;
    margin-right: 0.6rem;
  }
  
  .payment-option.selected .radio-circle::after {
    width: 6px;
    height: 6px;
  }
  
  /* 按钮 */
  .btn {
    height: 48px;
    border-radius: 12px;
    font-size: 0.9rem;
  }
  
  .btn-primary {
    margin-top: 1.2rem;
  }
  
  .btn-secondary {
    margin-top: 0.6rem;
  }
  
  /* 二维码页面 - 垂直居中 */
  .view-section:has(.qr-container) {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    padding: 0 1.5rem;
  }
  
  .view-section:has(.qr-container) h1 {
    margin-top: 0;
    margin-bottom: 0.8rem;
  }
  
  .view-section:has(.qr-container) .summary-totals {
    width: 100%;
    max-width: 320px;
  }
  
  .page-description {
    font-size: 0.8rem;
    margin-bottom: 0.8rem;
  }
  
  .qr-container {
    padding: 1rem 0;
  }
  
  .qr-frame {
    width: 180px;
    height: 180px;
    border-radius: 12px;
    padding: 1rem;
    margin-bottom: 0.8rem;
  }
  
  .scan-line {
    height: 3px;
  }
  
  .timer {
    font-size: 0.8rem;
    margin-top: 0.5rem;
  }
  
  .simulate-btn {
    margin-top: 1.5rem;
  }
  
  .view-section:has(.qr-container) .btn {
    max-width: 320px;
  }
  
  /* 成功页面 - 垂直居中 */
  .view-section:has(.success-content) {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    padding: 0 1.5rem;
  }
  
  .view-section:has(.success-content) h1 {
    margin-top: 0;
    margin-bottom: 0.8rem;
    padding: 0;
    width: 100%;
  }
  
  .success-content {
    padding: 0;
    width: 100%;
    box-sizing: border-box;
  }
  
  .view-section:has(.success-content) * {
    box-sizing: border-box;
  }
  
  .success-message {
    font-size: 0.85rem;
    margin: 0 auto 1.5rem auto;
    padding: 0;
    max-width: 330px;
  }
  
  .success-icon-wrapper {
    width: 60px;
    height: 60px;
    margin: 0 auto 1.5rem auto;
  }
  
  .success-icon-wrapper svg {
    width: 28px;
    height: 28px;
  }
  
  .view-section:has(.success-content) .btn {
    max-width: 320px;
    width: 100%;
    margin-left: auto;
    margin-right: auto;
  }
  
  .view-section:has(.success-content) .divider {
    width: 100%;
    max-width: 320px;
    margin: 1.2rem auto;
  }
  
  .view-section:has(.success-content) .row-spread {
    width: 100%;
    max-width: 320px;
    margin-bottom: 0.6rem;
    margin-left: auto;
    margin-right: auto;
    padding: 0;
  }
  
  .view-section:has(.success-content) .text-sub,
  .view-section:has(.success-content) .text-bold {
    padding: 0;
    margin: 0;
  }
  
  /* 工具类 */
  .divider {
    margin: 1.2rem 0;
  }
  
  .row-spread {
    margin-bottom: 0.6rem;
  }
  
  .text-sub {
    font-size: 0.85rem;
  }
  
  .text-bold {
    font-size: 0.85rem;
  }
  
  .total-row {
    font-size: 1rem;
    margin-top: 0.8rem;
    padding-top: 0.6rem;
  }
  
  .payment-total {
    gap: 0.6rem;
  }
  
  .total-amount {
    font-size: 1rem;
  }
}
</style>
