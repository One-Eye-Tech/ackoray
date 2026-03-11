<template>
  <div class="admin-module-container attribute-management">
    <h2 class="module-title">属性管理</h2>

    <div class="tabs">
      <button 
        class="tab-button" 
        :class="{ 'active': activeTab === 'colors' }" 
        @click="activeTab = 'colors'"
      >
        颜色管理
      </button>
      <button 
        class="tab-button" 
        :class="{ 'active': activeTab === 'sizes' }" 
        @click="activeTab = 'sizes'"
      >
        尺码管理
      </button>
    </div>

    <div class="tab-content">
      <div v-if="activeTab === 'colors'" class="color-management-section">
        <div class="section-toolbar">
          <h3>颜色列表</h3>
          <button @click="openAddColorModal" class="btn btn-primary-outline">
            <i class="fas fa-plus"></i> 添加新颜色
          </button>
        </div>
        <div v-if="loadingColors" class="loading-text">加载颜色中...</div>
        <div v-else-if="colors.length === 0" class="empty-state-text">没有颜色数据。</div>
        <table v-else class="attribute-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>名称</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="color in colors" :key="color.id">
              <td>{{ color.id }}</td>
              <td>{{ color.name }}</td>
              <td>
                <button @click="openEditColorModal(color)" class="btn btn-outline btn-sm">编辑</button>
                <button @click="confirmDeleteColor(color.id)" class="btn btn-danger-outline btn-sm">删除</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="activeTab === 'sizes'" class="size-management-section">
        <div class="section-toolbar">
          <h3>尺码列表</h3>
          <button @click="openAddSizeModal" class="btn btn-primary-outline">
            <i class="fas fa-plus"></i> 添加新尺码
          </button>
        </div>
        <div v-if="loadingSizes" class="loading-text">加载尺码中...</div>
        <div v-else-if="sizes.length === 0" class="empty-state-text">没有尺码数据。</div>
        <table v-else class="attribute-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>名称</th>
              <th>排序索引</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="size in sizes" :key="size.id">
              <td>{{ size.id }}</td>
              <td>{{ size.name }}</td>
              <td>{{ size.orderIndex }}</td>
              <td>
                <button @click="confirmDeleteSize(size.id)" class="btn btn-danger-outline btn-sm">删除</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Confirmation dialogs now use native browser confirm -->

    <ColorEditModal 
      :show="showColorModal"
      :colorData="currentColorData"
      :isEditMode="isEditModeColor"
      @close="closeColorModal"
      @save="handleSaveColor"
    />

    <SizeEditModal 
      :show="showSizeModal"
      :sizeData="currentSizeModalData" 
      :isEditMode="isEditModeSize"
      @close="closeSizeModal"
      @save="handleSaveSize"
    />

  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue';
import { getAllColors, createColor, updateColor, deleteColor } from '@/api/color';
import { getAllSizes, createSize, updateSize, deleteSize } from '@/api/size';
import ColorEditModal from '@/views/admin/components/ColorEditModal.vue';
import SizeEditModal from '@/views/admin/components/SizeEditModal.vue';

const activeTab = ref('colors');

// --- Colors State & Logic ---
const colors = ref([]);
const loadingColors = ref(true);
const showColorModal = ref(false);
const currentColorData = ref(null);
const isEditModeColor = ref(false);

const fetchColors = async () => {
  loadingColors.value = true;
  try {
    const response = await getAllColors();
    colors.value = response.data;
  } catch (error) {
    console.error("获取颜色列表失败:", error);
    colors.value = [];
    // TODO: Show error toast to user
    alert('获取颜色列表失败'); 
  } finally {
    loadingColors.value = false;
  }
};

const openAddColorModal = () => {
  isEditModeColor.value = false;
  currentColorData.value = { name: '' }; // Initialize for new color, without value
  showColorModal.value = true;
};

const openEditColorModal = (color) => {
  isEditModeColor.value = true;
  // Only pass id and name, or ensure value is handled if not needed by modal/API
  currentColorData.value = { id: color.id, name: color.name }; 
  showColorModal.value = true;
};

