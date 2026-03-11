<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import SizeInfoModal from './SizeInfoModal.vue'
import FabricInfoModal from './FabricInfoModal.vue'
import ProductInfoModal from './ProductInfoModal.vue'

const props = defineProps({
  product: Object
})

const emit = defineEmits(['close'])
const router = useRouter()
const { t } = useI18n()

// 从产品variants中提取可用尺码
const availableSizes = computed(() => {
  if (!props.product?.originalData?.variants || props.product.originalData.variants.length === 0) {
    return []
  }
  
  // 提取所有活跃变体的尺码
  const sizeSet = new Set()
  props.product.originalData.variants.forEach(variant => {
    if (variant.isActive && variant.size?.name) {
      sizeSet.add(variant.size.name)
    }
  })
  
  return Array.from(sizeSet).sort()
})

// 选中的尺码
const selectedSize = ref(null)

// 当可用尺码列表变化时，自动选择第一个尺码
watch(availableSizes, (newSizes) => {
  if (newSizes.length > 0 && !selectedSize.value) {
    selectedSize.value = newSizes[0]
  }
}, { immediate: true })

// 获取当前选中尺码的变体（用于获取库存）
const selectedVariant = computed(() => {
  if (!selectedSize.value || !props.product?.originalData?.variants) {
    return null
  }
  
  return props.product.originalData.variants.find(v => 
    v.size?.name === selectedSize.value && v.isActive
  )
})

// 当前选中尺码的最大库存
const maxStock = computed(() => {
  return selectedVariant.value?.stockQuantity || 0
})

// 计算总价（单价 * 数量）
const totalPrice = computed(() => {
  const price = props.product.originalData?.priceR || 0
  return price * quantity.value
})

const showSizeGuide = ref(false)
const showFabricInfo = ref(false)
const showProductInfo = ref(false)

// 数量逻辑
const quantity = ref(1)

// 当选中尺码变化时，重置数量
watch(selectedSize, () => {
  quantity.value = 1
})

const increment = () => { 
  if(quantity.value < maxStock.value) {
    quantity.value++
  }
}

const decrement = () => { 
  if(quantity.value > 1) {
    quantity.value--
  }
}

// 购买处理
const handleBuyNow = () => {
  if (!selectedSize.value) {
    alert('请选择尺码')
    return
  }
  
  if (maxStock.value === 0) {
    alert('该尺码暂无库存')
    return
  }
  
  // 准备产品数据
  const productData = {
    id: props.product.id,
    name: props.product.originalData?.name || props.product.name,
    specs: `${selectedSize.value} · ${t('product.description')}`,
    price: props.product.originalData?.priceR || 0,
    image: props.product.img,
    size: selectedSize.value,
    quantity: quantity.value,
    variantId: selectedVariant.value?.id
  }
  
  console.log('购买产品数据:', productData)
  
  // 关闭当前模态框
  emit('close')
  
  // 跳转到checkout页面，传递产品数据
  router.push({
    name: 'checkout',
    query: {
      product: encodeURIComponent(JSON.stringify(productData))
    }
  })
}

// 按 ESC 键关闭
const handleKeydown = (e) => {
  if (e.key === 'Escape') {
    if (showSizeGuide.value) {
      showSizeGuide.value = false
    } else if (showFabricInfo.value) {
      showFabricInfo.value = false
    } else if (showProductInfo.value) {
      showProductInfo.value = false
    } else {
      emit('close')
    }
  }
}

onMounted(() => {
  document.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
})
</script>

