<template>
  <div>
    <!-- 占位元素，提供滚动高度（只在 Catalog 显示时生效） -->
    <div class="scroll-spacer" :class="{ active: isVisible }" ref="scrollSpacer"></div>
    
    <!-- Fixed 定位的内容层 -->
    <div class="catalog-layer">
      <!-- 标题区域 -->
      <div class="catalog-header">
        <div class="header-content">
          <div class="title-group">
            <div class="title-row">
              <!-- 移动端圆角 Logo（桌面端隐藏，通过样式控制） -->
              <div class="logo-badge">
                <img src="/ackoray.png" alt="Ackoray logo" class="logo-img" />
              </div>
              <h1 class="catalog-title">{{ $t('home.catalogTitle') }}</h1>
            </div>
            <!-- 桌面端副标题 -->
            <p class="catalog-subtitle">{{ $t('home.catalogSubtitle') }}</p>
            <!-- 移动端副标题，仅在移动端显示 -->
            <p class="catalog-subtitle-mobile">All products</p>
          </div>
          
          <!-- 移动端顶部导航 -->
          <div class="mobile-nav">
            <router-link v-if="!isAuthenticated" to="/auth" class="nav-auth-btn">
              {{ $t('common.signIn') }}
            </router-link>
            <router-link v-else to="/orders" class="nav-avatar">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
            </svg>
            </router-link>
          </div>
        </div>
      </div>

      <!-- 横向滚动容器 -->
      <div class="horizontal-scroll-wrapper">
        <!-- 加载状态 -->
        <div v-if="loading" class="loading-container">
          <div class="loading-spinner"></div>
          <p>{{ $t('home.loading') }}</p>
        </div>
        
        <!-- 空状态 -->
        <div v-else-if="!loading && products.length === 0" class="empty-container">
          <p>{{ $t('home.noProducts') }}</p>
        </div>
        
        <!-- 产品列表 -->
        <div v-else class="product-track" ref="productTrack">
          <div 
            v-for="product in products" 
            :key="product.id"
            class="card"
            tabindex="0"
            @click="openDetail(product)"
          >
            <div class="card-img-wrap">
              <!-- 打折百分比徽标（移动端样式中控制显示） -->
              <div 
                v-if="product.discountPercent > 0"
                class="discount-badge"
              >
                {{ product.discountPercent }}% off
              </div>
              <!-- 背景滚动文字 -->
              <div class="card-bg-marquee">
                <div class="card-marquee-track">
                  <span class="card-marquee-text">ACKORAY</span>
                  <span class="card-marquee-text">ACKORAY</span>
                </div>
              </div>
              <img :src="product.img" :alt="product.name" class="card-img" loading="lazy">
            </div>
            <div class="card-info">
              <div class="card-title">{{ product.name }}</div>
              <div class="card-price">
                <span class="card-price-current">{{ product.price }}</span>
                <!-- 仅当存在不同的原价时显示原价 -->
                <span 
                  v-if="product.originalPriceRaw && product.originalPriceRaw > product.priceRaw"
                  class="card-price-original"
                >
                  {{ product.originalPriceRaw }} RMB
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 底部版权信息栏 (仅Web端显示) -->
      <footer class="footer desktop-only">
        <p class="copyright-text">
          &copy; 2025 Ackoray.
          <a href="https://beian.miit.gov.cn/" target="_blank" rel="noopener noreferrer" class="beian-link">
            陕ICP备2025077051号-2
          </a>
        </p>
      </footer>

      <!-- Product Detail Modal (Teleport to body for full screen) -->
      <Teleport to="body">
        <ProductDetail 
          v-if="showDetail" 
          :product="selectedProduct"
          @close="closeDetail"
        />
      </Teleport>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuth } from '../composables/useAuth';
import ProductDetail from './ProductDetail.vue';
import { getProductsByStatus } from '@/api/product';
import { BASE_URL } from '@/config';
import gsap from 'gsap';
import ScrollTrigger from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

// 认证状态
const { isAuthenticated, currentUser } = useAuth();

// 产品列表（从后端获取）
const products = ref([]);
const loading = ref(false);

