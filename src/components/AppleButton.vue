<script setup>
defineProps({
  variant: {
    type: String,
    default: 'primary' // primary, secondary
  },
  disabled: Boolean
})
</script>

<template>
  <button
    v-motion
    :initial="{ scale: 1 }"
    :hover="{ scale: 1.02 }"
    :tap="{ scale: 0.96 }"
    :class="['apple-btn', `apple-btn-${variant}`]"
    :disabled="disabled"
  >
    <slot />
  </button>
</template>

<style scoped>
.apple-btn {
  padding: 1rem 1.5rem;
  border-radius: 9999px;
  font-weight: 500;
  font-size: 15px;
  transition: all 0.3s ease;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  border: none;
  cursor: pointer;
}

.apple-btn-primary {
  background: #1d1d1f;
  color: white;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
}

.apple-btn-primary:hover:not(:disabled) {
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
}

.apple-btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.apple-btn-secondary {
  background: #f5f5f7;
  color: #1d1d1f;
}

.apple-btn-secondary:hover {
  background: #e8e8ed;
}
</style>
