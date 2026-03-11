<template>
  <div class="admin-module-container product-management-table">
    <div class="toolbar">
      <h2 class="module-title">产品管理</h2>
      <button @click="openAddProductModal" class="btn btn-primary-outline">
        <i class="fas fa-plus"></i> 添加新产品
      </button>
    </div>
    <div class="search-bar-container">
      <input type="text" v-model="searchQuery" placeholder="按产品名称搜索..." class="search-input">
    </div>
    <table>
      <thead>
        <tr>
          <th>ID</th>
          <th>主图</th>
          <th>名称</th>
          <th>价格 (元)</th>
          <th>库存</th>
          <th>状态</th>
          <th>创建时间</th>
          <th>操作</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="product in filteredProducts" :key="product.id">
          <td>{{ product.id }}</td>
          <td>
            <img :src="getFullImageUrl(product.mainImageUrl) || defaultProductImage" alt="主图" class="table-product-image">
          </td>
          <td>{{ product.name }}</td>
          <td>{{ product.priceR ? product.priceR.toFixed(2) : '0.00' }} RMB</td>
          <td>{{ product.inventory }}</td>
          <td>
            <span class="status-badge" :class="getStatusClass(product.onShelves)">{{ product.onShelves ? '已上架' : '未上架' }}</span>
          </td>
          <td>{{ formatDateTime(product.createdTime) }}</td>
          <td>
            <button @click="confirmToggleProductStatus(product)" class="btn btn-outline btn-sm">
              {{ product.onShelves ? '下架' : '上架' }}
            </button>
            <button @click="openEditProductModal(product)" class="btn btn-outline btn-sm">编辑</button>
            <button @click="confirmDeleteProduct(product.id)" class="btn btn-outline btn-sm btn-danger-outline">删除</button>
          </td>
        </tr>
        <tr v-if="loading">
          <td colspan="8" class="text-center">加载中...</td>
        </tr>
        <tr v-if="!loading && filteredProducts.length === 0 && products.length > 0">
          <td colspan="8" class="text-center">未找到匹配的产品</td>
        </tr>
        <tr v-if="!loading && products.length === 0">
          <td colspan="8" class="text-center">没有产品数据</td>
        </tr>
      </tbody>
    </table>

    <div v-if="showProductModal" class="modal-overlay">
      <div class="modal-content">
        <h3 class="modal-title">{{ editingProduct ? '编辑产品' : '添加新产品' }}</h3>
        <form @submit.prevent="saveProduct" class="modal-form">
          <div class="form-group">
            <label for="productName">产品名称</label>
            <input type="text" id="productName" v-model="currentProduct.name" required>
          </div>
          <div class="form-group">
            <label for="productPrice">价格</label>
            <input type="number" id="productPrice" v-model.number="currentProduct.priceR" step="0.01" required>
          </div>
          <div class="form-group">
            <label for="productStock">库存</label>
            <input type="number" id="productStock" v-model.number="currentProduct.inventory" required>
          </div>
          <div class="form-group">
            <label for="productOnShelves">上架状态</label>
            <select id="productOnShelves" v-model="currentProduct.onShelves">
              <option :value="true">已上架</option>
              <option :value="false">未上架</option>
            </select>
          </div>
          <div class="form-group">
            <label for="productGender">性别/款式</label>
            <select id="productGender" v-model="currentProduct.gender">
              <option value="">请选择</option>
              <option value="MALE">男款</option>
              <option value="FEMALE">女款</option>
              <option value="UNISEX">通用</option>
            </select>
          </div>
          <div class="form-group">
            <label for="productDescription">产品描述</label>
            <textarea id="productDescription" v-model="currentProduct.description" rows="3"></textarea>
          </div>
          <div class="form-group">
            <label for="productShortDescription">简短描述</label>
            <input type="text" id="productShortDescription" v-model="currentProduct.shortDescription">
          </div>
          
          <div class="form-group">
            <label for="mainImage">主图</label>
            <input type="file" id="mainImage" @change="handleMainImageUpload" accept="image/*">
            <div v-if="mainImagePreview" class="image-preview-container">
              <img :src="getFullImageUrl(mainImagePreview)" alt="主图预览" class="image-preview">
            </div>
          </div>

          <div class="form-group">
            <label>其他图片</label>
            <input type="file" id="otherImages" @change="handleOtherImagesUpload" accept="image/*" multiple>
            <div class="other-images-preview-container">
              <div v-for="(src, index) in combinedOtherImagesPreview" :key="index" class="image-preview-item">
                <img :src="getFullImageUrl(src)" alt="图片预览" class="image-preview">
                <button type="button" @click="removeOtherImage(index)" class="btn-remove-image">&times;</button>
              </div>
            </div>
          </div>
          
          <!-- 产品变体管理区域 -->
          <div class="variant-management-section">
            <h4 class="section-title">产品变体管理</h4>
            <p class="section-description">添加不同的颜色和尺码组合</p>
            
            <div class="variant-table-container" v-if="currentProduct.variants.length > 0">
              <table class="variant-table">
                <thead>
                  <tr>
                    <th>颜色</th>
                    <th>尺码</th>
                    <th>库存</th>
                    <th>状态</th>
                    <th>操作</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="variant in currentProduct.variants" :key="variant.id">
                    <td>{{ getColorName(variant.colorId) }}</td>
                    <td>{{ getSizeName(variant.sizeId) }}</td>
                    <td>{{ variant.stockQuantity }}</td>
                    <td>
                      <span class="status-badge" :class="variant.isActive ? 'status-active' : 'status-banned'">
                        {{ variant.isActive ? '已启用' : '已禁用' }}
                      </span>
                    </td>
                    <td>
                      <div class="variant-actions">
                        <button type="button" @click="editVariant(variant)" class="btn btn-sm btn-outline">编辑</button>
                        <button type="button" @click="deleteVariant(variant.id)" class="btn btn-sm btn-danger-outline">删除</button>
                      </div>
                    </td>
                  </tr>
                </tbody>
                <tfoot>
                  <tr>
                    <td colspan="2" class="total-label">总库存：</td>
                    <td colspan="3" class="total-value">{{ totalInventory }}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
            <div v-else class="no-variants-message">
              尚未添加任何产品变体。点击下方按钮添加颜色和尺码组合。
            </div>
            
            <button type="button" @click="showVariantForm = !showVariantForm; resetVariantForm()" class="btn btn-outline variant-add-btn">
              {{ showVariantForm ? '取消添加' : '添加变体' }}
            </button>
            
            <!-- 变体添加/编辑表单 -->
            <div v-if="showVariantForm" class="variant-form">
              <h5 class="variant-form-title">{{ currentVariant.id ? '编辑变体' : '添加新变体' }}</h5>
              
              <div class="form-group-inline">
                <div class="form-group">
                  <label for="variantColor">颜色</label>
                  <div class="color-select-container">
                    <select id="variantColor" v-model="currentVariant.colorId" required>
                      <option value="">请选择颜色</option>
                      <option v-for="color in colors" :key="color.id" :value="color.id">
                        {{ color.name }}
                      </option>
                    </select>
                  </div>
                </div>
                
                <div class="form-group">
                  <label for="variantSize">尺码</label>
                  <select id="variantSize" v-model="currentVariant.sizeId" required>
                    <option value="">请选择尺码</option>
                    <option v-for="size in sizes" :key="size.id" :value="size.id">
                      {{ size.name }}
                    </option>
                  </select>
                </div>
              </div>
              
              <div class="form-group-inline">
                <div class="form-group">
                  <label for="variantStock">库存数量</label>
                  <input type="number" id="variantStock" v-model.number="currentVariant.stockQuantity" min="0" required>
                </div>
                
                <div class="form-group checkbox-group">
                  <label class="checkbox-label">
                    <input type="checkbox" v-model="currentVariant.isActive">
                    <span>启用此变体</span>
                  </label>
                </div>
              </div>
              
              <div class="variant-form-actions">
                <button type="button" @click="addOrUpdateVariant" class="btn btn-primary">
                  {{ currentVariant.id ? '更新变体' : '添加变体' }}
                </button>
                <button type="button" @click="resetVariantForm(); showVariantForm = false" class="btn btn-outline">取消</button>
              </div>
            </div>
          </div>

          <div class="modal-actions">
            <button type="button" @click="closeProductModal" class="btn btn-outline">取消</button>
            <button type="submit" class="btn btn-primary">保存产品</button>
          </div>
        </form>
      </div>
    </div>

    <!-- Confirmation dialogs now use native browser confirm -->

  </div>