// 获取产品列表
const fetchProducts = async () => {
  try {
    loading.value = true;
    console.log('开始获取产品列表...');
    console.log('API BASE_URL:', BASE_URL);
    
    // 获取已上架的产品
    const response = await getProductsByStatus(true, { page: 0, size: 20 });
    console.log('API响应:', response);
    console.log('响应类型:', typeof response);
    console.log('响应结构:', JSON.stringify(response, null, 2));
    
    // 处理响应数据
    let productList = [];
    if (response && response.data) {
      productList = Array.isArray(response.data) ? response.data : (response.data.content || []);
    } else if (Array.isArray(response)) {
      productList = response;
    } else if (response && response.content) {
      productList = response.content;
    }
    
    console.log('解析后的产品列表:', productList);
    console.log('产品数量:', productList.length);
    
    // 转换为组件需要的格式（当前只在前端固定生成一个「原价」，暂不依赖后端字段）
    products.value = productList.map(p => {
      const price = Number(p.priceR) || 0;
      // 固定原价为 458 RMB，用于展示折扣效果
      const originalPriceRaw = 458;
      
      // 计算折扣百分比（向下取整，避免夸大优惠）
      let discountPercent = 0;
      if (originalPriceRaw > price && price > 0) {
        const rawDiscount = (1 - price / originalPriceRaw) * 100;
        discountPercent = Math.max(0, Math.floor(rawDiscount));
      }

      return {
        id: p.id,
        name: p.name,
        // 当前售价（已包含 RMB 文案，用于直接展示）
        price: `${price} RMB`,
        // 用于前端比较和展示的数值
        priceRaw: price,
        originalPriceRaw,
        discountPercent,
        img: getFullImageUrl(p.mainImageUrl),
        originalData: p // 保存原始数据供详情页使用
      };
    });
    
    console.log('转换后的产品数据:', products.value);
  } catch (error) {
    console.error('获取产品列表失败:', error);
    console.error('错误详情:', error.message);
    console.error('错误堆栈:', error.stack);
    products.value = [];
  } finally {
    loading.value = false;
  }
};

// 处理图片URL
const getFullImageUrl = (url) => {
  if (!url) return '/assets/images/placeholder.png'; // 默认占位图
  if (url.startsWith('http')) return url;
  return `${BASE_URL}${url}`;
};

const showDetail = ref(false);
const selectedProduct = ref(null);
const productTrack = ref(null);
const scrollSpacer = ref(null);
const isVisible = ref(false); // 跟踪 Catalog 是否可见

let horizontalScrollTrigger = null;

const openDetail = (product) => {
  selectedProduct.value = product;
  showDetail.value = true;
  
  // 只禁止滚动，不改变页面位置
  document.body.style.overflow = 'hidden';
};

const closeDetail = () => {
  showDetail.value = false;
  selectedProduct.value = null;
  
  // 恢复滚动
  document.body.style.overflow = '';
};

