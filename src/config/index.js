/**
 * 全局配置文件
 * 统一管理项目中的配置项
 */

/**
 * API 基础 URL
 *
 * 现在统一使用「相对路径」，不再在前端写死 IP。
 * - 开发环境：通过 Vite dev server 的 proxy 把 `/api` 转发到后端
 * - 生产环境：通过 Nginx（或其他网关）把 `/api` 转发到后端
 *
 * 这样：
 * - 浏览器始终只访问当前页面同源的 `/api/...`，不会出现手机访问不了后端 IP/端口的问题
 * - 也可以避免因为 Origin 不同导致的 CORS 问题（由 dev server / 网关统一处理）
 */
export const BASE_URL = '';

/**
 * WebSocket基础URL
 * 用于聊天功能的WebSocket连接
 */
export const WS_BASE_URL = import.meta.env.MODE === 'development' 
  ? 'http://192.168.31.46:8081'  // WebSocket 仍然使用后端实际地址，如有需要可单独改为反向代理
  : '';

/**
 * 其他配置项可以在这里添加
 * 例如：超时时间、默认分页大小等
 */
export const CONFIG = {
  REQUEST_TIMEOUT: 60000, // 请求超时时间（毫秒）
  PAGE_SIZE: 20, // 默认分页大小
  UPLOAD_MAX_SIZE: 10 * 1024 * 1024, // 上传文件最大大小（10MB）
};

export default {
  BASE_URL,
  WS_BASE_URL,
  CONFIG
};