</template>

<script setup>
import { ref, onMounted, reactive, watch, computed, onUnmounted } from 'vue';
import { 
  uploadTemporaryProductImage,
  createProduct,
  updateProduct,
  getProducts,
  getProductById,
  deleteProduct as deleteProductApi,
  updateProductStatus
} from '@/api/product';
import { getAllColors } from '@/api/color';
import { getAllSizes } from '@/api/size';
import { BASE_URL } from '@/config';

const defaultProductImage = 'https://via.placeholder.com/60x60.png?text=Img';

// 将相对URL转换为完整URL
const getFullImageUrl = (url) => {
  if (!url) return null;
  if (url.startsWith('http')) return url;
  return `${BASE_URL}${url}`;
};
const products = ref([]);
const loading = ref(true);
const showProductModal = ref(false);
const editingProduct = ref(null);
const searchQuery = ref('');

// 颜色和尺码数据，现在从空数组开始，将在 onMounted 中加载
const colors = ref([]);
const sizes = ref([]);

// 更新 currentProduct 定义，加入变体管理
const currentProduct = reactive({
  id: null,
  name: '',
  priceR: 0, // 对应后端 priceR
  inventory: 0, // 对应后端 inventory，会自动计算自变体总和
  onShelves: true, // 对应后端 onShelves（true为'已上架'）
  gender: '', // 产品性别/款式 (MALE-男款, FEMALE-女款, UNISEX-通用)
  description: '',
  shortDescription: '', // 添加简短描述
  // 图片相关属性
  mainImageUrl: '', // 主图 URL（后端需要）
  mainImageUploaded: null, // 存储已上传主图的信息 { id: Long, url: String }
  otherImagesUploaded: [], // 存储已上传其他图片的信息 [{ id: Long, url: String }]
  mainImageFile: null, // 存储选择的主图文件对象
  otherImageFiles: [], // 存储选择的其他图片文件对象
  imageIds: [], // 存储所有图片ID
  mainImageId: null, // 存储主图ID
  
  // 变体相关属性
  variants: [], // 产品变体列表，格式：[{ colorId, sizeId, stockQuantity, isActive }]
});

// 变体管理相关状态
const showVariantForm = ref(false);
const currentVariant = reactive({
  id: null,
  colorId: null,
  sizeId: null,
  stockQuantity: 1,
  isActive: true
});

