import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import AuthView from '../views/AuthView.vue'
import OrdersView from '../views/OrdersView.vue'
import ReturnRefundView from '../views/ReturnRefundView.vue'
import SettingsView from '../views/SettingsView.vue'
import CheckoutView from '../views/CheckoutView.vue'
import AdminView from '../views/AdminView.vue'
import AdminOrderDetailPage from '../views/admin/AdminOrderDetailPage.vue'
import ChatManagement from '../views/admin/ChatManagement.vue'
import ChatDetail from '../views/admin/ChatDetail.vue'

const routes = [
  {
    path: '/',
    name: 'home',
    component: HomeView
  },
  {
    path: '/auth',
    name: 'auth',
    component: AuthView
  },
  {
    path: '/orders',
    name: 'orders',
    component: OrdersView,
    meta: { requiresAuth: true } // 需要登录
  },
  {
    path: '/return-refund',
    name: 'return-refund',
    component: ReturnRefundView,
    meta: { requiresAuth: true } // 需要登录
  },
  {
    path: '/settings',
    name: 'settings',
    component: SettingsView,
    meta: { requiresAuth: true } // 需要登录
  },
  {
    path: '/checkout',
    name: 'checkout',
    component: CheckoutView,
    meta: { requiresAuth: true } // 需要登录
  },
  {
    path: '/admin',
    name: 'admin',
    component: AdminView,
    meta: { requiresAuth: true, requiresAdmin: true } // 需要管理员权限
  },
  {
    path: '/admin/orders/:orderId',
    name: 'AdminOrderDetailPage',
    component: AdminOrderDetailPage,
    meta: { requiresAuth: true, requiresAdmin: true } // 需要管理员权限
  },
  {
    path: '/admin/chat',
    name: 'ChatManagement',
    component: ChatManagement,
    meta: { requiresAuth: true, requiresAdmin: true } // 需要管理员权限
  },
  {
    path: '/admin/chat/:id',
    name: 'ChatDetail',
    component: ChatDetail,
    meta: { requiresAuth: true, requiresAdmin: true } // 需要管理员权限
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})

// 路由守卫：检查登录状态和管理员权限
router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('token')
  const user = JSON.parse(localStorage.getItem('user') || '{}')
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth)
  const requiresAdmin = to.matched.some(record => record.meta.requiresAdmin)
  
  if (requiresAuth && !token) {
    // 需要登录但没有token，跳转到登录页
    next({ name: 'auth' })
  } else if (requiresAdmin && user.roleId !== 2) {
    // 需要管理员权限但不是管理员，跳转到首页
    next({ name: 'home' })
  } else if (to.name === 'auth' && token) {
    // 已登录用户访问登录页，跳转到首页
    next({ name: 'home' })
  } else {
    // 正常访问
    next()
  }
})

export default router