const closeColorModal = () => {
  showColorModal.value = false;
  currentColorData.value = null; // Reset
};

const handleSaveColor = async (colorFormDataFromModal) => {
  // Ensure 'value' is not sent or is handled appropriately if backend expects it
  const colorData = { 
    id: colorFormDataFromModal.id, // For updates
    name: colorFormDataFromModal.name 
    // value: colorFormDataFromModal.value // Explicitly exclude or set to null/undefined if necessary
  };

  try {
    if (isEditModeColor.value) {
      await updateColor(colorData.id, colorData); // Pass payload without 'value'
      alert('颜色更新成功');
    } else {
      await createColor(colorData); // Pass payload without 'value'
      alert('颜色添加成功');
    }
    fetchColors();
    closeColorModal();
  } catch (error) {
    console.error("保存颜色失败:", error);
    alert(`保存颜色失败: ${error.response?.data?.message || error.message}`);
  }
};

// --- Sizes State & Logic ---
const sizes = ref([]);
const loadingSizes = ref(false);
const showSizeModal = ref(false);
const currentSizeModalData = ref(null);
const isEditModeSize = ref(false);

const fetchSizes = async () => {
  loadingSizes.value = true;
  try {
    const response = await getAllSizes();
    sizes.value = response.data;
  } catch (error) {
    console.error("获取尺码列表失败:", error);
    sizes.value = [];
    alert('获取尺码列表失败'); 
  } finally {
    loadingSizes.value = false;
  }
};

const openAddSizeModal = () => {
  isEditModeSize.value = false;
  currentSizeModalData.value = { name: '', orderIndex: 0 };
  showSizeModal.value = true;
};

const closeSizeModal = () => {
  showSizeModal.value = false;
  currentSizeModalData.value = null;
};

const handleSaveSize = async (sizeFormDataFromModal) => {
  const sizeData = { 
    name: sizeFormDataFromModal.name,
    orderIndex: sizeFormDataFromModal.orderIndex
  };

  try {
    await createSize(sizeData); 
    alert('尺码添加成功');
    fetchSizes();
    closeSizeModal();
  } catch (error) {
    console.error("保存尺码失败:", error);
    alert(`保存尺码失败: ${error.response?.data?.message || error.message}`);
  }
};

const confirmDeleteSize = async (sizeId) => {
  const size = sizes.value.find(s => s.id === sizeId);
  if (!size) return;
  
  const message = `您确定要删除尺码 "${size.name}" 吗？此操作可能会影响关联的产品。`;
  if (confirm('确定要删除这个尺码吗？')) {
    try {
      await deleteSize(sizeId);
      sizes.value = sizes.value.filter(s => s.id !== sizeId);
      alert('尺码删除成功');
    } catch (error) {
      console.error("删除尺码失败:", error);
      alert('删除尺码失败');
    }
  }
};

const confirmDeleteColor = async (colorId) => {
  const color = colors.value.find(c => c.id === colorId);
  if (!color) return;
  
  const message = `您确定要删除颜色 "${color.name}" 吗？此操作可能会影响关联的产品。`;
  if (confirm('确定要删除这个颜色吗？')) {
    try {
      await deleteColor(colorId);
      colors.value = colors.value.filter(c => c.id !== colorId);
      alert('颜色删除成功');
    } catch (error) {
      console.error("删除颜色失败:", error);
      alert('删除颜色失败');
    }
  }
};

// Lifecycle hooks
onMounted(() => {
  if (activeTab.value === 'colors') {
    fetchColors();
  } else if (activeTab.value === 'sizes') {
    fetchSizes();
  }
});

// Watch activeTab to load data if needed (optional, or handle in tab click)
watch(activeTab, (newTab) => {
  if (newTab === 'colors' && colors.value.length === 0 && !loadingColors.value) {
    fetchColors();
  } else if (newTab === 'sizes' && sizes.value.length === 0 && !loadingSizes.value) {
    fetchSizes();
  }
});