// 用于监控库存总计
const totalInventory = computed(() => {
  if (!currentProduct.variants || currentProduct.variants.length === 0) {
    return 0;
  }
  let total = 0;
  currentProduct.variants.forEach(variant => {
    if (variant.isActive) {
      total += parseInt(variant.stockQuantity) || 0;
    }
  });
  return total;
});

// 监听总库存变化，自动更新inventory字段
watch(totalInventory, (newTotal) => {
  currentProduct.inventory = newTotal;
});

// 检查变体是否已存在
const variantExists = (colorId, sizeId) => {
  return currentProduct.variants.some(
    v => v.colorId === colorId && v.sizeId === sizeId
  );
};

// 通过ID获取颜色名称
const getColorName = (colorId) => {
  if (!colorId) return '未选择';
  const color = colors.value.find(c => c.id === colorId);
  return color ? color.name : '未知颜色';
};

// 通过ID获取尺码名称
const getSizeName = (sizeId) => {
  if (!sizeId) return '未选择';
  const size = sizes.value.find(s => s.id === sizeId);
  return size ? size.name : '未知尺码';
};

// 添加或更新变体
const addOrUpdateVariant = () => {
  if (!currentVariant.colorId) {
    alert('请选择颜色');
    return;
  }
  
  if (!currentVariant.sizeId) {
    alert('请选择尺码');
    return;
  }
  
  if (!currentVariant.stockQuantity || currentVariant.stockQuantity < 0) {
    alert('请输入有效的库存数量');
    return;
  }

  // 如果是编辑现有变体
  if (currentVariant.id !== null) {
    const index = currentProduct.variants.findIndex(v => v.id === currentVariant.id);
    if (index !== -1) {
      // 更新变体前检查颜色尺码组合是否与其他变体重复
      const hasConflict = currentProduct.variants.some(
        v => v.id !== currentVariant.id && 
             v.colorId === currentVariant.colorId && 
             v.sizeId === currentVariant.sizeId
      );
      
      if (hasConflict) {
        alert('该颜色和尺码组合与其他变体重复');
        return;
      }
      
      // 更新变体
      currentProduct.variants[index] = { ...currentVariant };
    }
  } else {
    // 检查是否已存在相同颜色和尺码的变体
    if (variantExists(currentVariant.colorId, currentVariant.sizeId)) {
      alert('该颜色和尺码组合已存在');
      return;
    }
    
    // 添加新变体
    const newVariant = { 
      ...currentVariant,
      id: Date.now() // 模拟生成ID，后端会分配真正的ID
    };
    currentProduct.variants.push(newVariant);
  }
  
  // 重置表单
  resetVariantForm();
  showVariantForm.value = false;
};

// 编辑变体
const editVariant = (variant) => {
  currentVariant.id = variant.id;
  currentVariant.colorId = variant.colorId;
  currentVariant.sizeId = variant.sizeId;
  currentVariant.stockQuantity = variant.stockQuantity;
  currentVariant.isActive = variant.isActive;
  showVariantForm.value = true;
};

// 删除变体
const deleteVariant = (variantId) => {
  const index = currentProduct.variants.findIndex(v => v.id === variantId);
  if (index !== -1) {
    currentProduct.variants.splice(index, 1);
  }
};

// 重置变体表单
const resetVariantForm = () => {
  currentVariant.id = null;
  currentVariant.colorId = null;
  currentVariant.sizeId = null;
  currentVariant.stockQuantity = 1;
  currentVariant.isActive = true;
};

const mainImagePreview = ref(null); 
// otherImagesPreview is no longer a simple ref, it's derived from otherImagesUploaded for already uploaded images
// and newlySelectedOtherFilesPreview for files selected in the current modal session before they are "uploaded".

watch(() => currentProduct.mainImageFile, (newFile) => {
  if (newFile instanceof File) {
    const reader = new FileReader();
    reader.onload = (e) => mainImagePreview.value = e.target.result;
    reader.readAsDataURL(newFile);
  } else if (currentProduct.mainImageUploaded && currentProduct.mainImageUploaded.url) {
    mainImagePreview.value = currentProduct.mainImageUploaded.url; // If editing and image exists
  } else {
    mainImagePreview.value = null;
  }
});

watch(() => currentProduct.otherImagesUploaded, (newUploadedImages) => {
  // This watcher is primarily to react if otherImagesUploaded is changed externally or after an edit load.
  // The main source for combined preview will be the computed property.
  // We might not need this specific watcher if combinedOtherImagesPreview handles all cases.
}, { deep: true });

const newlySelectedOtherFilesPreview = ref([]); // Previews for files selected in this session, not yet "uploaded"
watch(() => currentProduct.otherImageFiles, (newFiles) => {
  newlySelectedOtherFilesPreview.value = [];
  if (Array.isArray(newFiles)) {
    newFiles.forEach(file => {
      if (file instanceof File) {
        const reader = new FileReader();
        reader.onload = (e) => newlySelectedOtherFilesPreview.value.push(e.target.result);
        reader.readAsDataURL(file);
      }
    });
  }
}, { deep: true });

const combinedOtherImagesPreview = computed(() => {
  const uploadedImageUrls = currentProduct.otherImagesUploaded.map(img => img.url);
  // newlySelectedOtherFilesPreview contains DataURLs of files selected in the current session but not yet "sent to backend"
  return [...uploadedImageUrls, ...newlySelectedOtherFilesPreview.value];
});