<template>
  <div class="modal-overlay">
    <!-- Backdrop Blur -->
    <div 
      class="backdrop"
      @click="$emit('close')"
    ></div>

    <!-- Main Card Content -->
    <div class="modal-content">
      
      <!-- Close Button -->
      <button 
        @click="$emit('close')" 
        class="close-btn"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M18 6 6 18"/>
          <path d="m6 6 12 12"/>
        </svg>
      </button>

      <!-- Left: Visuals -->
      <div class="modal-left">
        <!-- Background Marquee (X-RAY) -->
        <div class="bg-marquee">
          <div class="marquee-track">
            <span class="marquee-text">ACKORAY</span>
            <span class="marquee-text">ACKORAY</span>
          </div>
        </div>

        <!-- Product Image -->
        <img 
          :src="product.img" 
          class="product-image"
          :alt="product.name"
        />
      </div>

      <!-- Right: Info & Purchase -->
      <div class="modal-right">
        <div>
          <span class="badge">ALL SEASON // TECH</span>
          <h2 class="product-title">{{ product.originalData?.name || product.name }}</h2>
          <p class="product-desc">{{ $t('product.description') }}</p>
          
          <!-- Sliding Pill Size Selector -->
          <div class="size-selector">
            <label class="size-label">{{ $t('product.selectSize')}}</label>
            <div v-if="availableSizes.length > 0" class="size-buttons">
              <button 
                v-for="size in availableSizes" 
                :key="size"
                @click="selectedSize = size"
                class="size-btn"
                :class="{ active: selectedSize === size }"
              >
                {{ size }}
              </button>
            </div>
            <p v-else class="no-sizes-msg">暂无可用尺码</p>
          </div>

          <!-- Quantity Selector -->
          <div class="quantity-selector">
            <label class="size-label">
              {{ $t('product.quantity')}}
            </label>
            <div class="quantity-control">
              <button @click="decrement" :disabled="quantity === 1" class="qty-btn">−</button>
              <span class="qty-val">{{ quantity }}</span>
              <button @click="increment" :disabled="quantity >= maxStock" class="qty-btn">+</button>
            </div>
          </div>

          <!-- Product Details Accordion -->
          <div class="accordion-group">
            <div class="accordion-item" @click="showSizeGuide = true">
              <div class="accordion-header">
                <span>{{ $t('product.sizeGuide') }}</span>
                <span class="accordion-icon">+</span>
              </div>
            </div>
            
            <div class="accordion-item" @click="showProductInfo = true">
              <div class="accordion-header">
                <span>{{ $t('product.productFeatures') }}</span>
                <span class="accordion-icon">+</span>
              </div>
            </div>
            
            <div class="accordion-item" @click="showFabricInfo = true">
              <div class="accordion-header">
                <span>{{ $t('product.fabricInfo') }}</span>
                <span class="accordion-icon">+</span>
              </div>
            </div>
          </div>
        </div>

        <div class="cart-section">
          <div class="filter-url-goo">
            <button 
              class="add-to-cart-btn" 
              @click="handleBuyNow"
              :disabled="maxStock === 0 || !selectedSize"
            >
              <span>{{ maxStock === 0 ? '已售罄' : $t('product.buyNow').toUpperCase() }}</span>
              <span class="price" v-if="maxStock > 0">{{ totalPrice }} RMB</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Size Guide Modal -->
      <SizeInfoModal 
        :show="showSizeGuide"
        :gender="product.originalData?.gender || 'MALE'"
        @close="showSizeGuide = false"
      />

      <!-- Fabric Info Modal -->
      <FabricInfoModal 
        :show="showFabricInfo" 
        @close="showFabricInfo = false"
      />

      <!-- Product Info Modal -->
      <ProductInfoModal 
        :show="showProductInfo" 
        :product-id="product.id"
        @close="showProductInfo = false"
      />

    </div>
  </div>
</template>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
}

.backdrop {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  width: 100%;
  height: 100%;
  background: rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(40px);
  transition: opacity 0.5s;
}

.modal-content {
  position: relative;
  width: 100%;
  max-width: 1150px;
  height: 85vh;
  background: white;
  border-radius: 20px;
  box-shadow: 0 40px 80px rgba(0, 0, 0, 0.15);
  overflow: hidden;
  display: flex;
  flex-direction: row;
}

