<template>
  <div class="apple-select" ref="selectContainer">
    <div 
      class="select-trigger" 
      @click="toggleDropdown"
      :class="{ active: isOpen, focused: isFocused }"
      @blur="handleBlur"
      tabindex="0"
    >
      <span class="selected-text">{{ selectedLabel }}</span>
      <svg class="chevron-icon" :class="{ rotated: isOpen }" width="12" height="8" viewBox="0 0 12 8" fill="none">
        <path d="M1 1.5L6 6.5L11 1.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    </div>
    
    <transition name="dropdown">
      <div v-if="isOpen" class="dropdown-menu">
        <div 
          v-for="option in options" 
          :key="option.id"
          class="dropdown-item"
          :class="{ selected: modelValue === option.id }"
          @click="selectOption(option)"
        >
          <span>{{ option.label }}</span>
          <svg v-if="modelValue === option.id" class="check-icon" width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M3 8L6.5 11.5L13 5" stroke="#0071E3" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'

const props = defineProps({
  modelValue: {
    type: [String, Number],
    default: null
  },
  options: {
    type: Array,
    required: true,
    // options format: [{ id: 1, label: 'Option 1' }]
  }
})

const emit = defineEmits(['update:modelValue'])

const isOpen = ref(false)
const isFocused = ref(false)
const selectContainer = ref(null)

const selectedLabel = computed(() => {
  const selected = props.options.find(opt => opt.id === props.modelValue)
  return selected ? selected.label : 'Select an option'
})

const toggleDropdown = () => {
  isOpen.value = !isOpen.value
  isFocused.value = true
}

const selectOption = (option) => {
  emit('update:modelValue', option.id)
  isOpen.value = false
  isFocused.value = false
}

const handleBlur = () => {
  setTimeout(() => {
    isFocused.value = false
  }, 200)
}

const handleClickOutside = (event) => {
  if (selectContainer.value && !selectContainer.value.contains(event.target)) {
    isOpen.value = false
    isFocused.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<style scoped>
.apple-select {
  position: relative;
  width: 100%;
}

.select-trigger {
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
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: #1D1D1F;
  user-select: none;
}

.select-trigger:hover {
  border-color: #D2D2D7;
  background: #fff;
}

.select-trigger.active,
.select-trigger.focused {
  border-color: #0071E3;
  box-shadow: 0 0 0 3px rgba(0, 113, 227, 0.1);
  background: #fff;
}

.selected-text {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.chevron-icon {
  width: 12px;
  height: 8px;
  color: #1D1D1F;
  transition: transform 0.3s cubic-bezier(0.19, 1, 0.22, 1);
  flex-shrink: 0;
  margin-left: 8px;
}

.chevron-icon.rotated {
  transform: rotate(180deg);
}

.dropdown-menu {
  position: absolute;
  top: calc(100% + 8px);
  left: 0;
  right: 0;
  background: #FFFFFF;
  border: 1px solid #E5E5E5;
  border-radius: 16px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  overflow: hidden;
  z-index: 1000;
  max-height: 300px;
  overflow-y: auto;
}

.dropdown-menu::-webkit-scrollbar {
  width: 8px;
}

.dropdown-menu::-webkit-scrollbar-track {
  background: #F5F5F7;
}

.dropdown-menu::-webkit-scrollbar-thumb {
  background: #D2D2D7;
  border-radius: 4px;
}

.dropdown-menu::-webkit-scrollbar-thumb:hover {
  background: #B0B0B5;
}

.dropdown-item {
  height: 55px;
  padding: 0 16px;
  cursor: pointer;
  transition: background 0.15s ease;
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 16px;
  font-weight: 500;
  color: #1D1D1F;
  border-bottom: 1px solid #F5F5F7;
}

.dropdown-item:last-child {
  border-bottom: none;
}

.dropdown-item:hover {
  background: #F5F5F7;
}

.dropdown-item.selected {
  background: #F5F5F7;
  color: #0071E3;
}

.check-icon {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
  margin-left: 8px;
}

/* 下拉动画 */
.dropdown-enter-active {
  animation: dropdownSlide 0.3s cubic-bezier(0.19, 1, 0.22, 1);
}

.dropdown-leave-active {
  animation: dropdownSlide 0.2s cubic-bezier(0.19, 1, 0.22, 1) reverse;
}

@keyframes dropdownSlide {
  from {
    opacity: 0;
    transform: translateY(-10px) scale(0.98);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

/* 移动端适配 */
@media (max-aspect-ratio: 1/1) {
  .select-trigger {
    height: 45px;
    padding: 0 0.8rem;
    border-radius: 12px;
    font-size: 0.85rem;
  }
  
  .dropdown-menu {
    border-radius: 12px;
    max-height: 240px;
  }
  
  .dropdown-item {
    height: 45px;
    padding: 0 0.8rem;
    font-size: 0.85rem;
  }
  
  .chevron-icon {
    width: 10px;
    height: 7px;
  }
  
  .check-icon {
    width: 14px;
    height: 14px;
  }
}
</style>