const handleMainImageUpload = async (event) => {
  const file = event.target.files[0];
  if (file) {
    loading.value = true; // 添加上传中状态
    currentProduct.mainImageFile = file; // 保存文件对象供本地预览
    
    try {
      // 立即上传图片到服务器
      const uploadedImageDto = await uploadTemporaryProductImage(file, 0);
      
      // 如果已有主图，从 imageIds 中移除旧的 ID，并从 otherImagesUploaded 中移除
      if (currentProduct.mainImageUploaded && currentProduct.mainImageUploaded.id) {
        const oldMainImageId = currentProduct.mainImageUploaded.id;
        currentProduct.imageIds = currentProduct.imageIds.filter(id => id !== oldMainImageId);
        // 从其他图片中移除旧的主图
        currentProduct.otherImagesUploaded = currentProduct.otherImagesUploaded.filter(
          img => img.id !== oldMainImageId
        );
      }
      
      // 更新状态
      currentProduct.mainImageUploaded = uploadedImageDto;
      currentProduct.mainImageId = uploadedImageDto.id;
      currentProduct.mainImageUrl = uploadedImageDto.url; // 同步更新mainImageUrl
      mainImagePreview.value = uploadedImageDto.url;
      
      // 将该图片ID添加到 imageIds 数组
      if (!currentProduct.imageIds.includes(uploadedImageDto.id)) {
        currentProduct.imageIds.push(uploadedImageDto.id);
      }
      
      // 确保主图不会出现在其他图片列表中
      currentProduct.otherImagesUploaded = currentProduct.otherImagesUploaded.filter(
        img => img.id !== uploadedImageDto.id
      );
      
      currentProduct.mainImageFile = null; // 清空文件对象
    } catch (error) {
      console.error("主图上传失败:", error);
      alert("主图上传失败，请重试。");
      currentProduct.mainImageFile = null;
      mainImagePreview.value = currentProduct.mainImageUploaded ? currentProduct.mainImageUploaded.url : null;
    } finally {
      loading.value = false; // 无论成功或失败都结束加载状态
      event.target.value = null; // 清空文件输入
    }
  }
};

const handleOtherImagesUpload = async (event) => {
  const files = Array.from(event.target.files);
  if (!files.length) return;
  
  // 移除数量限制
  // const currentTotalOtherImages = currentProduct.otherImagesUploaded.length;
  // const MAX_OTHER_IMAGES = 4; // 硬编码最大数量限制
  // const availableSlots = MAX_OTHER_IMAGES - currentTotalOtherImages;
  
  // if (availableSlots <= 0) {
  //   alert("您最多只能上传4张其他图片");
  //   event.target.value = null; // 清空文件选择
  //   return;
  // }
  
  // 如果选择的文件超过可用数量，截取可用数量的文件并提醒用户
  // let filesToProcess = files;
  // if (files.length > availableSlots) {
  //   filesToProcess = files.slice(0, availableSlots);
  //   alert(`您选择了${files.length}张图片，但只能再上传${availableSlots}张。系统将只处理前${availableSlots}张图片。`);
  // }
  
  loading.value = true; // 添加上传中状态
  
  try {
    for (const file of files) {
      try {
        // 计算显示顺序，主图通常为 0，其他图片从 1 开始
        const displayOrder = currentProduct.otherImagesUploaded.length + 1;
        
        // 上传图片到服务器
        const uploadedImageDto = await uploadTemporaryProductImage(file, displayOrder);
        
        // 更新状态
        currentProduct.otherImagesUploaded.push(uploadedImageDto);
        
        // 将该图片ID添加到 imageIds 数组
        if (!currentProduct.imageIds.includes(uploadedImageDto.id)) {
          currentProduct.imageIds.push(uploadedImageDto.id);
        }
      } catch (error) {
        console.error(`图片 ${file.name} 上传失败:`, error);
        alert(`图片 ${file.name} 上传失败，请重试。`);
      }
    }
  } finally {
    loading.value = false; // 无论成功或失败都结束加载状态
    event.target.value = null; // 清空文件输入框
  }
};

const removeOtherImage = (indexToRemoveInPreview) => {
  // indexToRemoveInPreview is based on combinedOtherImagesPreview
  const numUploaded = currentProduct.otherImagesUploaded.length;

  let imageIdToRemove = null;

  if (indexToRemoveInPreview < numUploaded) {
    // 移除已上传的图片
    const removedImage = currentProduct.otherImagesUploaded.splice(indexToRemoveInPreview, 1)[0];
    if (removedImage) {
      imageIdToRemove = removedImage.id;
      
      // 如果是本地文件，需要释放URL对象
      if (removedImage.isLocalFile && removedImage.url) {
        URL.revokeObjectURL(removedImage.url);
      }
    }
  } else {
    // 这种情况理论上不应该发生，因为我们直接上传
    console.warn("尝试移除不在已上传列表中的图片");
  }

  if (imageIdToRemove) {
    currentProduct.imageIds = currentProduct.imageIds.filter(id => id !== imageIdToRemove);
    // 如果移除的是主图，清除mainImageId和mainImageUploaded
    if (currentProduct.mainImageId === imageIdToRemove) {
      currentProduct.mainImageId = null;
      currentProduct.mainImageUploaded = null;
      mainImagePreview.value = null; // 清除主图预览
    }
  }
};