// 初始化水平滚动
const initHorizontalScroll = () => {
  // 检测是否为竖屏设备（宽高比 <= 1）
  const isMobile = window.innerWidth / window.innerHeight <= 1;
  
  // 移动端使用网格布局，不需要水平滚动，直接返回
  if (isMobile) {
    isVisible.value = true;
    return;
  }
  
  if (productTrack.value && scrollSpacer.value) {
    // 标记为可见
    isVisible.value = true;
    
    // 等待下一帧，确保 active 类已应用
    requestAnimationFrame(() => {
      const track = productTrack.value;
      const wrapper = track.parentElement;
      
      // 获取容器的 padding
      const wrapperStyle = window.getComputedStyle(wrapper);
      const paddingLeft = parseFloat(wrapperStyle.paddingLeft);
      const paddingRight = parseFloat(wrapperStyle.paddingRight);
      
      // 获取 track 的 padding
      const trackStyle = window.getComputedStyle(track);
      const trackPaddingRight = parseFloat(trackStyle.paddingRight);
      
      // track 的总宽度（包括 padding）
      const trackWidth = track.scrollWidth;
      
      // 计算可见宽度（减去容器的 padding）
      const wrapperWidth = wrapper.offsetWidth - paddingLeft - paddingRight;
      
      // 计算需要滚动的距离（track 总宽度 - 可见宽度）
      const scrollDistance = trackWidth - wrapperWidth;
      
      // 根据产品数量和卡片宽度计算合适的滚动区域
      const cardWidth = 350;
      const gap = 30;
      const productCount = products.value.length;
      
      // 计算一个合理的滚动倍数，确保所有卡片都能完整展示
      // 减少倍数以加快滚动速度
      const scrollMultiplier = Math.max(4, Math.ceil(productCount * 0.5));
      
      // 设置占位元素的高度，提供足够的滚动空间
      const spacerHeight = Math.max(scrollDistance * scrollMultiplier, window.innerHeight * 2);
      
      // 使用 CSS 变量设置高度
      scrollSpacer.value.style.setProperty('--spacer-height', `${spacerHeight}px`);
      
      // 等待占位元素高度应用后再创建 ScrollTrigger
      setTimeout(() => {
        if (scrollDistance > 0) {
          horizontalScrollTrigger = gsap.to(track, {
            x: -scrollDistance,
            ease: "none",
            scrollTrigger: {
              trigger: scrollSpacer.value,
              start: "top top",
              end: "bottom bottom",
              scrub: 0.3,
              pin: false,
              markers: false, // 开发时可以设为 true 调试
              invalidateOnRefresh: true,
            }
          });
          
          // 刷新所有 ScrollTriggers
          ScrollTrigger.refresh();
        }
      }, 100);
    });
  }
};

// 设置水平滚动
// 移动端使用网格布局不需要初始化，桌面端由父组件控制
onMounted(async () => {
  // 先获取产品数据
  await fetchProducts();
  
  // 检测是否为竖屏设备（宽高比 <= 1）
  const isMobile = window.innerWidth / window.innerHeight <= 1;
  
  // 移动端使用网格布局，不需要水平滚动
  // 桌面端由父组件调用 initHorizontalScroll
  if (isMobile) {
    // 确保移动端 catalog-layer 可见
    isVisible.value = true;
  }
});

// 组件卸载时清理
onUnmounted(() => {
  document.body.style.overflow = '';
  isVisible.value = false; // 重置状态
  if (horizontalScrollTrigger) {
    horizontalScrollTrigger.scrollTrigger?.kill();
    horizontalScrollTrigger.kill();
  }
});

// 重置水平滚动（离开 Catalog 时调用）
const resetHorizontalScroll = () => {
  isVisible.value = false;
  if (horizontalScrollTrigger) {
    horizontalScrollTrigger.scrollTrigger?.kill();
    horizontalScrollTrigger.kill();
    horizontalScrollTrigger = null;
  }
};

// 暴露方法供父组件调用
defineExpose({
  initHorizontalScroll,
  resetHorizontalScroll
});
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;500;900&display=swap');

/* CSS Variables */
:root {
  --c-accent: #ffae00;
  --ease-elastic: cubic-bezier(0.34, 1.56, 0.64, 1);
  --ease-smooth: cubic-bezier(0.25, 0.1, 0.25, 1);
}

/* 占位元素，提供滚动高度 */
.scroll-spacer {
  width: 100%;
  position: relative;
  pointer-events: none;
  height: 0; /* 默认无高度 */
}

/* 只在 Catalog 显示时才有高度 */
.scroll-spacer.active {
  height: var(--spacer-height, 0);
}

.catalog-layer {
  position: fixed;
  top: 0; 
  left: 0;
  width: 100%;
  height: 100vh;
  background-color: #f5f5f7;
  z-index: 6; 
  padding: 60px 0 0 0;
  overflow-y: auto;
  overflow-x: hidden;
  display: flex;
  flex-direction: column;
}

/* 标题区域 */
.catalog-header {
  margin-left: 8.5rem;
  margin-top: -1.5rem;
  margin-bottom: 3rem;
}

.catalog-title {
  font-size: 4.5rem;
  font-weight: 800;
  line-height: 0.95;
  margin-bottom: 1.2rem;
  line-height: 1.1;
  letter-spacing: -0.03em;
}

