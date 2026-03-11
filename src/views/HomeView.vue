<template>
  <div>
    <!-- 导航栏 -->
    <!-- <NavBar @navigate="handleNavigate" /> -->
    
    <!-- 首页内容 -->
    <div v-show="currentPage === 'home'" :class="['scroll-track', { active: isContentActive }]" ref="trackRef">
      <AppleSection ref="appleRef" class="desktop-only" />
      <LensSection ref="lensRef" class="desktop-only" />
      <CatalogSection ref="catalogRef" />
    </div>
    
    <!-- 联系我们页面 -->
    <ContactView v-if="currentPage === 'contact'" />
  </div>
</template>

<script setup>
import { onMounted, onUnmounted, ref, nextTick } from 'vue';
import NavBar from '../components/NavBar.vue';
import AppleSection from '../components/AppleSection.vue';
import LensSection from '../components/LensSection.vue';
import CatalogSection from '../components/CatalogSection.vue';
import ContactView from './ContactView.vue';
import gsap from 'gsap';
import ScrollTrigger from 'gsap/ScrollTrigger';

const currentPage = ref('home');

const handleNavigate = (page) => {
  currentPage.value = page;
  window.scrollTo(0, 0);
};

gsap.registerPlugin(ScrollTrigger);

const trackRef = ref(null);
const catalogRef = ref(null);
const isContentActive = ref(false);
const isLensShowing = ref(false);
const isCatalogShowing = ref(false);
const isAnimating = ref(false);
let ctx;
let scrollTl;

// === 滚轮监听 ===
const handleWheel = (e) => {
  if (isAnimating.value) return;

  // 从 Apple 到 Lens
  if (!isContentActive.value && e.deltaY > 0) {
    triggerPagePop();
  }
  // 从 Lens 到 Catalog（只有滚动到底部才允许）
  else if (isLensShowing.value && !isCatalogShowing.value && e.deltaY > 0) {
    // 检查是否滚动到了页面底部（第3张图片）
    const scrollProgress = window.scrollY / (document.documentElement.scrollHeight - window.innerHeight);
    if (scrollProgress > 0.95) { // 滚动到接近底部时才跳转
      triggerLensToCatalog();
    }
  }
  // 从 Catalog 返回 Lens
  else if (isCatalogShowing.value && window.scrollY <= 5 && e.deltaY < 0) {
    triggerCatalogToLens();
  }
  // 从 Lens 返回 Apple（只有在顶部才允许）
  else if (isContentActive.value && isLensShowing.value && !isCatalogShowing.value && e.deltaY < 0 && window.scrollY <= 5) {
    triggerPageClose();
  }
};

// === 进场动画: Apple -> Lens ===
const triggerPagePop = () => {
  isAnimating.value = true;

  const jumpTl = gsap.timeline({
    onComplete: () => {
      isContentActive.value = true;
      isLensShowing.value = true;
      isAnimating.value = false;
      nextTick(() => ScrollTrigger.refresh());
    }
  });

  // 1. 隐藏第一页
  jumpTl.set(".apple-layer", { autoAlpha: 0 });

  // 2. 显示 Lens 页面
  jumpTl.to(".lens-layer", { 
    autoAlpha: 1, 
    scale: 1,     
    duration: 0.8, 
    ease: "back.out(1.2)" 
  });
};

// === 退场动画: Lens -> Apple ===
const triggerPageClose = () => {
  isAnimating.value = true;
  isContentActive.value = false;
  isLensShowing.value = false;

  const backTl = gsap.timeline({
    onComplete: () => {
      isAnimating.value = false;
      // 重置 film-strip 到第一张图片，为下次进入做准备
      gsap.set(".film-strip", { y: 0 });
      gsap.set("#bgText", { y: 0, opacity: 1 });
      const bgText = document.querySelector("#bgText");
      if (bgText) bgText.innerText = "MINIMAL";
      if (scrollTl) scrollTl.progress(0);
      window.scrollTo(0, 0);
    }
  });

  // 1. Lens 页面消失
  backTl.to(".lens-layer", { 
    autoAlpha: 0, 
    scale: 0.9, 
    duration: 0.6, 
    ease: "power2.in" 
  });

  // 2. 显示第一页
  backTl.set(".apple-layer", { autoAlpha: 1 });
};

// === Lens -> Catalog ===
const triggerLensToCatalog = () => {
  isAnimating.value = true;
  isCatalogShowing.value = true;

  // 立即隐藏 Lens 层，然后滚动（用户完全看不到）
  gsap.set(".lens-layer", { autoAlpha: 0 });
  window.scrollTo(0, 0);

  const jumpTl = gsap.timeline({
    onComplete: () => {
      isAnimating.value = false;
      // 在动画完成后初始化水平滚动
      nextTick(() => {
        if (catalogRef.value && catalogRef.value.initHorizontalScroll) {
          setTimeout(() => {
            catalogRef.value.initHorizontalScroll();
            // 再次刷新确保所有 ScrollTriggers 正确计算
            setTimeout(() => {
              ScrollTrigger.refresh();
            }, 200);
          }, 200);
        }
      });
    }
  });
  
  // 显示 Catalog（带动画）
  jumpTl.to(".catalog-layer", { 
    autoAlpha: 1, 
    scale: 1,
    duration: 0.8, 
    ease: "back.out(1.2)" 
  });
};