const fetchProducts = async () => {
  loading.value = true;
  try {
    // 尝试从API获取产品列表
    console.log('从API获取产品列表...');
    const response = await getProducts();
    // 处理不同的响应格式
    if (response && response.data) {
      products.value = Array.isArray(response.data) ? response.data : (response.data.content || []);
    } else if (Array.isArray(response)) {
      products.value = response;
    } else if (response && response.content) {
      products.value = response.content;
    } else {
      products.value = [];
    }
    console.log('产品数据已从API加载:', products.value);
  } catch (error) {
    console.error('获取产品列表失败:', error);
    products.value = [];
  } finally {
    loading.value = false;
  }
};

const filteredProducts = computed(() => {
  if (!searchQuery.value) {
    return products.value;
  }
  return products.value.filter(product =>
    product.name.toLowerCase().includes(searchQuery.value.toLowerCase())
  );
});

const resetCurrentProduct = () => {
  Object.assign(currentProduct, {
    id: null,
    name: '',
    priceR: 0,
    inventory: 0,
    onShelves: true,
    gender: '',
    description: '',
    shortDescription: '',
    mainImageUrl: '',
    mainImageUploaded: null,
    otherImagesUploaded: [],
    mainImageFile: null,
    otherImageFiles: [],
    imageIds: [],
    mainImageId: null,
    variants: []
  });
  mainImagePreview.value = null;
  newlySelectedOtherFilesPreview.value = [];
  
  // 重置变体表单
  resetVariantForm();
  showVariantForm.value = false;
  
  // 重置文件输入框
  const mainImageInput = document.getElementById('mainImage');
  if (mainImageInput) mainImageInput.value = null;
  const otherImagesInput = document.getElementById('otherImages');
  if (otherImagesInput) otherImagesInput.value = null;
};

const openAddProductModal = () => {
  editingProduct.value = null;
  resetCurrentProduct();
  showProductModal.value = true;
};

const openEditProductModal = async (product) => {
  try {
    loading.value = true;
    
    // 调用详情接口获取完整的产品信息（包括完整的variants）
    const response = await getProductById(product.id);
    const fullProduct = response.data || response;
    
    console.log('获取到的完整产品数据:', fullProduct);
    
    editingProduct.value = fullProduct;
    
    // Deep copy for plain data. For images, we'll handle them specially.
    currentProduct.id = fullProduct.id;
    currentProduct.name = fullProduct.name;
    currentProduct.priceR = fullProduct.priceR;
    currentProduct.inventory = fullProduct.inventory;
    currentProduct.onShelves = fullProduct.onShelves;
    currentProduct.gender = fullProduct.gender || '';
    currentProduct.description = fullProduct.description;
    currentProduct.shortDescription = fullProduct.shortDescription || '';
    currentProduct.mainImageUrl = fullProduct.mainImageUrl || '';
    
    // 加载变体数据，将后端返回的color和size对象转换为colorId和sizeId
    console.log('原始产品变体数据:', fullProduct.variants);
    currentProduct.variants = fullProduct.variants ? fullProduct.variants.map(v => {
      console.log('处理变体:', v);
      return {
        id: v.id,
        colorId: v.color?.id || null,
        sizeId: v.size?.id || null,
        stockQuantity: v.stockQuantity,
        isActive: v.isActive
      };
    }) : [];
    console.log('转换后的变体数据:', currentProduct.variants);

  // Reset image states before loading existing ones
  currentProduct.mainImageFile = null;
  currentProduct.otherImageFiles = [];
  currentProduct.mainImageUploaded = null;
  currentProduct.otherImagesUploaded = [];
  currentProduct.imageIds = [];
  currentProduct.mainImageId = null;
  mainImagePreview.value = null;
  newlySelectedOtherFilesPreview.value = [];

  // Load existing images from fullProduct data
  // 先处理主图，确保主图ID被正确设置
  if (fullProduct.mainImageId) {
    // 如果主图ID存在，尝试从 images 数组中找到对应的图片
    const mainImg = fullProduct.images?.find(img => img.id === fullProduct.mainImageId);
    if (mainImg) {
      currentProduct.mainImageUploaded = { id: mainImg.id, url: mainImg.url || mainImg.imageUrl };
      currentProduct.mainImageId = mainImg.id;
      mainImagePreview.value = mainImg.url || mainImg.imageUrl;
    } else if (fullProduct.mainImageUrl) {
      // 如果主图不在 images 数组中，但 mainImageUrl 存在，使用 mainImageId 和 mainImageUrl
      currentProduct.mainImageUploaded = { id: fullProduct.mainImageId, url: fullProduct.mainImageUrl };
      currentProduct.mainImageId = fullProduct.mainImageId;
      mainImagePreview.value = fullProduct.mainImageUrl;
    }
    // 将主图ID添加到 imageIds
    if (currentProduct.mainImageId && !currentProduct.imageIds.includes(currentProduct.mainImageId)) {
      currentProduct.imageIds.push(currentProduct.mainImageId);
    }
  } else if (fullProduct.mainImageUrl) {
    // 如果只有 mainImageUrl 但没有 mainImageId，尝试通过 URL 匹配找到对应的图片
    const mainImgByUrl = fullProduct.images?.find(img => 
      (img.url === fullProduct.mainImageUrl) || (img.imageUrl === fullProduct.mainImageUrl)
    );
    if (mainImgByUrl) {
      currentProduct.mainImageUploaded = { id: mainImgByUrl.id, url: mainImgByUrl.url || mainImgByUrl.imageUrl };
      currentProduct.mainImageId = mainImgByUrl.id;
      mainImagePreview.value = mainImgByUrl.url || mainImgByUrl.imageUrl;
      if (!currentProduct.imageIds.includes(mainImgByUrl.id)) {
        currentProduct.imageIds.push(mainImgByUrl.id);
      }
    } else {
      // 如果找不到匹配的图片，只设置预览URL，不设置ID
      mainImagePreview.value = fullProduct.mainImageUrl;
    }
  }

  // 加载其他图片，确保排除主图
  if (fullProduct.images && Array.isArray(fullProduct.images)) {
    currentProduct.otherImagesUploaded = fullProduct.images
      .filter(img => {
        // 排除主图：通过ID或URL匹配
        if (currentProduct.mainImageId && img.id === currentProduct.mainImageId) {
          return false;
        }
        if (currentProduct.mainImageUploaded && 
            (img.url === currentProduct.mainImageUploaded.url || 
             img.imageUrl === currentProduct.mainImageUploaded.url)) {
          return false;
        }
        return true;
      })
      .map(img => ({ id: img.id, url: img.url || img.imageUrl }));
    
    // 将其他图片的ID添加到 imageIds
    currentProduct.otherImagesUploaded.forEach(img => {
      if (!currentProduct.imageIds.includes(img.id)) {
        currentProduct.imageIds.push(img.id);
      }
    });
  }
  // Ensure imageIds are unique
  currentProduct.imageIds = [...new Set(currentProduct.imageIds)];

  showProductModal.value = true;
  } catch (error) {
    console.error('加载产品详情失败:', error);
    alert('加载产品详情失败，请重试');
  } finally {
    loading.value = false;
  }
};

