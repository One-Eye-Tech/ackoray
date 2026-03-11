<template>
  <div v-if="show" class="figma-modal" @keydown.esc.prevent.stop="$emit('close')" tabindex="-1">
    <div class="figma-modal__overlay" @click="$emit('close')"></div>
    <div class="modal-content" role="dialog" aria-modal="true" aria-label="产品介绍">
      <div class="discord-card" role="document">
        <div class="modal-body">
          <div class="product-content">
            <!-- 图片轮播区域 -->
            <div 
              v-if="productImages.length > 0" 
              class="image-carousel"
              @touchstart="handleTouchStart"
              @touchmove="handleTouchMove"
              @touchend="handleTouchEnd"
            >
              <div class="carousel-container">
                <div 
                  class="carousel-track" 
                  :style="{ transform: `translateX(-${currentIndex * 100}%)` }"
                >
                  <div 
                    v-for="(image, index) in productImages" 
                    :key="index" 
                    class="carousel-slide"
                  >
                    <img 
                      :src="image" 
                      :alt="`产品图片 ${index + 1}`"
                      class="product-image"
                    />
                  </div>
                </div>
              </div>
              
              <!-- 导航按钮 -->
              <button 
                class="carousel-btn prev-btn" 
                @click="prevImage"
                :disabled="currentIndex === 0"
                aria-label="上一张图片"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M15 18L9 12L15 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </button>
              
              <button 
                class="carousel-btn next-btn" 
                @click="nextImage"
                :disabled="currentIndex === productImages.length - 1"
                aria-label="下一张图片"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M9 18L15 12L9 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </button>
              
              <!-- 指示器 -->
              <div class="carousel-indicators">
                <span 
                  v-for="(image, index) in productImages" 
                  :key="index"
                  :class="['indicator', { active: currentIndex === index }]"
                  @click="goToImage(index)"
                ></span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'

const props = defineProps({
  show: Boolean,
  productId: Number
})

defineEmits(['close'])

// 当前显示的图片索引
const currentIndex = ref(0)

// 根据产品ID获取对应的图片数组
const productImages = computed(() => {
  // 这里使用本地图片路径
  const id = props.productId || 1
  
  // 默认返回一些示例图片，可以根据实际情况调整
  return [
    `/assets/images/w1.webp`,
    `/assets/images/w2.webp`,
    `/assets/images/w3.webp`,
    `/assets/images/w4.webp`,
    `/assets/images/w5.webp`,
    `/assets/images/w6.webp`,
    `/assets/images/w7.webp`,

  ]
})

// 上一张图片
const prevImage = () => {
  if (currentIndex.value > 0) {
    currentIndex.value--
  }
}

// 下一张图片
const nextImage = () => {
  if (currentIndex.value < productImages.value.length - 1) {
    currentIndex.value++
  }
}

// 跳转到指定图片
const goToImage = (index) => {
  currentIndex.value = index
}

// 监听产品ID变化，重置图片索引
watch(() => props.productId, () => {
  currentIndex.value = 0
})

// 触摸滑动相关变量
const touchStartX = ref(0)
const touchStartY = ref(0)
const isDragging = ref(false)
const minSwipeDistance = 50

// 触摸开始
const handleTouchStart = (e) => {
  touchStartX.value = e.touches[0].clientX
  touchStartY.value = e.touches[0].clientY
  isDragging.value = true
}

// 触摸移动
const handleTouchMove = (e) => {
  if (!isDragging.value) return
  e.preventDefault()
}

// 触摸结束
const handleTouchEnd = (e) => {
  if (!isDragging.value) return
  
  const touchEndX = e.changedTouches[0].clientX
  const touchEndY = e.changedTouches[0].clientY
  const deltaX = touchStartX.value - touchEndX
  const deltaY = touchStartY.value - touchEndY
  
  if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > minSwipeDistance) {
    if (deltaX > 0) {
      nextImage()
    } else {
      prevImage()
    }
  }
  
  isDragging.value = false
}
</script>

<style scoped>
/* 使用与项目一致的弹出框样式 */
.figma-modal { 
  position: fixed; 
  inset: 0; 
  z-index: 1000; 
  display: flex; 
  align-items: center; 
  justify-content: center; 
  padding: 0.1rem; 
}

.figma-modal__overlay { 
  position: absolute; 
  inset: 0; 
  background: rgba(0,0,0,.8); 
  backdrop-filter: saturate(140%) blur(.2rem); 
}

.modal-content { 
  position: relative; 
  aspect-ratio: 3 / 4;
  width: min(90vw, calc(85vh * 3 / 4));
  height: auto;
  max-width: 90vw; 
  max-height: 84.5vh;
  background: transparent; 
  border-radius: 0.5rem; 
  display: block; 
  margin: 0 auto; 
}

.discord-card {
  background: #ffffff;
  border-radius: 20px;
  overflow: hidden;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.modal-body {
  padding: 0.3rem;
  overflow: hidden;
  flex: 1;
  height: 100%;
  max-height: none;
  display: flex;
}

.product-content {
  width: 100%;
  height: 100%;
  display: flex;
}

/* 图片轮播样式 */
.image-carousel {
  position: relative;
  width: 100%;
  height: 100%;
  background: transparent;
  border-radius: 19px;
  overflow: hidden;
}

.image-carousel:hover .carousel-btn {
  opacity: 1;
  visibility: visible;
}

.carousel-container {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.carousel-track {
  display: flex;
  width: 100%;
  height: 100%;
  transition: transform 0.3s ease-in-out;
}

.carousel-slide {
  flex: 0 0 100%;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.product-image {
  max-width: 100%;
  max-height: 100%;
  width: 100%;
  height: 100%;
  object-fit: contain;
  border-radius: 0.4rem;
}

/* 导航按钮 */
.carousel-btn {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  background: rgba(0, 0, 0, 0.25);
  border: none;
  border-radius: 50%;
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  cursor: pointer;
  transition: all 0.3s ease;
  z-index: 10;
  opacity: 0;
  visibility: hidden;
}

.carousel-btn:hover:not(:disabled) {
  background: rgba(0, 0, 0, 0.5);
}

.carousel-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.prev-btn {
  left: 1rem;
}

.next-btn {
  right: 1rem;
}

/* 指示器 */
.carousel-indicators {
  position: absolute;
  bottom: 1rem;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 0.5rem;
  z-index: 10;
}

.indicator {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background-color: rgba(255, 255, 255, 0.5);
  cursor: pointer;
  transition: all 0.3s ease;
  border: 1px solid rgba(255, 255, 255, 0.8);
}

.indicator:hover {
  background-color: rgba(255, 255, 255, 0.8);
  transform: scale(1.1);
}

.indicator.active {
  background-color: rgba(255, 255, 255, 1);
  width: 30px;
  border-radius: 6px;
}

@media (max-aspect-ratio: 1/1) {
  .modal-content {
    width: 85vw !important;
    max-height: 75vh !important;
    transform: scale(0.95);
  }

  .modal-body {
    padding: 0.2rem 0.2rem !important;
  }
  
  .image-carousel {
    min-height: 250px;
    touch-action: pan-x;
  }

  .product-image {
    border-radius: 0.4rem;
  }
  
  .carousel-btn {
    display: none;
  }
}
</style>
