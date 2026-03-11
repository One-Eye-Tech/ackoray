<template>
  <!-- SVG Goo 滤镜定义 - 让按钮边缘更圆滑 -->
  <svg style="visibility: hidden; position: absolute;" width="0" height="0" xmlns="http://www.w3.org/2000/svg" version="1.1">
    <defs>
      <filter id="goo">
        <feGaussianBlur in="SourceGraphic" stdDeviation="10" result="blur" />    
        <feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 19 -9" result="goo" />
        <feComposite in="SourceGraphic" in2="goo" operator="atop"/>
      </filter>
    </defs>
  </svg>
  
  <!-- 使用路由视图 -->
  <router-view />
</template>

<script setup>
</script>

<style>
/* === 全局样式重置 === */
/* 这些样式作用于整个应用，放在这里最合适 */

/* 全局字体设置 - Apple 系统字体 */
* {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  box-sizing: border-box;
}

html {
  margin: 0;
  padding: 0;
  width: 100%;
}

body {
  margin: 0;
  padding: 0;
  background-color: #f2f2f2;
  overflow-x: hidden;
  width: 100%;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

#app {
  width: 100%;
  margin: 0;
  padding: 0;
}

/* 如果之后引入 vue-router，这里可以放路由过渡动画等 */
</style>