const closeProductModal = () => {
  cleanupLocalImageUrls();
  showProductModal.value = false;
  editingProduct.value = null;
  resetCurrentProduct();
};

const saveProduct = async () => {
  try {
    if (!currentProduct.name || currentProduct.priceR <= 0) {
      alert('请填写所有必填项，并确保价格有效');
      return;
    }
    
    // 检查是否至少有一个变体
    if (currentProduct.variants.length === 0) {
      alert('请至少添加一个产品变体（颜色和尺码组合）');
      return;
    }

    // 构建要发送到后端的产品数据
    const productDataToSave = {
      name: currentProduct.name,
      shortDescription: currentProduct.shortDescription,
      description: currentProduct.description,
      priceR: currentProduct.priceR,
      inventory: currentProduct.inventory,
      mainImageUrl: currentProduct.mainImageUrl || '', // 使用已设置的mainImageUrl
      onShelves: currentProduct.onShelves,
      gender: currentProduct.gender,
      // 提取其他图片的URL
      otherImageUrls: currentProduct.otherImagesUploaded.map(img => img.url),
      // 映射变体数据
      variants: currentProduct.variants.map(v => ({
        colorId: v.colorId,
        sizeId: v.sizeId,
        stockQuantity: v.stockQuantity,
        isActive: v.isActive
      }))
    };
    
    console.log('准备保存的产品数据:', productDataToSave);
    
    let savedProduct;
    
    if (editingProduct.value) {
      // 更新现有产品
      productDataToSave.id = currentProduct.id;
      savedProduct = await updateProduct(currentProduct.id, productDataToSave);
      console.log('产品更新成功:', savedProduct);
      
      // 更新本地列表中的产品
      const index = products.value.findIndex(p => p.id === savedProduct.id);
      if (index !== -1) {
        products.value.splice(index, 1, savedProduct);
      }
    } else {
      // 创建新产品
      savedProduct = await createProduct(productDataToSave);
      console.log('产品创建成功:', savedProduct);
      
      // 添加新产品到列表头部（假设应该显示最新的产品在前面）
      products.value.unshift(savedProduct);
    }
    
    // 关闭模态框前清理本地图片URL
    cleanupLocalImageUrls();
    closeProductModal();
  } catch (error) {
    console.error('保存产品失败:', error);
    alert(`保存产品失败: ${error.message || '未知错误'}`);
  }
};

// 清理所有本地图片URL
const cleanupLocalImageUrls = () => {
  // 清理主图URL
  if (currentProduct.mainImageUploaded && currentProduct.mainImageUploaded.isLocalFile) {
    URL.revokeObjectURL(currentProduct.mainImageUploaded.url);
  }
  
  // 清理其他图片URL
  currentProduct.otherImagesUploaded.forEach(img => {
    if (img.isLocalFile && img.url) {
      URL.revokeObjectURL(img.url);
    }
  });
};

const deleteProduct = async (productId) => {
  try {
    await deleteProductApi(productId);
    products.value = products.value.filter(p => p.id !== productId);
    console.log(`Product ${productId} deleted`);
    // TODO: Show success message
  } catch (error) {
    console.error('Failed to delete product:', error);
    // TODO: Show error message
  }
};

const toggleProductStatus = async (product) => {
  try {
    const newStatus = !product.onShelves;
    // 调用API更新产品状态
    await updateProductStatus(product.id, newStatus);
    // 更新前端产品列表中的状态
    const index = products.value.findIndex(p => p.id === product.id);
    if (index !== -1) {
      products.value[index].onShelves = newStatus;
    }
    console.log(`Product ${product.id} status updated to ${newStatus ? 'onShelves' : 'offShelves'}`);
    // 可以添加一些用户反馈，例如使用消息提示组件
  } catch (error) {
    console.error('Failed to update product status:', error);
    // TODO: 显示错误消息给用户
  }
};

