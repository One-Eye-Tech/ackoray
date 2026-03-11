<template>
  <div v-if="show" class="figma-modal" @keydown.esc.prevent.stop="$emit('close')" tabindex="-1">
    <div class="figma-modal__overlay" @click="$emit('close')"></div>
    <div class="modal-content" role="dialog" aria-modal="true" :aria-label="$t('fabricInfo.title')">
      <div class="discord-card" role="document">
        <div class="modal-body">
          <div class="fabric-content">
            <h4 class="fabric-title">{{ $t('fabricInfo.mainTitle') }}</h4>
            
            <div class="fabric-section">
              <h5 class="section-title">{{ $t('fabricInfo.feature1.title') }}</h5>
              <p class="section-text">{{ $t('fabricInfo.feature1.content') }}</p>
            </div>

            <div class="fabric-section">
              <h5 class="section-title">{{ $t('fabricInfo.feature2.title') }}</h5>
              <p class="section-text">{{ $t('fabricInfo.feature2.content') }}</p>
            </div>

            <div class="fabric-section">
              <h5 class="section-title">{{ $t('fabricInfo.feature3.title') }}</h5>
              <ul class="section-list">
                <li v-for="(item, index) in feature3Items" :key="index">{{ item }}</li>
              </ul>
            </div>

            <div class="fabric-section">
              <h5 class="section-title">{{ $t('fabricInfo.feature4.title') }}</h5>
              <p class="section-text">{{ $t('fabricInfo.feature4.content') }}</p>
            </div>

            <div class="fabric-section">
              <h5 class="section-title">{{ $t('fabricInfo.feature5.title') }}</h5>
              <p class="section-text">{{ $t('fabricInfo.feature5.content') }}</p>
            </div>

            <div class="fabric-section">
              <h5 class="section-title">{{ $t('fabricInfo.feature6.title') }}</h5>
              <ul class="section-list">
                <li v-for="(item, index) in feature6Items" :key="index">{{ item }}</li>
              </ul>
            </div>

            <div class="fabric-section">
              <h5 class="section-title">{{ $t('fabricInfo.feature7.title') }}</h5>
              <p class="section-text">{{ $t('fabricInfo.feature7.content') }}</p>
            </div>

            <div class="fabric-composition">
              <h4 class="composition-title">{{ $t('fabricInfo.blendTitle') }}</h4>
              
              <div class="composition-table">
                <div class="table-row">
                  <div class="table-cell header">{{ $t('fabricInfo.blendFeature') }}</div>
                  <div class="table-cell header">{{ $t('fabricInfo.blendAdvantage') }}</div>
                </div>
                <div class="table-row">
                  <div class="table-cell">{{ $t('fabricInfo.blend1.feature') }}</div>
                  <div class="table-cell">{{ $t('fabricInfo.blend1.advantage') }}</div>
                </div>
                <div class="table-row">
                  <div class="table-cell">{{ $t('fabricInfo.blend2.feature') }}</div>
                  <div class="table-cell">{{ $t('fabricInfo.blend2.advantage') }}</div>
                </div>
                <div class="table-row">
                  <div class="table-cell">{{ $t('fabricInfo.blend3.feature') }}</div>
                  <div class="table-cell">{{ $t('fabricInfo.blend3.advantage') }}</div>
                </div>
                <div class="table-row">
                  <div class="table-cell">{{ $t('fabricInfo.blend4.feature') }}</div>
                  <div class="table-cell">{{ $t('fabricInfo.blend4.advantage') }}</div>
                </div>
                <div class="table-row">
                  <div class="table-cell">{{ $t('fabricInfo.blend5.feature') }}</div>
                  <div class="table-cell">{{ $t('fabricInfo.blend5.advantage') }}</div>
                </div>
                <div class="table-row">
                  <div class="table-cell">{{ $t('fabricInfo.blend6.feature') }}</div>
                  <div class="table-cell">{{ $t('fabricInfo.blend6.advantage') }}</div>
                </div>
              </div>
            </div>
            
            <!-- 底部附加信息 -->
            <div class="fabric-footer">
              <ul class="footer-list">
                <li>{{ $t('fabricInfo.summary1') }}</li>
                <li>{{ $t('fabricInfo.summary2') }}</li>
                <li>{{ $t('fabricInfo.summary3') }}</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

defineProps({
  show: Boolean
})

defineEmits(['close'])

const { t, tm } = useI18n()