// === Catalog -> Lens ===
const triggerCatalogToLens = () => {
  isAnimating.value = true;
  isCatalogShowing.value = false;

  // 重置 Catalog 的滚动状态
  if (catalogRef.value && catalogRef.value.resetHorizontalScroll) {
    catalogRef.value.resetHorizontalScroll();
  }

  const backTl = gsap.timeline({
    onComplete: () => {
      isAnimating.value = false;
    }
  });

  // 隐藏 Catalog
  backTl.to(".catalog-layer", { 
    autoAlpha: 0, 
    scale: 0.95,
    duration: 0.6, 
    ease: "power2.in",
    onStart: () => {
      // 在 Catalog 开始隐藏时设置 film-strip 到第三张图片
      gsap.set(".film-strip", { y: "-120vh" });
      gsap.set("#bgText", { y: -50, opacity: 0.1 });
      const bgText = document.querySelector("#bgText");
      if (bgText) bgText.innerText = "FUTURE";
      
      // 滚动到底部（第三张图片的位置）
      const maxScroll = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
      window.scrollTo(0, maxScroll);
    }
  });
  
  // 显示 Lens
  backTl.to(".lens-layer", { 
    autoAlpha: 1, 
    scale: 1,
    duration: 0.8, 
    ease: "back.out(1.2)" 
  }, "-=0.3");
};

onMounted(() => {
  // 检测是否为竖屏设备（宽高比 <= 1）
  const isMobile = window.innerWidth / window.innerHeight <= 1;
  
  // 移动端直接显示产品列表，跳过所有动画
  if (isMobile) {
    gsap.set(".catalog-layer", { 
      zIndex: 1, 
      autoAlpha: 1, 
      scale: 1, 
      y: 0,
      position: 'relative'
    });
    return; // 移动端不需要执行后续的动画初始化
  }
  
  // 桌面端初始化
  gsap.set([".lens-layer", ".catalog-layer"], { 
    zIndex: 100, 
    autoAlpha: 0, 
    scale: 0.9, 
    y: 0,
    transformOrigin: "center center" 
  });
  
  window.addEventListener('wheel', handleWheel, { passive: false });

  nextTick(() => {
    const images = document.querySelectorAll('.slide-img');
    const imagePromises = Array.from(images).map(img => {
      if (img.complete) {
        return Promise.resolve();
      }
      return new Promise((resolve) => {
        img.addEventListener('load', resolve);
        img.addEventListener('error', resolve);
      });
    });

    Promise.all(imagePromises).then(() => {
      ctx = gsap.context(() => {
        
        scrollTl = gsap.timeline({
          scrollTrigger: {
            trigger: trackRef.value,
            start: "top top",
            end: "+=200%",
            scrub: 1,
          }
        });

        // Slide 1 -> 2 (只切换图片，不缩放)
        scrollTl.to(".film-strip", { y: "-60vh", duration: 3, ease: "power2.inOut" }, "+=0.5");
        scrollTl.to("#bgText", { y: -50, opacity: 0.1, duration: 3 }, "<");
        scrollTl.call(() => { 
          const bgText = document.querySelector("#bgText");
          if (bgText) bgText.innerText = "ESSENCE"; 
        }, null, "-=1.5");

        // Slide 2 -> 3 (只切换图片，不缩放)
        scrollTl.to(".film-strip", { y: "-120vh", duration: 3, ease: "power2.inOut" }, "+=0.5");
        scrollTl.call(() => { 
          const bgText = document.querySelector("#bgText");
          if (bgText) bgText.innerText = "FUTURE"; 
        }, null, "-=1.5");

      }, trackRef.value);
    });
  });
});

onUnmounted(() => {
  // 检测是否为竖屏设备（宽高比 <= 1）
  const isMobile = window.innerWidth / window.innerHeight <= 1;
  if (!isMobile) {
    window.removeEventListener('wheel', handleWheel);
    ctx && ctx.revert();
  }
});
</script>

<style>
body { margin: 0; padding: 0; background-color: #f5f5f7; overflow-x: hidden; }

.scroll-track { 
  width: 100%; 
  height: 100vh; 
  position: relative; 
  overflow: hidden; 
}

.scroll-track.active {
  height: auto;
  min-height: 300vh; 
  overflow: visible;
}

/* 移动端适配：直接显示产品列表 - 竖屏设备 */
@media (max-aspect-ratio: 1/1) {
  /* 隐藏文字页面和图片滚动页面 */
  .desktop-only {
    display: none !important;
  }
  
  /* 移动端直接显示CatalogSection，取消层级和动画 */
  .scroll-track {
    height: auto !important;
    min-height: auto;
    overflow: visible !important;
  }
  
  .scroll-track.active {
    height: auto !important;
    min-height: auto;
  }
}
</style>