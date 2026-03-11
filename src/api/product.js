/**
 * 产品管理API
 */
import { get, post, put, del, patch } from './request';
import { BASE_URL } from '@/config';
import { mockProducts, findMockProductById, filterMockProducts, paginate } from '@/mock/products';

// 开关策略：
// - VITE_USE_MOCK_PRODUCTS=true  => 强制使用 mock
// - VITE_USE_MOCK_PRODUCTS=false => 强制走后端
// - 未设置                         => 开发环境默认使用 mock（避免本地/手机联调时后端不可达导致页面空白）
const MOCK_FLAG = String(import.meta.env.VITE_USE_MOCK_PRODUCTS || '').toLowerCase();
const USE_MOCK_PRODUCTS =
  MOCK_FLAG === 'true' ? true :
  MOCK_FLAG === 'false' ? false :
  Boolean(import.meta.env.DEV);

function asApiResponse(data) {
  // 项目里有的地方期待 { data: ... }，有的地方直接用返回值本身
  return { data };
}

/**
 * 获取产品列表（分页）
 * @param {object} params - 查询参数
 */
export function getProductList(params) {
  if (USE_MOCK_PRODUCTS) {
    const pageData = paginate(mockProducts, params);
    // 兼容 CatalogSection 的解析逻辑：优先放在 data.content
    return Promise.resolve(asApiResponse(pageData));
  }
  const query = new URLSearchParams(params).toString();
  return get(`/api/products?${query}`, { auth: false });
}

/**
 * 获取产品详情
 * @param {number} id - 产品ID
 */
export function getProductById(id) {
  if (USE_MOCK_PRODUCTS) {
    const product = findMockProductById(id);
    if (!product) {
      return Promise.reject(new Error('产品不存在（mock）'));
    }
    return Promise.resolve(asApiResponse(product));
  }
  return get(`/api/products/${id}`, { auth: false });
}

/**
 * 按上架状态获取产品
 * @param {boolean} onShelves - 上架状态
 * @param {object} params - 查询参数
 */
export function getProductsByStatus(onShelves, params) {
  if (USE_MOCK_PRODUCTS) {
    const list = filterMockProducts({ onShelves: Boolean(onShelves) });
    const pageData = paginate(list, params);
    // CatalogSection：如果 response.data 是对象，会取 response.data.content
    return Promise.resolve(asApiResponse(pageData));
  }
  const query = new URLSearchParams(params).toString();
  return get(`/api/products/status/${onShelves}?${query}`, { auth: false });
}

/**
 * 按性别获取产品
 * @param {string} gender - 性别
 * @param {object} params - 查询参数
 */
export function getProductsByGender(gender, params) {
  if (USE_MOCK_PRODUCTS) {
    const list = filterMockProducts({ gender });
    const pageData = paginate(list, params);
    return Promise.resolve(asApiResponse(pageData));
  }
  const query = new URLSearchParams(params).toString();
  return get(`/api/products/gender/${gender}?${query}`, { auth: false });
}

/**
 * 搜索产品
 * @param {object} params - 搜索参数
 */
export function searchProducts(params) {
  if (USE_MOCK_PRODUCTS) {
    const { q, keyword, page, size } = params || {};
    const list = filterMockProducts({ q: q || keyword });
    const pageData = paginate(list, { page, size });
    return Promise.resolve(asApiResponse(pageData));
  }
  const query = new URLSearchParams(params).toString();
  return get(`/api/products/search?${query}`, { auth: false });
}

/**
 * 获取产品变体
 * @param {number} productId - 产品ID
 */
export function getProductVariants(productId) {
  if (USE_MOCK_PRODUCTS) {
    const product = findMockProductById(productId);
    if (!product) return Promise.resolve(asApiResponse([]));
    return Promise.resolve(asApiResponse(product.variants || []));
  }
  return get(`/api/products/${productId}/variants`, { auth: false });
}

/**
 * 创建产品（管理员）
 * @param {object} data - 产品数据
 */
export function createProduct(data) {
  return post('/api/products', data);
}

/**
 * 更新产品（管理员）
 * @param {number} id - 产品ID
 * @param {object} data - 产品数据
 */
export function updateProduct(id, data) {
  return put(`/api/products/${id}`, data);
}

/**
 * 删除产品（管理员）
 * @param {number} id - 产品ID
 */
export function deleteProduct(id) {
  return del(`/api/products/${id}`);
}

/**
 * 更新产品上架状态（管理员）
 * @param {number} id - 产品ID
 * @param {boolean} onShelves - 上架状态
 */
export function updateProductStatus(id, onShelves) {
  // 后端使用@RequestParam，需要URL参数而不是JSON body
  return patch(`/api/products/${id}/status?onShelves=${onShelves}`);
}

/**
 * 添加产品变体（管理员）
 * @param {object} data - 变体数据
 */
export function addProductVariant(data) {
  return post('/api/products/variants', data);
}

/**
 * 更新产品变体（管理员）
 * @param {number} id - 变体ID
 * @param {object} data - 变体数据
 */
export function updateProductVariant(id, data) {
  return put(`/api/products/variants/${id}`, data);
}

/**
 * 删除产品变体（管理员）
 * @param {number} id - 变体ID
 */
export function deleteProductVariant(id) {
  return del(`/api/products/variants/${id}`);
}

/**
 * 获取所有产品（别名，用于管理后台）
 */
export function getProducts() {
  return getProductList({});
}

/**
 * 上传临时产品图片
 * @param {File} file - 图片文件
 * @param {number} displayOrder - 显示顺序
 */
export async function uploadTemporaryProductImage(file, displayOrder = 0) {
  const token = localStorage.getItem('token');
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${BASE_URL}/api/files/upload/product-image`, {
    method: 'POST',
    headers: {
      'Authorization': token ? `Bearer ${token}` : '',
    },
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`上传失败: ${response.statusText}`);
  }

  const result = await response.json();
  // 后端返回 ApiResponse<String>，其中 data 是图片URL字符串
  const imageUrl = result.data || result;
  
  // 返回标准化的图片数据对象，使用URL作为唯一标识
  return {
    id: Date.now(), // 临时ID，用于前端管理
    url: imageUrl,
    displayOrder: displayOrder
  };
}