const formatDateTime = (dateTimeString) => {
  if (!dateTimeString) return '-';
  try {
    return new Date(dateTimeString).toLocaleString('zh-CN', { hour12: false });
  } catch (e) {
    return dateTimeString;
  }
};

const getStatusClass = (onShelves) => {
  if (onShelves) return 'status-active';
  return 'status-banned'; // Assuming '未上架' uses the 'banned' style
};

// 在页面加载时获取颜色和尺码数据
const loadColorsAndSizes = async () => {
  try {
    // 显示加载状态
    loading.value = true;
    
    console.log('开始加载颜色和尺码数据...');
    
    // 尝试从API获取颜色和尺码数据
    const [colorsData, sizesData] = await Promise.allSettled([
      getAllColors(),
      getAllSizes()
    ]);
    
    // 处理颜色数据
    if (colorsData.status === 'fulfilled' && colorsData.value) {
      colors.value = colorsData.value.data || colorsData.value;
      console.log('颜色数据已从API加载:', colors.value);
    } else {
      console.error('无法从API加载颜色数据:', colorsData.reason);
      colors.value = [];
    }
    
    // 处理尺码数据
    if (sizesData.status === 'fulfilled' && sizesData.value) {
      sizes.value = sizesData.value.data || sizesData.value;
      console.log('尺码数据已从API加载:', sizes.value);
    } else {
      console.error('无法从API加载尺码数据:', sizesData.reason);
      sizes.value = [];
    }
  } catch (error) {
    console.error('加载颜色和尺码数据时发生错误:', error);
    colors.value = [];
    sizes.value = [];
  } finally {
    loading.value = false;
  }
};

onMounted(async () => {
  try {
    await loadColorsAndSizes();
    await fetchProducts();
  } catch (error) {
    console.error('初始化页面数据失败:', error);
    loading.value = false;
  }
});

// 在组件卸载时清理所有本地URL
onUnmounted(() => {
  // 清理主图URL
  if (currentProduct.mainImageUploaded && currentProduct.mainImageUploaded.isLocalFile) {
    URL.revokeObjectURL(currentProduct.mainImageUploaded.url);
  }
  
  // 清理其他图片URL
  currentProduct.otherImagesUploaded.forEach(img => {
    if (img.isLocalFile && img.url) {
      URL.revokeObjectURL(img.url);
    }
  });
});

// --- Methods with confirmation ---
const confirmToggleProductStatus = (product) => {
  const actionText = product.onShelves ? '下架' : '上架';
  const message = `您确定要${actionText}商品 "${product.name}" 吗？`;
  if (confirm(message)) {
    toggleProductStatus(product);
  }
};

const confirmDeleteProduct = (productId) => {
  const product = products.value.find(p => p.id === productId);
  const productName = product ? product.name : '该商品';
  const message = `您确定要删除商品 "${productName}" 吗？此操作不可恢复！`;
  if (confirm(message)) {
    deleteProduct(productId);
  }
};

// Confirmation functions now use native browser confirm dialogs

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

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.module-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: #1a202c;
  margin: 0;
}

.search-bar-container {
  margin-bottom: 1.5rem; /* Space below search bar, above table */
}

.search-input {
  width: 100%;
  max-width: 400px;
  padding: 0.65rem 0.9rem;
  border: 1px solid #cbd5e0;
  border-radius: 6px;
  background-color: #f7fafc;
  color: #1a202c;
  font-size: 0.9rem;
  box-sizing: border-box;
}