</script>

<style scoped>
/* 后台管理 - 浅色主题 */
.admin-module-container {
  background-color: #ffffff;
  padding: 1.5rem;
  border-radius: 12px;
  color: #1a202c;
  border: none;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.module-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: #1a202c;
  margin-top: 0;
  margin-bottom: 1.5rem;
}

.tabs {
  display: flex;
  margin-bottom: 1.5rem;
  border-bottom: 1px solid var(--color-border);
}

.tab-button {
  padding: 0.75rem 1.25rem;
  cursor: pointer;
  background-color: transparent;
  border: none;
  color: #718096;
  font-size: 0.95rem;
  font-weight: 500;
  position: relative;
  transition: all 0.2s ease;
}

.tab-button:hover {
  color: #2d3748;
}

.tab-button.active {
  color: #667eea;
  font-weight: 600;
}

.tab-button.active::after {
  content: '';
  position: absolute;
  bottom: -1px;
  left: 0;
  width: 100%;
  height: 2px;
  background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
}

.tab-content {
  /* Styles for the content area if needed */
}

.color-management-section h3,
.size-management-section h3 {
  font-size: 1.2rem;
  margin-bottom: 1rem;
  font-weight: 500;
  color: var(--admin-text-secondary);
}

.section-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.section-toolbar h3 {
  font-size: 1.2rem;
  margin: 0;
  font-weight: 500;
  color: var(--admin-text-secondary);
}

.loading-text,
.empty-state-text {
  text-align: center;
  padding: 2rem;
  color: var(--admin-text-secondary);
}

.attribute-table {
  width: 100%;
  border-collapse: collapse;
}

.attribute-table th {
  background-color: #f7fafc;
  color: #4a5568;
  padding: 0.75rem 1rem;
  text-align: left;
  font-weight: 600;
  border-bottom: 2px solid #e2e8f0;
}

.attribute-table td {
  padding: 0.85rem 1rem;
  border-bottom: 1px solid #e2e8f0;
  color: #2d3748;
  vertical-align: middle;
}

.attribute-table tbody tr:last-child td {
  border-bottom: none;
}

.attribute-table tbody tr:hover td {
  background-color: #edf2f7;
  color: #1a202c;
}

.color-preview {
  display: inline-block;
  width: 20px;
  height: 20px;
  border-radius: 4px;
  margin-right: 8px;
  vertical-align: middle;
  border: 1px solid var(--admin-border-color, #4A5568); /* Slightly darker border for preview */
}

/* Using existing button styles, ensure they are globally available or copied if needed */
.btn {
  padding: 0.5rem 1rem; 
  font-size: 0.875rem;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  transition: background-color 0.2s ease, border-color 0.2s ease, color 0.2s ease;
  display: inline-flex; 
  align-items: center;
  justify-content: center;
  gap: 0.5rem; 
}

.btn-sm {
  padding: 0.3rem 0.7rem;
  font-size: 0.75rem;
  gap: 0.3rem;
}

.btn-primary-outline {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  color: white;
}
.btn-primary-outline i {
  color: white;
  transition: color 0.2s ease;
}
.btn-primary-outline:hover {
  background: linear-gradient(135deg, #5568d3 0%, #6a3d91 100%);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
  transform: translateY(-1px);
}
.btn-primary-outline:hover i {
  color: white;
}

.btn-outline {
  background-color: transparent;
  border: 1px solid #cbd5e0;
  color: #4a5568;
}
.btn-outline:hover {
  border-color: #667eea;
  color: #667eea;
  background-color: rgba(102, 126, 234, 0.05);
}

.btn-danger-outline {
  background-color: transparent;
  border: 1px solid #fc8181;
  color: #e53e3e;
}
.btn-danger-outline:hover {
  border-color: #f56565;
  color: #fff;
  background-color: #e53e3e;
  box-shadow: 0 2px 8px rgba(229, 62, 62, 0.3);
}

</style> 