.close-btn {
  position: absolute;
  top: 1.3rem;
  right: 1.5rem;
  z-index: 20;
  width: 40px;
  height: 40px;
  padding: 0;
  background: #f3f4f6;
  border: none;
  border-radius: 50%;
  cursor: pointer;
  font-size: 24px;
  line-height: 1;
  color: #1d1d1f;
  font-weight: 500;
  transition: background 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.close-btn:hover {
  background: #e5e7eb;
}

/* Left Panel */
.modal-left {
  position: relative;
  width: 60%;
  height: 100%;
  background: #fafafa;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}

.bg-marquee {
  position: absolute;
  top: 50%;
  left: 0;
  transform: translateY(-50%);
  width: 100%;
  opacity: 0.05;
  pointer-events: none;
  user-select: none;
  overflow: hidden;
  display: flex;
  align-items: center;
}

.marquee-track {
  display: flex;
  gap: 8rem;
  animation: marquee 20s linear infinite;
}

.marquee-text {
  white-space: nowrap;
  font-size: 20vw;
  font-weight: 800;
  line-height: 1;
  color: black;
  flex-shrink: 0;
}

@keyframes marquee {
  from {
    transform: translateX(0%);
  }
  to {
    transform: translateX(-50%); /* 两个文字循环 */
  }
}

.product-image {
  position: relative;
  z-index: 10;
  width: 90%;
  height: auto;
  object-fit: contain;
  transition: transform 0.7s;
  margin-top: 12%;  /* 向下移动图片 */
}

.modal-left:hover .product-image {
  transform: scale(1.05);
}

/* Right Panel */
.modal-right {
  width: 40%;
  padding: 2.5rem 3rem 3rem 3rem;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.7rem 0.7rem;
  background: black;
  color: white;
  font-size: 0.73rem;
  border-radius: 100px;
  font-weight: 500;
  letter-spacing: 0.2px;
  line-height: 1;
  height: 12px;
}

.product-title {
  font-size: 2.3rem;
  font-weight: 700;
  letter-spacing: -0.03em;
  margin-top: 1rem;
  margin-bottom: -0.5rem;
  color: #000;
  line-height: 1.1;
}

.product-desc {
  color: #666;
  font-size: 1rem;
  font-weight: 500;
  line-height: 1.5;
}

/* Size Selector */
.size-selector {
  margin-top: 2.5rem;
}

.size-label {
  font-size: 1rem;
  font-weight: 700;
  letter-spacing: 0.5px;
  color: #000;
}

.stock-info {
  font-size: 0.7rem;
  font-weight: 600;
  color: #666;
  margin-left: 0.5rem;
  text-transform: none;
}

.no-sizes-msg {
  margin-top: 1rem;
  font-size: 0.9rem;
  color: #999;
  font-weight: 500;
}

.size-buttons {
  display: flex;
  gap: 1rem;
  margin-top: 1.25rem;
  padding: 0.2rem;
  background: #F2F3F6;
  border-radius: 100px;
  width: max-content;
}

.size-btn {
  position: relative;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.9rem;
  font-weight: 500;
  border: none;
  background: transparent;
  color: #666;
  cursor: pointer;
  transition: all 0.3s;
}

.size-btn.active {
  background: #fff;
  color: #000;
}

.size-btn:hover:not(.active) {
  color: #666;
  background: rgba(255, 255, 255, 0.5);
}

/* Cart Section */
.cart-section {
  padding-top: 2rem;
}

.filter-url-goo {
  filter: url('#goo');
}

.add-to-cart-btn {
  width: 100%;
  height: 64px;
  padding: 0 2rem;
  background: #000;
  color: white;
  border: none;
  border-radius: 1000px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
  overflow: visible;
  transition: background 0.3s, transform 0.2s;
  letter-spacing: 0.5px;
  -webkit-transform: translateZ(0);
  transform: translateZ(0);
  backface-visibility: hidden;
}

.add-to-cart-btn:hover {
  background: #1a1a1a;
  transform: translateY(-1px);
  border-radius: 1000px;
}

.add-to-cart-btn:active {
  transform: translateY(0);
  border-radius: 1000px;
}

.add-to-cart-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
  opacity: 0.6;
}

.add-to-cart-btn:disabled:hover {
  background: #ccc;
  transform: none;
}

.price {
  font-size: 1.1rem;
  font-weight: 500;
  opacity: 0.7;
}

/* Quantity Selector */
.quantity-selector {
  margin-top: 1.7rem;
}

.quantity-control {
  display: flex;
  align-items: center;
  gap: 1rem;
  width: max-content;
  background: #F2F3F6;
  border-radius: 100px;
  padding: 0.18rem;
  margin-top: 1.25rem;
}

.qty-btn {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  border: none;
  background: transparent;
  font-size: 1.5rem;
  font-weight: 400;
  color: #666;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s;
  padding-bottom: 4px;
}

.qty-btn:hover:not(:disabled) {
  background: #fff;
  color: #000;
}

.qty-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.qty-val {
  min-width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  font-size: 1rem;
  font-weight: 500;
  color: #000;
  border: none;
  border-radius: 50%;
  background: #fff;
  padding-bottom: 1px;
}

/* Accordion */
.accordion-group {
  margin-top: 2rem;
  border-top: 1px solid #f0f0f0;
}

.accordion-item {
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;
}

.accordion-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 0;
  color: #000;
  font-size: 1rem;
  font-weight: 500;
  letter-spacing: 0.5px;
  user-select: none;
}