.catalog-subtitle {
  font-size: 1.7rem;
  font-weight: 500;
  color: #666;
  margin: 0;
  line-height: 1.1;
  letter-spacing: -0.03em;
  margin-bottom: 1.2rem;
}

/* 仅移动端使用的副标题，默认隐藏（桌面端不显示） */
.catalog-subtitle-mobile {
  display: none;
  font-size: 1.7rem;
  font-weight: 500;
  color: #666;
  margin: 0;
}

/* 标题行：Logo + 文本 */
.title-row {
  display: flex;
  align-items: flex-end;
  gap: 0.75rem;
}

/* Logo 容器：默认桌面端隐藏，只在移动端显示 */
.logo-badge {
  display: none;
}

.logo-img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

/* 横向滚动容器 */
.horizontal-scroll-wrapper {
  width: 100%;
  flex: 1;
  min-height: 550px; /* 最小高度确保卡片完整显示（图片 467px + 信息区域 60px + 边距） */
  overflow: hidden;
  margin-left: 7rem;
  padding-left: 2rem; /* 左侧间距 */
  padding-right: 2rem; /* 右侧间距 */
  display: flex;
  align-items: center; /* 垂直居中 */
}

.product-track {
  display: flex;
  gap: 40px;
  will-change: transform;
  padding-right: 12rem; /* 额外右侧空间（比 wrapper 的 8rem 多 4rem），确保最后一张卡片完整显示 */
}

/* Product Card */
.card {
  background: #ffffff;
  border-radius: 20px;
  overflow: hidden;
  position: relative;
  width: 380px;
  flex-shrink: 0;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.04);
  transition: transform 0.4s cubic-bezier(0.25, 0.8, 0.25, 1), box-shadow 0.3s ease;
  cursor: pointer;
  display: flex;
  flex-direction: column;
}

.card:hover {
  transform: translateY(-15px);
  box-shadow: 0 25px 50px rgba(0, 0, 0, 0.12);
}

.card-img-wrap {
  width: 100%;
  aspect-ratio: 4 / 4.5; /* 图片比例 4:5 */
  overflow: hidden;
  position: relative;
  background: #f0f0f2;
}

/* 折扣徽标：默认在桌面端隐藏，仅在移动端媒体查询中开启显示 */
.discount-badge {
  display: none;
  position: absolute;
  top: 0.75rem;
  left: 0.75rem;
  padding: 0.15rem 0.45rem;
  background: #000;
  color: #fff;
  border-radius: 999px;
  font-size: 0.65rem;
  font-weight: 600;
  letter-spacing: 0.02em;
  line-height: 1;
  z-index: 3;
}

/* 卡片背景滚动文字 */
.card-bg-marquee {
  position: absolute;
  top: 50%;
  left: 0;
  transform: translateY(-50%);
  width: 100%;
  height: 15rem; /* 增加高度，确保文字不被裁剪 */
  opacity: 0.05;
  pointer-events: none;
  user-select: none;
  overflow: hidden;
  z-index: 1;
  display: flex;
  align-items: center; /* 文字垂直居中 */
}

.card-marquee-track {
  display: flex;
  gap: 6rem; /* 两个文字之间的间距 */
  animation: card-marquee 20s linear infinite;
}

.card-marquee-text {
  white-space: nowrap;
  font-size: 12rem; /* 适配 350px 宽的卡片 */
  font-weight: 800;
  line-height: 1.1; /* 稍微增加行高，避免文字底部被裁剪 */
  color: black;
  flex-shrink: 0; /* 防止文字被压缩 */
}

@keyframes card-marquee {
  from {
    transform: translateX(0%);
  }
  to {
    transform: translateX(-50%); /* 移动 50%，两个文字循环 */
  }
}

.card-img {
  position: relative;
  z-index: 2;
  width: 88%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.card:hover .card-img {
  transform: scale(1.06);
}

/* Card Overlay */
.card-overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  padding: 20px;
  background: linear-gradient(to top, rgba(0, 0, 0, 0.6), transparent);
  color: white;
  opacity: 0;
  transform: translateY(10px);
  transition: all 0.3s cubic-bezier(0.25, 0.1, 0.25, 1);
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
}

