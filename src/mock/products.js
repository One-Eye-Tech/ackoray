/**
 * 临时 mock 产品数据（用于前端本地展示）
 * 说明：
 * - 字段尽量对齐后端返回结构（CatalogSection / ProductDetail / Admin 产品编辑会用到）
 * - 图片使用 public/assets/images 下的静态资源
 */

const COLORS = {
  black: { id: 1, name: 'BLACK' },
  white: { id: 2, name: 'WHITE' },
  gray: { id: 3, name: 'GRAY' },
}

const SIZES = {
  s: { id: 101, name: 'S' },
  m: { id: 102, name: 'M' },
  l: { id: 103, name: 'L' },
  xl: { id: 104, name: 'XL' },
}

/**
 * @typedef {Object} MockProduct
 * @property {number} id
 * @property {string} name
 * @property {number} priceR
 * @property {number} inventory
 * @property {boolean} onShelves
 * @property {'MALE'|'FEMALE'|'UNISEX'} gender
 * @property {string} description
 * @property {string} shortDescription
 * @property {string} mainImageUrl
 * @property {Array<{id:number,url:string,displayOrder:number}>} images
 * @property {number|null} mainImageId
 * @property {Array<{id:number,color:Object,size:Object,stockQuantity:number,isActive:boolean}>} variants
 */

/** @type {MockProduct[]} */
export const mockProducts = [
  {
    id: 1,
    name: 'Merino Ultralight Tee',
    priceR: 299.0,
    inventory: 1000,
    onShelves: true,
    gender: 'MALE',
    description: '17.5μm Ultra-fine Merino. Moisture-wicking, lightweight, and comfortable for travel.',
    shortDescription: '17.5μm Ultra-fine Merino. Moisture-wicking.',
    // 对齐数据库字段：main_image_url（mock 使用本地静态资源）
    mainImageUrl: '/assets/products/man_b.png',
    mainImageId: 11,
    images: [
      { id: 11, url: '/assets/products/man_b.png', displayOrder: 0 },
    ],
    variants: [
      { id: 1001, color: COLORS.white, size: SIZES.s, stockQuantity: 1000, isActive: true },
      { id: 1002, color: COLORS.white, size: SIZES.m, stockQuantity: 1000, isActive: true },
      { id: 1003, color: COLORS.white, size: SIZES.l, stockQuantity: 1000, isActive: true },
      { id: 1004, color: COLORS.white, size: SIZES.xl, stockQuantity: 1000, isActive: true },
    ],
  },
  {
    id: 3,
    name: 'Merino Ultralight Tee',
    priceR: 299.0,
    inventory: 1000,
    onShelves: true,
    gender: 'FEMALE',
    description: '17.5μm Ultra-fine Merino. Moisture-wicking, lightweight, and comfortable for travel.',
    shortDescription: '17.5μm Ultra-fine Merino. Moisture-wicking.',
    mainImageUrl: '/assets/products/woman_b.png',
    mainImageId: 31,
    images: [
      { id: 31, url: '/assets/products/woman_b.png', displayOrder: 0 },
    ],
    variants: [
      { id: 3001, color: COLORS.white, size: SIZES.s, stockQuantity: 1000, isActive: true },
      { id: 3002, color: COLORS.white, size: SIZES.m, stockQuantity: 1000, isActive: true },
      { id: 3003, color: COLORS.white, size: SIZES.l, stockQuantity: 1000, isActive: true },
      { id: 3004, color: COLORS.white, size: SIZES.xl, stockQuantity: 1000, isActive: true },
    ],
  },
  {
    id: 4,
    name: 'Merino Ultralight Tee',
    priceR: 299.0,
    inventory: 1000,
    onShelves: true,
    gender: 'MALE',
    description: '17.5μm Ultra-fine Merino. Moisture-wicking, lightweight, and comfortable for travel.',
    shortDescription: '17.5μm Ultra-fine Merino. Moisture-wicking.',
    mainImageUrl: '/assets/products/man_g.png',
    mainImageId: 41,
    images: [
      { id: 41, url: '/assets/products/man_g.png', displayOrder: 0 },
    ],
    variants: [
      { id: 4001, color: COLORS.gray, size: SIZES.s, stockQuantity: 1000, isActive: true },
      { id: 4001, color: COLORS.gray, size: SIZES.m, stockQuantity: 1000, isActive: true },
      { id: 4001, color: COLORS.gray, size: SIZES.l, stockQuantity: 1000, isActive: true },
      { id: 4001, color: COLORS.gray, size: SIZES.xl, stockQuantity: 1000, isActive: true },
    ],
  },
  {
    id: 5,
    name: 'Merino Ultralight Tee',
    priceR: 299.0,
    inventory: 1000,
    onShelves: true,
    gender: 'FEMALE',
    description: '17.5μm Ultra-fine Merino. Moisture-wicking, lightweight, and comfortable for travel.',
    shortDescription: '17.5μm Ultra-fine Merino. Moisture-wicking.',
    mainImageUrl: '/assets/products/woman_g.png',
    mainImageId: 51,
    images: [{ id: 51, url: '/assets/products/woman_g.png', displayOrder: 0 }],
    variants: [
      { id: 5001, color: COLORS.gray, size: SIZES.s, stockQuantity: 1000, isActive: true },
      { id: 5002, color: COLORS.gray, size: SIZES.m, stockQuantity: 1000, isActive: true },
      { id: 5003, color: COLORS.gray, size: SIZES.l, stockQuantity: 1000, isActive: true },
      { id: 5004, color: COLORS.gray, size: SIZES.xl, stockQuantity: 1000, isActive: true },
    ],
  },
]

export function findMockProductById(id) {
  const pid = Number(id)
  return mockProducts.find(p => p.id === pid) || null
}

export function filterMockProducts({ onShelves, gender, q } = {}) {
  const query = (q || '').trim().toLowerCase()
  return mockProducts.filter(p => {
    if (typeof onShelves === 'boolean' && p.onShelves !== onShelves) return false
    if (gender && String(p.gender).toUpperCase() !== String(gender).toUpperCase()) return false
    if (query) {
      const hay = `${p.name} ${p.shortDescription || ''} ${p.description || ''}`.toLowerCase()
      if (!hay.includes(query)) return false
    }
    return true
  })
}

export function paginate(list, { page = 0, size = 20 } = {}) {
  const p = Math.max(0, Number(page) || 0)
  const s = Math.max(1, Number(size) || 20)
  const start = p * s
  const end = start + s
  const content = list.slice(start, end)
  return {
    content,
    page: p,
    size: s,
    totalElements: list.length,
    totalPages: Math.ceil(list.length / s),
  }
}