.accordion-icon {
  font-size: 1.5rem;
  color: #000;
  transition: color 0.3s;
  font-weight: 400;
}

/* 移动端适配 - 竖屏设备 */
@media (max-aspect-ratio: 1/1) {
  .modal-overlay {
    padding: 0;
    align-items: flex-start;
  }
  
  .modal-content {
    max-width: 100%;
    height: 100vh;
    border-radius: 0;
    flex-direction: column !important;
    overflow-y: auto;
    overflow-x: hidden;
  }
  
  .close-btn {
    position: absolute;
    top: 1.6rem;
    right: 2rem;
    z-index: 100;
    width: 32px;
    height: 32px;
    padding: 0.3rem;
    font-size: 28px;
    background: #f3f4f6;
    color: #1d1d1f;
  }
  
  .close-btn:active {
    transform: scale(0.92);
    background: #e5e7eb;
  }
  
  /* 图片区域 - 上部 */
  .modal-left {
    width: calc(100% - 3rem) !important;
    height: 56vh;
    min-height: 350px;
    flex-shrink: 0;
    margin: 1.2rem 1.5rem 0rem 1.5rem;
    border-radius: 20px;
    overflow: hidden;
  }
  
  .bg-marquee {
    display: flex;
  }
  
  .marquee-text {
    font-size: 15rem;
  }
  
  .product-image {
    width: 100%;
    max-height: 100%;
  }
  
  .modal-left:hover .product-image {
    transform: none;
  }
  
  /* 信息区域 - 下部 */
  .modal-right {
    width: 100% !important;
    padding: 1rem 1.5rem 5rem;
    flex-shrink: 0;
    min-height: auto;
  }
  
  .badge {
    font-size: 0.65rem;
    padding: 0.5rem 0.6rem;
    letter-spacing: -0.2px;
  }
  
  .product-title {
    font-size: 1.7rem;
    margin-top: 1.1rem;
    margin-bottom: 0rem;
  }
  
  .product-desc {
    font-size: 0.9rem;
    line-height: 1.4;
  }
  
  /* 尺码选择器 */
  .size-selector {
    margin-top: 1rem;
  }
  
  .size-label {
    font-size: 0.68rem;
  }
  
  .size-buttons {
    margin-top: 1rem;
    gap: 0.7rem;
    padding: 0.15rem;
  }
  
  .size-btn {
    width: 42px;
    height: 42px;
    font-size: 0.85rem;
  }
  
  /* 数量选择器 */
  .quantity-selector {
    margin-top: 1rem;
  }
  
  .quantity-control {
    margin-top: 1rem;
    gap: 0.7rem;
    padding: 0.15rem;
  }
  
  .qty-btn {
    width: 42px;
    height: 42px;
    font-size: 1.2rem;
  }
  
  .qty-val {
    min-width: 42px;
    height: 42px;
    font-size: 0.9rem;
  }
  
  /* 手风琴 */
  .accordion-group {
    margin-top: 1.5rem;
  }
  
  .accordion-header {
    padding: 0.75rem 0;
    font-size: 0.9rem;
  }
  
  .accordion-icon {
    font-size: 1.2rem;
  }
  
  /* 购买按钮区域 */
  .cart-section {
    margin-top: 0.8rem;
    position: sticky;
    bottom: 0;
    background: white;
    padding: 1rem 0 0.5rem;
    border-radius: 0;
  }
  
  .add-to-cart-btn {
    height: 50px;
    font-size: 0.85rem;
    padding: 0 1.5rem;
    border-radius: 1000px !important;
    transition: none !important;
    transform: translateZ(0) !important;
    -webkit-transform: translateZ(0) !important;
    -webkit-tap-highlight-color: transparent;
    -webkit-touch-callout: none;
    user-select: none;
    touch-action: manipulation;
    backface-visibility: hidden;
    overflow: visible !important;
    will-change: auto;
  }
  
  .add-to-cart-btn:hover {
    transform: translateZ(0) !important;
    -webkit-transform: translateZ(0) !important;
    background: #000 !important;
  }
  
  .add-to-cart-btn:active {
    transform: translateZ(0) !important;
    -webkit-transform: translateZ(0) !important;
    background: #000 !important;
    border-radius: 1000px !important;
  }
  
  .add-to-cart-btn .price {
    font-size: 0.8rem;
  }
}


</style>