.card:hover .card-overlay {
  opacity: 1;
  transform: translateY(0);
}

.card-info {
  padding: 20px;
}

.card-title {
  font-size: 1.1rem;
  font-weight: 500;
  margin-bottom: 4px;
  color: #1d1d1f;
}

.card-price {
  font-size: 1rem;
  color: #666;
  font-weight: 500;
  letter-spacing: 0.1px;
}

/* 默认桌面端不显示原价，只展示当前价。
   移动端会在媒体查询中重新定义 .card-price-original 的样式并显示出来。 */
.card-price-original {
  display: none;
}

  /* 价格样式在桌面端保持单价展示，原价样式只在移动端覆盖 */

/* 加载和空状态 */
.loading-container,
.empty-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  width: 100%;
  color: #666;
  /* 补偿父容器的左边距，使内容在页面中心 */
  margin-left: -7rem;
  padding-left: 0;
  padding-right: 0;
}

.loading-spinner {
  width: 48px;
  height: 48px;
  border: 4px solid #f0f0f0;
  border-top-color: #1d1d1f;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 16px;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.loading-container p,
.empty-container p {
  font-size: 1.1rem;
  font-weight: 500;
  margin: 0;
  text-align: center;
}

/* 移动端顶部导航 - 默认隐藏 */
.mobile-nav {
  display: none;
}

/* 移动端适配 - 竖屏设备 */
@media (max-aspect-ratio: 1/1) {
  /* 移动端不需要占位元素 */
  .scroll-spacer {
    display: none !important;
  }
  
  .catalog-layer {
    position: relative !important;
    opacity: 1 !important;
    visibility: visible !important;
    transform: none !important;
    padding: 0;
    min-height: auto;
    height: auto;
    display: block;
  }
  
  .catalog-header {
    margin-left: 1rem;
    margin-right: 1rem;
    margin-top: 1rem;
    margin-bottom: 1rem;
  }
  
  .header-content {
    display: flex;
    align-items: center; /* 让左侧标题与右侧按钮在垂直方向对齐 */
    justify-content: space-between;
    gap: 12px;
  }
  
  .title-group {
    flex: 1;
    min-width: 0;
  }
  
  /* 显示移动端导航 */
  .mobile-nav {
    display: flex;
    align-items: flex-start;
    justify-content: flex-end;
    flex-shrink: 0;
    margin-top: -2.5rem; /* 由父级的 align-items 控制垂直对齐 */
  }
  
  .nav-auth-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 8px 18px; /* 再次放大点击区域 */
    background: rgba(0, 0, 0, 0.85);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    color: #fff;
    border-radius: 20px;
    font-size: 13px; /* 字体再放大一点 */
    font-weight: 600;
    letter-spacing: 0.2px;
    text-decoration: none;
    transition: all 0.2s cubic-bezier(0.25, 0.1, 0.25, 1);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
    border: 1px solid rgba(255, 255, 255, 0.1);
    white-space: nowrap;
    box-sizing: border-box;
  }
  
  .nav-auth-btn:active {
    transform: scale(0.96);
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.2);
  }
  
  .nav-avatar {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    border-radius: 50%;
    background: #fff;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
    transition: all 0.2s cubic-bezier(0.25, 0.1, 0.25, 1);
    flex-shrink: 0;
    box-sizing: border-box;
    color: #1d1d1f;
    margin-top: -0.3rem;
  }
  
  .nav-avatar:active {
    transform: scale(0.92);
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.2);
  }
  
  .nav-avatar svg {
    width: 20px;
    height: 20px;
    display: block;
  }
  
  
  .catalog-title {
    font-size: 0.95rem;
    font-weight: 600;
    line-height: 1.1;
    margin-bottom: 0.5rem;
    letter-spacing: 0.01em;
  }
  
  /* 移动端：使用新的标题行布局（Logo + 文本） */
  .title-row {
    align-items: center; /* 让 logo 与文字垂直居中对齐 */
    gap: 0.6rem;
  }

  .logo-badge {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    border-radius: 14px;
    border: 0.5px solid #727272;
    box-shadow: none;
    overflow: hidden;
    flex-shrink: 0;
  }
  
  /* 移动端：隐藏原来的副标题，使用 All products 文案 */
  .catalog-subtitle {
    display: none;
  }

  .catalog-subtitle-mobile {
    display: block;
    font-size: 1rem;
    font-weight: 600;
    margin-bottom: 0;
    line-height: 1.5;
    margin-top: 0.8rem;
    margin-bottom: 0.2rem;
    color: #000;
  }
  
  /* 改为垂直网格布局 */
  .horizontal-scroll-wrapper {
    height: auto !important;
    min-height: auto !important;
    margin-left: 0 !important;
    padding: 0 1rem 1rem 1rem !important;
    overflow: visible !important;
    display: block !important;
    align-items: initial !important;
    width: 100% !important;
  }
  
  /* 移动端重置加载和空状态的边距 */
  .loading-container,
  .empty-container {
    margin-left: 0 !important;
    padding: 0 1rem !important;
  }
  
  .product-track {
    display: grid !important;
    grid-template-columns: repeat(2, 1fr) !important;
    gap: 8px;
    transform: none !important;
    padding-right: 0 !important;
    padding-left: 0 !important;
    will-change: auto !important;
    width: 100% !important;
    max-width: 100% !important;
  }
  
  .card {
    width: 100% !important;
    max-width: 100% !important;
    margin: 0;
    border-radius: 16px;
    transition: none !important;
    flex-shrink: 1 !important;
  }
  
  /* 禁用移动端卡片hover上移效果 */
  .card:hover {
    transform: none !important;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.04) !important;
  }
  
  /* 禁用移动端点击缩放效果 */
  .card:active {
    transform: none !important;
  }

  .card-img{
    width: 82%;
  }
  
  .card-img-wrap {
    aspect-ratio: 3 / 3.8;
    display: flex;
    justify-content: center;
    align-items: center;
  }
  
  .card-info {
    padding: 10px;
  }
  
  .card-title {
    font-size: 0.8rem;
    font-weight: 600;
    margin-bottom: 2px;
  }

  /* 移动端价格：当前价 + 原价（带删除线） */
  .card-price {
    font-size: 0.75rem;
    font-weight: 800;
    letter-spacing: -0.02rem;
    display: flex;
    align-items: baseline;
    gap: 0.25rem;
  }

  .card-price-current {
    font-weight: 700;
    color: #000;
  }

  .card-price-original {
    font-size: 0.7rem;
    color: #a3a3a3;
    text-decoration: line-through;
    display: inline;
  }
  
  /* 移动端显示折扣徽标，尺寸比列参考设计稿 */
  .discount-badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    /* 固定高度与圆角，形成紧凑的胶囊形标签 */
    height: 21px;
    padding: 0 4px;
    border-radius: 6px;
    /* 文案略小且加粗，接近 33% off 样式 */
    font-size: 0.6rem;
    font-weight: 600;
    letter-spacing: -0.01em;
  }
  
  /* 缩小移动端卡片背景滚动文字 */
  .card-bg-marquee {
    height: 8rem;
  }
  
  .card-marquee-text {
    font-size: 6rem;
  }
  
  .card-marquee-track {
    gap: 3rem;
  }
}

/* 底部版权信息栏 */
.footer {
  width: 100%;
  padding: 1rem 1rem;
  background: #f5f5f7;
  text-align: center;
  border-top: 0.5px solid #f1f1f1;
  margin-top: 2rem;
  flex-shrink: 0;
}

.beian-link {
  color: #b8b8b8;
  text-decoration: none;
  transition: color 0.2s ease;
}

.beian-link:hover {
  color: #b8b8b8;
  text-decoration: underline;
}

.footer p {
  margin: 0;
  color: #b8b8b8;
  font-size: 10px;
  line-height: 1.6;
}

/* 移动端隐藏footer */
@media (max-aspect-ratio: 1/1) {
  .desktop-only {
    display: none !important;
  }
}
</style>