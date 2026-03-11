<template>
  <div v-if="show" class="figma-modal" @keydown.esc.prevent.stop="$emit('close')" tabindex="-1">
    <div class="figma-modal__overlay" @click="$emit('close')"></div>
    <div class="modal-content" role="dialog" aria-modal="true" :aria-label="$t('sizeInfo.title')">
      <div class="discord-card" role="document">
        <div class="modal-body">
          <div class="size-tables-container">
            
            <!-- 服装尺码表 -->
            <div class="size-table-section">
              <div class="size-table">
                <!-- 表头行 - 规格横向显示 -->
                <div class="size-table-row header-row">
                  <div class="size-cell header-label">{{ $t('sizeInfo.tableHeaders.size') }}</div>
                  <div class="size-cell size-label" v-for="size in sizeData" :key="size.label">
                    {{ size.label }}
                  </div>
                </div>
                
                <!-- 胸围行 -->
                <div class="size-table-row">
                  <div class="size-cell measurement-label">{{ $t('sizeInfo.tableHeaders.chest') }}</div>
                  <div class="size-cell" v-for="size in sizeData" :key="'length-' + size.label">
                    {{ size.length }}
                  </div>
                </div>
                
                <!-- 腰围行 -->
                <div class="size-table-row">
                  <div class="size-cell measurement-label">{{ $t('sizeInfo.tableHeaders.waist') }}</div>
                  <div class="size-cell" v-for="size in sizeData" :key="'chest-' + size.label">
                    {{ size.chest }}
                  </div>
                </div>
                
                <!-- 摆围行 -->
                <div class="size-table-row">
                  <div class="size-cell measurement-label">{{ $t('sizeInfo.tableHeaders.hip') }}</div>
                  <div class="size-cell" v-for="size in sizeData" :key="'shoulder-' + size.label">
                    {{ size.shoulder }}
                  </div>
                </div>
                
                <!-- 袖长行 -->
                <div class="size-table-row">
                  <div class="size-cell measurement-label">{{ $t('sizeInfo.tableHeaders.sleeve') }}</div>
                  <div class="size-cell" v-for="size in sizeData" :key="'sleeve-' + size.label">
                    {{ size.sleeve }}
                  </div>
                </div>
                
                <!-- 肩宽行 -->
                <div class="size-table-row">
                  <div class="size-cell measurement-label">{{ $t('sizeInfo.tableHeaders.shoulder') }}</div>
                  <div class="size-cell" v-for="size in sizeData" :key="'shoulderWidth-' + size.label">
                    {{ size.shoulderWidth }}
                  </div>
                </div>
              </div>
              
              <!-- 注释信息 -->
              <div class="size-note">
                {{ $t('sizeInfo.note') }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  show: Boolean,
  gender: String // MALE, FEMALE, UNISEX
})

defineEmits(['close'])

// 男款尺码数据
const maleSizes = [
  { label: 'S', length: 49, chest: 47, shoulder: 47, sleeve: 62, shoulderWidth: 42 },
  { label: 'M', length: 51, chest: 49, shoulder: 49, sleeve: 63, shoulderWidth: 43 },
  { label: 'L', length: 53, chest: 51, shoulder: 51, sleeve: 64, shoulderWidth: 45 },
  { label: 'XL', length: 55, chest: 53, shoulder: 53, sleeve: 66, shoulderWidth: 46 },
];

// 女款尺码数据
const femaleSizes = [
  { label: 'S', length: 43, chest: 40, shoulder: 43, sleeve: 55, shoulderWidth: 35 },
  { label: 'M', length: 45, chest: 42, shoulder: 45, sleeve: 56, shoulderWidth: 37 },
  { label: 'L', length: 47, chest: 44, shoulder: 47, sleeve: 57, shoulderWidth: 39 },
  { label: 'XL', length: 49, chest: 46, shoulder: 49, sleeve: 58, shoulderWidth: 40 },
];

// 根据性别返回对应的尺码数据
const sizeData = computed(() => {
  if (props.gender === 'FEMALE') {
    return femaleSizes;
  } else if (props.gender === 'MALE') {
    return maleSizes;
  } else {
    // UNISEX 或未指定时，默认显示男款
    return maleSizes;
  }
});
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
  width: 35rem; 
  height: 35rem;
  max-width: 90vw; 
  max-height: 90vw;
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
}

.modal-body {
  padding: 0;
  overflow-y: auto;
  overflow-x: hidden;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  height: 100%;
  width: 100%;
  /* 隐藏滚动条但保持滚动功能 */
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none; /* IE and Edge */
}

.modal-body::-webkit-scrollbar {
  display: none; /* Chrome, Safari and Opera */
}

.size-tables-container {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  width: 100%;
  padding: 2.3rem;
}

.gender-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.6rem 1.2rem;
  background: #000;
  color: #fff;
  font-size: 0.85rem;
  font-weight: 600;
  border-radius: 100px;
  letter-spacing: 0.5px;
  margin-bottom: 0.5rem;
  align-self: center;
}

.size-table-section {
  background: #fff;
  color: #000;
  width: 100%;
  margin-top: -0.3rem;
}


.size-table {
  width: 100%;
  background: #fff;
  color: #000;
}

.size-table-row {
  display: flex;
  align-items: center;
  padding: 1.5rem 0;
  position: relative;
}

.size-table-row:not(:last-child) {
  position: relative;
}

.size-table-row:not(:last-child)::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0.5rem;
  right: 0.5rem;
  height: 1px;
  background: #f0f0f0;
}

.size-table-row.header-row {
  font-weight: 500;
  padding: 1.5rem 0;
  position: relative;
}

.size-table-row.header-row::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0.5rem;
  right: 0.5rem;
  height: 1px;
  background: #f0f0f0;
}

.size-cell {
  flex: 1;
  text-align: center;
  padding: 0 0.5rem;
  font-size: 1.05rem;
  font-weight: 500;
  letter-spacing: 0.02rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.size-cell.size-label {
  font-weight: 500;
  color: #000;
}

.size-cell.measurement-label {
  font-weight: 500;
  color: #000;
  justify-content: flex-start;
}

.size-cell.header-label {
  justify-content: flex-start;
}

.size-note {
  padding: 0.8rem;
  font-size: 0.75rem;
  color: #666;
  text-align: center;
  margin-top: 0.8rem;
}

/* 移动端适配 */
@media (max-aspect-ratio: 1/1) {
  .modal-content{
    width: 85vw;
    height: auto;
    max-height: 75vh;
    transform: scale(0.95);
  }
  
  .size-tables-container {
    padding: 0.8rem 0.9rem 0.8rem 1.3rem;
    gap: 0.5rem;
  }
  
  .gender-badge {
    font-size: 0.7rem;
    padding: 0.5rem 1rem;
    margin-bottom: 0.3rem;
  }
  
  .size-table-section {
    margin-top: 0;
  }
  
  /* 表格行间距 */
  .size-table-row {
    padding: 1.1rem 0;
  }
  
  .size-table-row.header-row {
    padding: 1.1rem 0;
  }
  
  /* 缩小文字大小与手风琴标题一致 */
  .size-cell {
    font-size: 0.9rem;
    padding: 0 0.4rem;
    min-width: 50px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .size-cell.header-label,
  .size-cell.measurement-label {
    min-width: 70px;
    justify-content: flex-start;
  }

  .size-note {
    margin-top: -0.5rem;
    font-size: 0.55rem;
  }
}
</style>