// 使用 tm() 获取消息对象（支持数组）
const feature3Items = computed(() => {
  const items = tm('fabricInfo.feature3.items')
  return Array.isArray(items) ? items : []
})

const feature6Items = computed(() => {
  const items = tm('fabricInfo.feature6.items')
  return Array.isArray(items) ? items : []
})
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
  padding: clamp(.5rem, 1vh, 1.5rem); 
}

.figma-modal__overlay { 
  position: absolute; 
  inset: 0; 
  background: rgba(0,0,0,.8); 
  backdrop-filter: saturate(140%) blur(.2rem); 
}

.modal-content { 
  position: relative; 
  width: 45rem; 
  height: auto;
  max-width: 90vw; 
  max-height: 85vh;
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
  padding: 0.5rem 2rem 1rem 2rem;
  overflow-y: auto;
  overflow-x: hidden;
  flex: 1;
  max-height: calc(85vh - 4rem);
  /* 隐藏滚动条但保持滚动功能 */
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none; /* IE and Edge */
}

.modal-body::-webkit-scrollbar {
  display: none; /* Chrome, Safari and Opera */
}

.fabric-content {
  color: #000000;
  line-height: 1.6;
}

.fabric-title {
  font-size: 1.1rem;
  font-weight: 500;
  color: #000;
  margin-bottom: 1.5rem;
  text-align: left;
}

.fabric-section {
  margin-bottom: 1.2rem;
}

.section-title {
  font-size: 1rem;
  font-weight: 500;
  color: #000;
  margin-bottom: 0.5rem;
}

.section-text {
  font-size: 0.9rem;
  color: #666;
  font-weight: 400;
  margin: 0;
  padding-left: 1rem;
}

.section-list {
  font-size: 0.9rem;
  font-weight: 400;
  color: #666;
  margin: 0;
  padding-left: 2rem;
}

.section-list li {
  margin-bottom: 0.3rem;
}

.fabric-composition {
  margin-top: 2rem;
  padding-top: 1.5rem;
  border-top: 1px solid #f0f0f0;
}

.composition-title {
  font-size: 1.1rem;
  font-weight: 500;
  color: #000;
  margin-bottom: 1rem;
}

.composition-table {
  display: flex;
  flex-direction: column;
  border: 1px solid #f0f0f0;
  border-radius: 0.25rem;
  overflow: hidden;
}

.table-row {
  display: flex;
  border-bottom: 1px solid #f0f0f0;
}

.table-row:last-child {
  border-bottom: none;
}

.table-cell {
  flex: 1;
  padding: 0.75rem;
  font-size: 0.9rem;
  font-weight: 500;
  color: #666;
  border-right: 1px solid #f0f0f0;
}

.table-cell:last-child {
  border-right: none;
}

.table-cell.header {
  background: #fafafa;
  font-size: 0.9rem;
  font-weight: 500;
  color: #000;
}

.table-cell:first-child {
  flex: 0 0 120px;
  font-weight: 500;
}

.fabric-footer {
  margin-top: 2rem;
  padding-top: 1.5rem;
  border-top: 1px solid #f0f0f0;
}

.footer-list {
  font-size: 0.9rem;
  font-weight: 500;
  color: #666;
  margin: 0;
  padding-left: 1rem;
  list-style-type: disc;
}

.footer-list li {
  margin-bottom: 0.5rem;
  line-height: 1.5;
}

/* 移动端适配 */
@media (max-aspect-ratio: 1/1) {
  .modal-content {
    transform: scale(0.95);
    width: 85vw;
    max-height: 75vh;
  }
  
  .modal-body {
    padding: 0.8rem 1rem;
    max-height: calc(75vh - 3rem);
  }
  
  .fabric-title {
    font-size: 1rem;
    margin-bottom: 1rem;
  }
  
  .section-title {
    font-size: 0.9rem;
  }
  
  .section-text,
  .section-list {
    font-size: 0.8rem;
  }
  
  .composition-title {
    font-size: 0.95rem;
  }
  
  .table-cell {
    padding: 0.6rem;
    font-size: 0.8rem;
  }
  
  .table-cell:first-child {
    flex: 0 0 100px;
  }
  
  .fabric-footer {
    margin-top: 1.5rem;
    padding-top: 1rem;
  }
  
  .footer-list {
    font-size: 0.8rem;
    padding-left: 1rem;
  }
  
  .footer-list li {
    margin-bottom: 0.4rem;
  }
}
</style>
