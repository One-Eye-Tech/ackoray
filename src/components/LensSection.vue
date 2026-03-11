<template>
  <div class="lens-layer" ref="layerRef">
    
    <!-- 背景大字 -->
    <div class="bg-typography">
      <div class="big-text" id="bgText">MINIMAL</div>
    </div>

    <!-- 装饰线 -->
    <div class="guide-line line-v"></div>
    <div class="guide-line line-h"></div>

    <!-- 核心窗口 -->
<div class="lens-frame">
      <div class="film-strip">
        <!-- Slide 1 -->
        <div class="slide">
          <!-- 修改 src -->
          <img src="https://images.unsplash.com/photo-1486325212027-8081e485255e?q=80&w=1000&auto=format&fit=crop" alt="Building" class="slide-img">
          <div class="slide-caption">Fig. 1 — Structure</div>
        </div>
        <!-- Slide 2 -->
        <div class="slide">
          <!-- 修改 src -->
          <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=1000&auto=format&fit=crop" alt="Portrait" class="slide-img">
          <div class="slide-caption">Fig. 2 — Humanity</div>
        </div>
        <!-- Slide 3 -->
        <div class="slide">
          <!-- 修改 src -->
          <img src="https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?q=80&w=1000&auto=format&fit=crop" alt="Nature" class="slide-img">
          <div class="slide-caption">Fig. 3 — Essence</div>
        </div>
      </div>
    </div>

    <!-- Apple 风格滚动提示 -->
    <div class="scroll-hint-wrapper">
      <div class="scroll-icon">
        <svg width="24" height="24" viewBox="0 0 24 24">
          <path class="chevron-arrow" d="M6 9l6 6 6-6"></path>
        </svg>
      </div>
    </div>

  </div>
</template>

<script setup>

</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;500;900&display=swap');

* { box-sizing: border-box; margin: 0; padding: 0; }

.lens-layer {
  position: fixed; 
  top: 0; 
  left: 0; 
  width: 100%; 
  height: 100vh;
  z-index: 5; 
  background-color: #F5F5F7; 
  color: #111;
  
  /* === 关键布局修改 === */
  /* 不再使用 Flex 居中，而是用 Padding 手动定位 */
  display: block; 
  /* 初始状态：上边距 20vh + 图片 60vh + 下边距 20vh = 居中 */
  padding-top: 20vh; 
  overflow: visible; /* 允许产品列表超出屏幕显示 */
}

/* === 核心组件 === */
.bg-typography { position: absolute; width: 100%; height: 100%; display: flex; justify-content: center; align-items: center; pointer-events: none; z-index: 0; top: 0; }
.big-text { font-size: 15vw; font-weight: 900; color: rgba(0,0,0,0.04); letter-spacing: -0.05em; white-space: nowrap; transform: translateY(100px); }

.lens-frame {
  position: relative; 
  width: 40vw; 
  height: 60vh; 
  overflow: hidden; 
  background: #fff; 
  z-index: 10; 
  display: flex; 
  flex-direction: column;
  box-sizing: border-box; 
  margin: 0 auto; 
  border: 1px solid #111;  
  border-radius: 20px;
}

.film-strip { width: 100%; display: flex; flex-direction: column; }
.slide { width: 100%; height: 60vh; position: relative; display: flex; justify-content: center; align-items: center; flex-shrink: 0; padding: 40px; }
.slide-img { width: 80%; height: 80%; object-fit: cover; filter: grayscale(100%) contrast(1.2); display: block; border-radius: 20px;}
.slide-caption { position: absolute; bottom: 20px; left: 20px; font-size: 0.8rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.1em; background: #fff; padding: 5px 10px; border: 1px solid #000; z-index: 2; border-radius: 8px;}
.guide-line { position: absolute; background: rgba(0,0,0,0.2); z-index: 5; }
.line-v { width: 1px; height: 100vh; top: 0; left: 50%; transform: scaleY(1); }
.line-h { width: 100vw; height: 1px; top: 50%; left: 0; transform: scaleX(1); }
.meta-info {
  position: absolute; right: 40px; top: 50%; transform: translateY(-50%);
  text-align: right; z-index: 20; 
  /* === 修改点 3: 文字默认显示 === */
  opacity: 1; 
}
.meta-label { font-size: 0.7rem; color: #666; margin-bottom: 5px; display: block; }
.meta-value { font-size: 1.5rem; font-weight: 300; display: block; }

/* Apple 风格滚动提示 */
.scroll-hint-wrapper {
  position: absolute;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  opacity: 1;
  transition: opacity 0.6s cubic-bezier(0.4, 0, 0.2, 1), 
              filter 0.6s cubic-bezier(0.4, 0, 0.2, 1), 
              transform 0.6s cubic-bezier(0.4, 0, 0.2, 1);
  pointer-events: none;
  z-index: 100;
}

.scroll-hint-wrapper.hidden {
  opacity: 0;
  filter: blur(10px);
  transform: translateX(-50%) translateY(-20px);
}

.scroll-text {
  font-size: 12px;
  font-weight: 800;
  color: #000;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  opacity: 0.8;
}

.scroll-icon {
  width: 24px;
  height: 24px;
  display: flex;
  justify-content: center;
  align-items: center;
}

.chevron-arrow {
  fill: none;
  stroke: #111;
  stroke-width: 2.5;
  stroke-linecap: round;
  stroke-linejoin: round;
  opacity: 0;
  animation: scroll-flow 2.5s infinite;
}

@keyframes scroll-flow {
  0% {
    transform: translateY(-6px);
    opacity: 0;
  }
  30% {
    opacity: 1;
  }
  60% {
    opacity: 1;
  }
  100% {
    transform: translateY(10px);
    opacity: 0;
  }
}

</style>