.search-input:focus {
  outline: none;
  border-color: #667eea;
  background-color: #ffffff;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

table {
  width: 100%;
  border-collapse: collapse;
  /* margin-top: 1rem; */ /* 由 toolbar 控制间距 */
}

thead th {
  background-color: #f7fafc;
  color: #4a5568;
  padding: 0.75rem 1rem;
  text-align: left;
  font-weight: 600;
  border-bottom: 2px solid #e2e8f0;
}

tbody td {
  padding: 0.85rem 1rem;
  border-bottom: 1px solid #e2e8f0;
  color: #2d3748;
  vertical-align: middle;
}

.table-product-image {
  width: 50px;
  height: 50px;
  object-fit: cover;
  border-radius: 4px;
  border: 1px solid #e2e8f0;
}

tbody tr:last-child td {
  border-bottom: none;
}

tbody tr:hover td {
  background-color: #edf2f7;
  color: #1a202c;
}

tbody td .btn {
  margin-right: 6px;
}
tbody td .btn:last-child {
  margin-right: 0;
}

.text-center {
  text-align: center;
}

/* 按钮样式 - 与 UserManagement 共享或略作调整 */
.btn {
  padding: 0.5rem 1rem; /* 调整按钮大小 */
  font-size: 0.875rem;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  transition: background-color 0.2s ease, border-color 0.2s ease, color 0.2s ease;
  display: inline-flex; /* 用于图标和文字对齐 */
  align-items: center;
  justify-content: center;
  gap: 0.5rem; /* 图标和文字间距 */
}

.btn-sm {
  padding: 0.3rem 0.7rem;
  font-size: 0.75rem;
  gap: 0.3rem;
}

/* 主按钮 - 紫色渐变 */
.btn-primary {
  color: white;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
}
.btn-primary:hover {
  background: linear-gradient(135deg, #5568d3 0%, #6a3d91 100%);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
  transform: translateY(-1px);
}

/* 主按钮轮廓 - 紫色渐变 */
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

/* 模态框样式 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(15, 23, 42, 0.85);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1050;
  padding: 1rem;
}

.modal-content {
  background-color: #ffffff;
  padding: 2rem;
  border-radius: 12px;
  width: 100%;
  max-width: 600px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
  color: #1a202c;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-title {
  margin-top: 0;
  margin-bottom: 1.5rem;
  font-size: 1.35rem;
  font-weight: 600;
  color: #1a202c;
}

.modal-form .form-group {
  margin-bottom: 1.25rem;
}

.modal-form .form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: #4a5568;
}

.modal-form .form-group input[type="text"],
.modal-form .form-group input[type="number"],
.modal-form .form-group textarea,
.modal-form .form-group input[type="file"],
.modal-form .form-group select {
  width: 100%;
  padding: 0.65rem 0.9rem;
  border: 1px solid #cbd5e0;
  border-radius: 6px;
  background-color: #f7fafc;
  color: #1a202c;
  box-sizing: border-box;
  font-size: 0.9rem;
}

.modal-form .form-group input[type="file"] {
  padding: 0.5rem; /* Adjust padding for file input */
}

.modal-form .form-group input:focus,
.modal-form .form-group textarea:focus,
.modal-form .form-group select:focus {
  outline: none;
  border-color: #667eea;
  background-color: #ffffff;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.image-preview-container, .other-images-preview-container {
  margin-top: 0.75rem;
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.image-preview, .other-images-preview-container .image-preview {
  width: 100px;
  height: 100px;
  object-fit: cover;
  border-radius: 6px;
  border: 1px solid #e2e8f0;
}

.image-preview-item {
  position: relative;
}

.btn-remove-image {
  position: absolute;
  top: -5px;
  right: -5px;
  background-color: rgba(244, 63, 94, 0.8); /* Rose 500 with opacity */
  color: white;
  border: none;
  border-radius: 50%;
  width: 20px;
  height: 20px;
  font-size: 12px;
  line-height: 18px;
  text-align: center;
  cursor: pointer;
  padding: 0;
}
.btn-remove-image:hover {
  background-color: #E11D48; /* Rose 600 */
}

.modal-actions {
  margin-top: 2rem;
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
}

/* 状态徽章 - 与 UserManagement 一致 */
.status-badge {
  padding: 0.25em 0.6em;
  font-size: 0.75rem;
  font-weight: 600;
  border-radius: 0.375rem;
  display: inline-block;
}

.status-active {
  background-color: rgba(16, 185, 129, 0.2);
  color: #10B981;
}

.status-banned {
  background-color: rgba(245, 158, 11, 0.2);
  color: #F59E0B;
}

/* 变体管理样式 */
.variant-management-section {
  margin-top: 2rem;
  padding-top: 1.5rem;
  border-top: 1px solid #e2e8f0;
}

.section-title {
  font-size: 1.1rem;
  margin-bottom: 0.5rem;
  color: #1a202c;
}

.section-description {
  font-size: 0.875rem;
  color: var(--admin-text-secondary);
  margin-bottom: 1rem;
}

.variant-table-container {
  margin-bottom: 1.5rem;
  max-height: 300px;
  overflow-y: auto;
  border-radius: 6px;
  border: 1px solid var(--color-border);
}

.variant-table {
  width: 100%;
  border-collapse: collapse;
}

.variant-table th,
.variant-table td {
  padding: 0.6rem 0.8rem;
  text-align: left;
  border-bottom: 1px solid var(--color-border);
  color: var(--admin-text-secondary);
}

.variant-table th {
  background-color: rgba(51, 65, 85, 0.3);
  font-weight: 500;
}

.variant-table tfoot td {
  font-weight: 500;
  border-bottom: none;
}

.total-label {
  text-align: right;
  color: var(--admin-text-primary);
}

.total-value {
  font-weight: 600;
  color: var(--admin-text-primary);
}

.variant-actions {
  display: flex;
  gap: 0.5rem;
}

.no-variants-message {
  padding: 1rem;
  text-align: center;
  color: var(--admin-text-secondary);
  background-color: rgba(51, 65, 85, 0.1);
  border-radius: 6px;
  margin-bottom: 1rem;
}

.variant-add-btn {
  margin-bottom: 1rem;
}

.variant-form {
  background-color: rgba(51, 65, 85, 0.2);
  border-radius: 6px;
  padding: 1.25rem;
  margin-bottom: 1.5rem;
}

.variant-form-title {
  font-size: 1rem;
  margin-top: 0;
  margin-bottom: 1rem;
  color: var(--admin-text-primary);
}

.form-group-inline {
  display: flex;
  gap: 1rem;
  margin-bottom: 1rem;
}

.form-group-inline .form-group {
  flex: 1;
}

.checkbox-group {
  display: flex;
  align-items: center;
}

.checkbox-label {
  display: flex;
  align-items: center;
  cursor: pointer;
  user-select: none;
}

.checkbox-label input[type="checkbox"] {
  margin-right: 0.5rem;
}

.variant-form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  margin-top: 1.5rem;
}

.color-select-container {
  position: relative;
  width: 100%;
}

.color-indicator {
  display: inline-block;
  width: 1rem;
  height: 1rem;
  margin-right: 0.5rem;
  border-radius: 3px;
  vertical-align: middle;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

/* 自定义Select下拉箭头 */
select {
  appearance: none;
  background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%2394A3B8' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e");
  background-repeat: no-repeat;
  background-position: right 0.7rem center;
  background-size: 1rem;
  padding-right: 2.5rem;
}
</style> 