<script setup>
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useMotion } from '@vueuse/motion'
import { useI18n } from 'vue-i18n'
import { orderAPI } from '@/api'
import { getMyMessages, getUnreadCount } from '@/api/chat'
import SockJS from 'sockjs-client'
import { Stomp } from '@stomp/stompjs'
import { BASE_URL } from '@/config'

const router = useRouter()
const { t, locale } = useI18n()

// 订单状态映射（后端 -> 前端）
const ORDER_STATUS = {
  PENDING_PAYMENT: 'pending',
  PENDING: 'pending',
  PROCESSING: 'processing',
  SHIPPED: 'shipped',
  DELIVERED: 'delivered',
  COMPLETED: 'delivered', // 后端completed映射为前端delivered
  REFUND_IN_PROGRESS: 'refunding',
  REFUNDED: 'refunded',
  CANCELED: 'canceled'
}

// 状态映射函数
const mapOrderStatus = (backendStatus) => {
  return ORDER_STATUS[backendStatus] || backendStatus.toLowerCase()
}

// 订单数据
const allOrders = ref([])
const loading = ref(false)
const currentPage = ref(0)
const pageSize = ref(20)

// 格式化日期
const formatDate = (timestamp) => {
  const date = new Date(timestamp)
  
  if (locale.value === 'zh') {
    // 中文格式：2025-08-13
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  } else {
    // 英文格式：August 13, 2025
    return date.toLocaleDateString('en-US', { 
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }
}

// 状态管理
const activeTab = ref('all')
const selectedOrder = ref(null)

// 获取订单列表
const fetchOrders = async (status = null) => {
  try {
    loading.value = true
    let res
    
    if (status && status !== 'all') {
      // 按状态获取订单
      const backendStatus = status.toUpperCase()
      res = await orderAPI.getMyOrdersByStatus(backendStatus, {
        page: currentPage.value,
        size: pageSize.value
      })
    } else {
      // 获取所有订单
      res = await orderAPI.getMyOrders({
        page: currentPage.value,
        size: pageSize.value
      })
    }
    
    // 转换订单数据
    const orders = res.data.content.map(order => ({
      id: order.orderNumber,
      orderId: order.id, // 保存原始订单ID用于API调用
      timestamp: new Date(order.orderedTime).getTime(),
      status: mapOrderStatus(order.status),
      total: order.totalAmount,
      items: (order.items || []).map(item => {
        // 判断是否已经是完整URL
        let imgUrl = 'https://via.placeholder.com/300'
        if (item.mainImageUrl) {
          if (item.mainImageUrl.startsWith('http://') || item.mainImageUrl.startsWith('https://')) {
            // 已经是完整URL，直接使用
            imgUrl = item.mainImageUrl
          } else {
            // 相对路径，添加BASE_URL
            imgUrl = `${BASE_URL}${item.mainImageUrl}`
          }
        }
        
        return {
          id: item.productVariantId,
          name: item.productName,
          img: imgUrl,
          price: item.priceAtPurchase,
          quantity: item.quantity
        }
      }),
      tracking: order.trackingNumber || null,
      shippingAddress: `${order.shippingRecipientName} - ${order.shippingPhoneNumber} - ${order.shippingDetailedAddress}`
    }))
    
    allOrders.value = orders
    
  } catch (error) {
    console.error('获取订单失败:', error)
    
    // 处理未登录或token过期
    if (error.status === 403 || error.status === 401) {
      alert(t('common.loginExpired'))
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      router.replace('/auth')
      return
    }
    
    alert(error.message || t('orders.loadOrdersError'))
    allOrders.value = []
  } finally {
    loading.value = false
  }
}

// 标签列表
const tabs = computed(() => [
  'all',
  ORDER_STATUS.PROCESSING,
  ORDER_STATUS.SHIPPED,
  ORDER_STATUS.DELIVERED
])

// 检查是否为管理员
const isAdmin = computed(() => {
  const user = JSON.parse(localStorage.getItem('user') || '{}')
  return user.roleId === 2
})

// 标签引用
const tabRefs = ref([])
const sliderStyle = ref({})
const sliderRef = ref(null)
let sliderMotion = null

// 设置标签引用
const setTabRef = (el, index) => {
  if (el) {
    tabRefs.value[index] = el
  }
}

// 更新滑块位置
const updateSlider = () => {
  const activeIndex = tabs.value.indexOf(activeTab.value)
  if (activeIndex === -1 || !tabRefs.value[activeIndex]) {
    return
  }
  
  const activeEl = tabRefs.value[activeIndex]
  const newStyle = {
    left: `${activeEl.offsetLeft}px`,
    width: `${activeEl.offsetWidth}px`,
    background: '#000'
  }
  
  sliderStyle.value = newStyle
  
  // 使用 motion 动画（只有当 motion 实例存在时）
  if (sliderMotion && sliderMotion.apply) {
    sliderMotion.apply({
      left: parseFloat(newStyle.left),
      width: parseFloat(newStyle.width),
      transition: {
        type: 'spring',
        stiffness: 500,
        damping: 30
      }
    })
  }
}

// 动画控制
const cardRefs = ref([])
const cardMotions = ref([])

// 设置卡片引用
const setCardRef = (el, index) => {
  if (el) {
    cardRefs.value[index] = el
  }
}

// 应用动画
const applyCardAnimations = async () => {
  // 等待多次以确保 DOM 完全更新
  await nextTick()
  await nextTick()
  
  // 清除旧的动画实例
  cardMotions.value.forEach(motion => {
    if (motion && motion.stop) {
      motion.stop()
    }
  })
  cardMotions.value = []
  
  // 为每个卡片应用动画
  filteredOrders.value.forEach((order, index) => {
    const el = cardRefs.value[index]
    if (el) {
      // 先重置到初始状态
      el.style.opacity = '0'
      el.style.transform = 'translateY(40px) scale(0.9)'
      
      // 应用动画
      setTimeout(() => {
        const motion = useMotion(el, {
          initial: {
            opacity: 0,
            y: 40,
            scale: 0.9
          },
          enter: {
            opacity: 1,
            y: 0,
            scale: 1,
            transition: {
              type: 'spring',
              stiffness: 600,
              damping: 18
            }
          }
        })
        
        // 立即应用enter状态
        if (motion && motion.apply) {
          motion.apply('enter')
        }
        
        cardMotions.value.push(motion)
      }, index * 80 + 100)
    }
  })
}

// 监听 activeTab 变化
watch(activeTab, async () => {
  await nextTick()
  updateSlider()
  
  // 重新获取订单
  await fetchOrders(activeTab.value)
  
  // 重置卡片引用
  cardRefs.value = []
  
  // 等待 DOM 更新后应用动画
  await nextTick()
  applyCardAnimations()
})

// 筛选订单（并添加格式化后的日期）
const filteredOrders = computed(() => {
  const orders = activeTab.value === 'all' ? allOrders.value : allOrders.value.filter(o => o.status === activeTab.value)
  return orders.map(order => ({
    ...order,
    date: formatDate(order.timestamp)
  }))
})

// 获取状态徽章样式
const getStatusColors = (status) => {
  if (status === ORDER_STATUS.PENDING) return 'status-pending'
  if (status === ORDER_STATUS.COMPLETED) return 'status-completed'
  if (status === ORDER_STATUS.SHIPPED) return 'status-shipped'
  if (status === ORDER_STATUS.CANCELED) return 'status-canceled'
  return 'status-default'
}

// 打开订单详情
const openOrderDetail = (order) => {
  selectedOrder.value = order
}

// 关闭订单详情
const closeOrderDetail = () => {
  selectedOrder.value = null
}

// Handle refund request
const handleRefund = () => {
  if (!selectedOrder.value) return
  
  // 先保存订单ID
  const orderId = selectedOrder.value.orderId
  
  // 关闭订单详情弹窗
  closeOrderDetail()
  
  // 然后跳转到退货退款页面
  setTimeout(() => {
    router.push({
      path: '/return-refund',
      query: { orderId: orderId }
    })
  }, 300) // 等待关闭动画完成
}

// Handle confirm receipt
const handleConfirmReceipt = async () => {
  const confirmed = confirm(t('orders.confirmReceiptPrompt'))
  if (confirmed && selectedOrder.value) {
    try {
      // 获取订单ID（需要从订单列表中找到原始ID）
      const order = allOrders.value.find(o => o.id === selectedOrder.value.id)
      if (!order) return
      
      // 调用确认收货API
      await orderAPI.confirmDelivery(order.orderId || order.id)
      
      alert(t('orders.confirmReceiptSuccess'))
      
      // 关闭详情并刷新订单列表
      closeOrderDetail()
      await fetchOrders(activeTab.value)
      
    } catch (error) {
      // 处理未登录或token过期
      if (error.status === 403 || error.status === 401) {
        alert(t('common.loginExpired'))
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        router.replace('/auth')
        return
      }
      alert(error.message || t('orders.confirmReceiptError'))
    }
  }
}

// 取消订单
const handleCancelOrder = async () => {
  const confirmed = confirm(t('orders.cancelOrderPrompt'))
  if (confirmed && selectedOrder.value) {
    try {
      // 获取订单ID
      const order = allOrders.value.find(o => o.id === selectedOrder.value.id)
      if (!order) return
      
      // 调用取消订单API
      await orderAPI.cancelOrder(order.orderId || order.id)
      
      alert(t('orders.cancelOrderSuccess'))
      
      // 关闭详情并刷新订单列表
      closeOrderDetail()
      await fetchOrders(activeTab.value)
      
    } catch (error) {
      // 处理未登录或token过期
      if (error.status === 403 || error.status === 401) {
        alert(t('common.loginExpired'))
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        router.replace('/auth')
        return
      }
      alert(error.message || t('orders.cancelOrderError'))
    }
  }
}

// 聊天功能
const isChatOpen = ref(false)
const isClosing = ref(false)
const chatInput = ref('')
const chatMessages = ref([])
const isTyping = ref(false)
const chatWindow = ref(null)
const chatBody = ref(null)
const hasHistoryMessages = ref(false) // 标记是否有历史消息
const unreadCount = ref(0) // 未读消息数

// WebSocket相关
const stompClient = ref(null)
const conversationId = ref(null)
const currentUserId = ref(JSON.parse(localStorage.getItem('user') || '{}').id)

// 拦截浏览器返回按钮，导航到首页
const handlePopState = () => {
  // 重新添加历史状态以继续拦截
  window.history.pushState(null, '', window.location.href)
  // 导航到首页，使用replace避免创建新的历史记录
  router.replace('/')
}

// 移动端滑动手势处理
let touchStartX = 0
let touchStartY = 0
let touchStartTime = 0

const handleTouchStart = (e) => {
  // 只在移动端处理
  if (window.innerWidth > window.innerHeight) return
  
  touchStartX = e.touches[0].clientX
  touchStartY = e.touches[0].clientY
  touchStartTime = Date.now()
}

const handleTouchEnd = (e) => {
  // 只在移动端处理
  if (window.innerWidth > window.innerHeight) return
  
  const touchEndX = e.changedTouches[0].clientX
  const touchEndY = e.changedTouches[0].clientY
  const touchEndTime = Date.now()
  
  const deltaX = touchEndX - touchStartX
  const deltaY = touchEndY - touchStartY
  const deltaTime = touchEndTime - touchStartTime
  
  // 检测右滑手势：
  // 1. 从屏幕左边缘开始（距离左边小于50px）
  // 2. 向右滑动距离大于100px
  // 3. 垂直方向移动小于水平方向移动
  // 4. 滑动时间小于500ms
  if (
    touchStartX < 50 &&
    deltaX > 100 &&
    Math.abs(deltaY) < Math.abs(deltaX) &&
    deltaTime < 500
  ) {
    // 导航到首页
    router.replace('/')
  }
}

// 加载未读消息数
const loadUnreadCount = async () => {
  try {
    const response = await getUnreadCount()
    unreadCount.value = response.data || response || 0
  } catch (error) {
    console.error('加载未读消息数失败:', error)
  }
}

// 切换聊天窗口
const toggleChat = async () => {
  if (!isChatOpen.value) {
    // 打开聊天窗口
    isChatOpen.value = true
    isClosing.value = false
    
    // 重置状态
    hasHistoryMessages.value = false
    chatMessages.value = []
    unreadCount.value = 0 // 清空未读数
    
    // 连接WebSocket
    connectWebSocket()
    
    await nextTick()
    if (chatWindow.value) {
      // 使用 motion 实现弹出动画
      // 参考: gsap.fromTo(win, { scale: 0.8, opacity: 0, y: 20 }, { scale: 1, opacity: 1, y: 0, duration: 0.5, ease: "back.out(1.7)" })
      const chatMotion = useMotion(chatWindow.value, {
        initial: {
          scale: 0.8,
          opacity: 0,
          y: 20
        },
        enter: {
          scale: 1,
          opacity: 1,
          y: 0,
          transition: {
            duration: 500,
            type: 'spring',
            stiffness: 260,
            damping: 20
          }
        }
      })
      
      // 触发进入动画
      chatMotion.variant('enter')
      
      // 滚动到底部
      if (chatBody.value) {
        chatBody.value.scrollTop = chatBody.value.scrollHeight
      }
    }
  } else {
    // 关闭聊天窗口
    if (chatWindow.value) {
      isClosing.value = true
      
      // 使用 motion 实现关闭动画
      // 参考: gsap.to(win, { scale: 0.8, opacity: 0, y: 20, duration: 0.3 })
      const chatMotion = useMotion(chatWindow.value, {
        initial: {
          scale: 1,
          opacity: 1,
          y: 0
        }
      })
      
      // 应用关闭动画
      if (chatMotion && chatMotion.apply) {
        chatMotion.apply({
          scale: 0.8,
          opacity: 0,
          y: 20,
          transition: {
            duration: 300
          }
        })
      }
      
      // 等待动画完成后关闭
      setTimeout(() => {
        isChatOpen.value = false
        isClosing.value = false
      }, 300)
    } else {
      isChatOpen.value = false
      isClosing.value = false
    }
  }
}

// 连接WebSocket
const connectWebSocket = async () => {
  try {
    const token = localStorage.getItem('token')
    if (!token || !currentUserId.value) {
      console.error('用户未登录')
      return
    }

    // 连接WebSocket
    const socket = new SockJS(`${BASE_URL}/ws-chat`)
    const client = Stomp.over(socket)
    
    // 禁用调试日志
    client.debug = () => {}

    const headers = {
      Authorization: `Bearer ${token}`
    }

    client.connect(headers, async (frame) => {
      console.log('WebSocket已连接')
      stompClient.value = client
      
      // 加载历史消息并获取真实的conversationId
      try {
        const response = await getMyMessages()
        const historyMessages = response.data || response
        if (historyMessages && historyMessages.length > 0) {
          hasHistoryMessages.value = true // 标记有历史消息
          // 从第一条消息获取真实的conversationId
          conversationId.value = historyMessages[0].conversationId
          
          historyMessages.forEach(msg => {
            chatMessages.value.push({
              type: msg.senderId === currentUserId.value ? 'user' : 'support',
              text: msg.content,
              time: msg.sentTime
            })
          })
        } else {
          // 如果没有历史消息，conversationId设为null，发送时让后端创建
          conversationId.value = null
        }
        nextTick(() => {
          if (chatBody.value) {
            chatBody.value.scrollTop = chatBody.value.scrollHeight
          }
        })
      } catch (error) {
        console.error('加载历史消息失败:', error)
        conversationId.value = null
      }
      
      // 订阅实时消息（使用userId订阅）
      client.subscribe(`/topic/conversation/${currentUserId.value}`, (message) => {
        const newMsg = JSON.parse(message.body)
        
        // 更新conversationId（特别是首次发送消息后）
        if (newMsg.conversationId && !conversationId.value) {
          conversationId.value = newMsg.conversationId
          console.log('已获取conversationId:', conversationId.value)
        }
        
        // 只添加不是自己发送的消息
        if (newMsg.senderId !== currentUserId.value) {
          chatMessages.value.push({
            type: 'support',
            text: newMsg.content,
            time: newMsg.sentTime
          })
          
          // 如果聊天窗口未打开，增加未读数
          if (!isChatOpen.value) {
            unreadCount.value++
          }
          
          nextTick(() => {
            if (chatBody.value) {
              chatBody.value.scrollTop = chatBody.value.scrollHeight
            }
          })
        }
      })
    }, (error) => {
      console.error('WebSocket连接失败:', error)
    })
  } catch (error) {
    console.error('连接WebSocket失败:', error)
  }
}

// 格式化消息时间
const formatMessageTime = (time) => {
  if (!time) return ''
  const date = new Date(time)
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  return `${hours}:${minutes}`
}

// 发送消息
const sendMessage = () => {
  if (!chatInput.value.trim()) return
  
  // 添加用户消息到界面
  chatMessages.value.push({
    type: 'user',
    text: chatInput.value,
    time: new Date().toISOString()
  })
  
  const messageContent = chatInput.value
  const isFirstMessage = !hasHistoryMessages.value && chatMessages.value.length === 1 // 检查是否是第一条消息（没有历史记录）
  chatInput.value = ''
  
  // 滚动到底部
  nextTick(() => {
    if (chatBody.value) {
      chatBody.value.scrollTop = chatBody.value.scrollHeight
    }
  })
  
  // 通过WebSocket发送消息
  if (stompClient.value) {
    const message = {
      conversationId: conversationId.value, // 可能是null（首次发送），后端会自动创建
      senderId: currentUserId.value,
      content: messageContent,
      messageType: 'TEXT'
    }

    try {
      stompClient.value.send('/app/chat.sendMessage', {}, JSON.stringify(message))
      console.log('发送消息:', message)
      
      // 如果是第一条消息，自动添加客服回复
      if (isFirstMessage) {
        setTimeout(() => {
          chatMessages.value.push({
            type: 'support',
            text: t('orders.support.response'),
            time: new Date().toISOString()
          })
          nextTick(() => {
            if (chatBody.value) {
              chatBody.value.scrollTop = chatBody.value.scrollHeight
            }
          })
        }, 1000)
      }
    } catch (error) {
      console.error('发送消息失败:', error)
      alert('发送失败，请重试')
    }
  } else {
    console.error('WebSocket未连接')
    alert('未连接到服务器，请刷新页面重试')
  }
}

// 组件挂载时初始化
onMounted(async () => {
  // 获取订单数据（路由守卫已确保用户已登录）
  await fetchOrders('all')
  
  // 加载未读消息数
  loadUnreadCount()
  
  // 每30秒轮询一次未读消息数
  const unreadInterval = setInterval(loadUnreadCount, 30000)
  // 保存定时器ID以便清理
  onUnmounted(() => {
    clearInterval(unreadInterval)
  })
  
  // 等待 DOM 完全渲染
  await nextTick()
  await nextTick()
  
  // 先更新滑块位置，确保 sliderStyle 有值
  updateSlider()
  
  // 等待滑块位置更新后再初始化 motion
  await nextTick()
  
  // 初始化滑块动画
  if (sliderRef.value && sliderStyle.value.left) {
    sliderMotion = useMotion(sliderRef.value, {
      initial: {
        left: parseFloat(sliderStyle.value.left),
        width: parseFloat(sliderStyle.value.width)
      },
      enter: {
        left: parseFloat(sliderStyle.value.left),
        width: parseFloat(sliderStyle.value.width),
        transition: {
          type: 'spring',
          stiffness: 500,
          damping: 30
        }
      }
    })
    
    // 立即应用 enter 状态
    if (sliderMotion && sliderMotion.apply) {
      sliderMotion.apply('enter')
    }
  }
  
  applyCardAnimations()
  
  // 向历史记录添加一个状态，以便拦截返回按钮
  window.history.pushState(null, '', window.location.href)
  
  // 添加浏览器返回按钮拦截
  window.addEventListener('popstate', handlePopState)
  
  // 添加移动端滑动手势监听
  document.addEventListener('touchstart', handleTouchStart, { passive: true })
  document.addEventListener('touchend', handleTouchEnd, { passive: false })
})

// 组件卸载时清理
onUnmounted(() => {
  cardMotions.value = []
  // 移除浏览器返回按钮监听
  window.removeEventListener('popstate', handlePopState)
  // 断开WebSocket连接
  if (stompClient.value) {
    stompClient.value.disconnect()
  }
  // 移除滑动手势监听
  document.removeEventListener('touchstart', handleTouchStart)
  document.removeEventListener('touchend', handleTouchEnd)
})
</script>

<template>
  <div class="orders-page">
    <!-- 背景效果 -->
    <div class="mesh-bg"></div>
    <div class="noise"></div>

    <!-- 主内容区域 -->
    <main class="main-container">
      <!-- 页面标题 -->
      <div class="page-header">
        <button @click="router.push('/')" class="back-btn">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="m15 18-6-6 6-6"/>
          </svg>
        </button>
        <div class="header-content">
          <h1>{{ $t('orders.title') }}</h1>
          <!-- <p class="subtitle">{{ $t('orders.subtitle') }}</p> -->
        </div>
      </div>

      <!-- 标签切换区域 -->
      <div class="tabs-row">
        <!-- 标签切换 -->
        <div class="tabs-container">
          <!-- 滑块背景 -->
          <div 
            ref="sliderRef"
            class="tab-slider" 
            :style="sliderStyle"
          ></div>
          
          <!-- 标签按钮 -->
          <button
            v-for="(tab, index) in tabs"
            :key="tab"
            :ref="el => setTabRef(el, index)"
            @click="activeTab = tab"
            :class="['tab-button', { 'active': activeTab === tab }]"
          >
            <span class="tab-text">{{ $t(`orders.tabs.${tab}`) }}</span>
          </button>
        </div>
        
        <!-- 返回首页和用户头像 - Web端显示在标签旁边 -->
        <div class="user-avatar-container">
          <button v-if="isAdmin" class="admin-button" @click="router.push('/admin')" title="后台管理">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="3" y="3" width="7" height="7"></rect>
              <rect x="14" y="3" width="7" height="7"></rect>
              <rect x="14" y="14" width="7" height="7"></rect>
              <rect x="3" y="14" width="7" height="7"></rect>
            </svg>
          </button>
          <!-- <button class="home-button" @click="router.replace('/')" :title="$t('common.backToHome')">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
              <polyline points="9 22 9 12 15 12 15 22"></polyline>
            </svg>
          </button> -->
          <div class="user-avatar" @click="router.push('/settings')" title="My Settings">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
            </svg>
          </div>
        </div>
      </div>

      <!-- 订单网格 -->
      <div class="orders-grid">
        <div
          v-for="(order, index) in filteredOrders"
          :key="`${activeTab}-${order.id}`"
          :ref="el => setCardRef(el, index)"
          class="order-card-motion"
          @click="openOrderDetail(order)"
        >
          <!-- 订单头部 -->
          <div class="order-header">
            <div class="order-info">
              <p class="order-id">{{ $t('orders.orderId').toUpperCase() }} {{ order.id }}</p>
              <h3 class="order-date">{{ order.date }}</h3>
            </div>
            <div :class="['status-badge', getStatusColors(order.status)]">
              <svg v-if="order.status === ORDER_STATUS.COMPLETED" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
              <svg v-else-if="order.status === ORDER_STATUS.SHIPPED" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="3" width="15" height="13"></rect><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon><circle cx="5.5" cy="18.5" r="2.5"></circle><circle cx="18.5" cy="18.5" r="2.5"></circle></svg>
              <svg v-else xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
              <span>{{ $t(`orders.status.${order.status}`) }}</span>
            </div>
          </div>

          <!-- 产品图片 -->
          <div class="order-items">
            <img
              v-for="(item, idx) in order.items.slice(0, 3)"
              :key="idx"
              :src="item.img"
              :alt="item.name"
              class="item-img"
            />
            <div v-if="order.items.length > 3" class="more-items">
              +{{ order.items.length - 3 }}
            </div>
          </div>

          <!-- 订单底部 -->
          <div class="order-footer">
            <div class="total-section">
              <p class="total-label">{{ $t('orders.totalAmount') }}</p>
              <p class="total-amount">${{ order.total.toLocaleString() }}</p>
            </div>
            <div class="arrow-btn">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>
            </div>
          </div>
        </div>

        <!-- Loading 状态 -->
        <div v-if="loading" class="loading-state">
          <div class="loading-spinner"></div>
          <p>{{ $t('common.loading') || '加载中...' }}</p>
        </div>
        
        <!-- 空状态 -->
        <div v-else-if="filteredOrders.length === 0" class="empty-state">
          <p>{{ $t('orders.emptyState') }}</p>
        </div>
      </div>
    </main>

    <!-- 客服按钮 -->
    <div class="chat-fab" @click="toggleChat" role="button" aria-label="Open Support Chat">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
      </svg>
      <!-- 未读消息数徽章 -->
      <span v-if="unreadCount > 0" class="chat-badge">{{ unreadCount > 99 ? '99+' : unreadCount }}</span>
    </div>

    <!-- 聊天窗口 -->
    <div class="chat-window" v-if="isChatOpen || isClosing" ref="chatWindow">
      <div class="chat-header">{{ $t('orders.support.title') }}</div>
      <div class="chat-body" ref="chatBody">
        <div class="message support">{{ $t('orders.support.welcome') }}</div>
        <div 
          v-for="(msg, index) in chatMessages" 
          :key="index" 
          :class="['message-wrapper', msg.type]"
        >
          <div class="message-time" v-if="msg.time">{{ formatMessageTime(msg.time) }}</div>
          <div :class="['message-bubble', msg.type]">{{ msg.text }}</div>
        </div>
        <div v-if="isTyping" class="message support loading-dots">
          <span></span><span></span><span></span>
        </div>
      </div>
      <div class="chat-input-container">
        <input 
          type="text" 
          v-model="chatInput"
          @keypress.enter="sendMessage"
          :placeholder="$t('orders.support.placeholder')" 
          class="chat-input"
        />
      </div>
    </div>

    <!-- 订单详情模态框 -->
    <div v-if="selectedOrder" class="modal-overlay" @click.self="closeOrderDetail">
      <div class="modal-content">
        <!-- 模态框头部 -->
        <div class="modal-header">
          <div>
            <h2>{{ $t('orders.orderDetails') }}</h2>
            <p class="modal-subtitle">ID: {{ selectedOrder.id }}</p>
          </div>
          <button @click="closeOrderDetail" class="close-btn">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
          </button>
        </div>

        <!-- 模态框内容 -->
        <div class="modal-body">
          <!-- 状态和日期 -->
          <div class="modal-status-section">
            <div :class="['status-badge', getStatusColors(selectedOrder.status)]">
              <svg v-if="selectedOrder.status === ORDER_STATUS.COMPLETED" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
              <svg v-else-if="selectedOrder.status === ORDER_STATUS.SHIPPED" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="3" width="15" height="13"></rect><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon><circle cx="5.5" cy="18.5" r="2.5"></circle><circle cx="18.5" cy="18.5" r="2.5"></circle></svg>
              <svg v-else xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
              <span>{{ $t(`orders.status.${selectedOrder.status}`) }}</span>
            </div>
            <span class="modal-date">{{ selectedOrder.date }}</span>
          </div>

          <!-- 进度条 -->
          <div class="progress-bar">
            <div 
              :class="['progress-fill', selectedOrder.status === ORDER_STATUS.CANCELED ? 'canceled' : '']"
              :style="{ width: selectedOrder.status === ORDER_STATUS.COMPLETED ? '100%' : '40%' }"
            ></div>
          </div>

          <!-- 商品列表 -->
          <div class="items-section">
            <h3 class="section-title">{{ $t('orders.items').toUpperCase() }}</h3>
            <div
              v-for="(item, i) in selectedOrder.items"
              :key="i"
              class="modal-item"
            >
              <div class="modal-item-img">
                <img :src="item.img" :alt="item.name" />
              </div>
              <div class="modal-item-info">
                <p class="modal-item-name">{{ item.name }}</p>
                <p class="modal-item-qty">{{ $t('orders.qty') }}: 1</p>
              </div>
              <p class="modal-item-price">${{ item.price }}</p>
            </div>
          </div>

          <!-- 支付信息 -->
          <div class="payment-section">
            <div class="payment-row">
              <span>{{ $t('orders.subtotal') }}</span>
              <span>${{ selectedOrder.total }}</span>
            </div>
            <div class="payment-row">
              <span>{{ $t('orders.shipping') }}</span>
              <span class="free-shipping">{{ $t('orders.free') }}</span>
            </div>
            <div class="payment-total">
              <span>{{ $t('orders.total') }}</span>
              <span>${{ selectedOrder.total }}</span>
            </div>
          </div>
        </div>

        <!-- 模态框底部 -->
        <div class="modal-footer">
          <!-- 待支付订单 -->
          <template v-if="selectedOrder.status === ORDER_STATUS.PENDING || selectedOrder.status === 'pending'">
            <button class="btn-secondary-outline" @click="handleCancelOrder">{{ $t('orders.cancelOrder') || '取消订单' }}</button>
          </template>
          
          <!-- 已发货订单 -->
          <template v-else-if="selectedOrder.status === ORDER_STATUS.SHIPPED || selectedOrder.status === 'shipped'">
            <button class="btn-secondary-outline" @click="handleRefund">{{ $t('orders.requestReturn') }}</button>
            <button class="btn-primary blue" @click="handleConfirmReceipt">{{ $t('orders.confirmReceipt') }}</button>
          </template>
          
          <!-- 已完成订单 -->
          <template v-else-if="selectedOrder.status === ORDER_STATUS.COMPLETED || selectedOrder.status === 'delivered'">
            <button class="btn-secondary-outline" @click="handleRefund">{{ $t('orders.requestReturn') }}</button>
          </template>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.orders-page {
  min-height: 100vh;
  background-color: #f5f5f7;
  -webkit-font-smoothing: antialiased;
  position: relative;
  overflow-x: hidden;
}

/* 背景效果 */
.mesh-bg {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  z-index: -1;
  background: 
    radial-gradient(at 0% 0%, hsla(210,100%,93%,1) 0, transparent 50%), 
    radial-gradient(at 50% 0%, hsla(220,100%,96%,1) 0, transparent 50%), 
    radial-gradient(at 100% 0%, hsla(340,100%,96%,1) 0, transparent 50%);
}

.noise {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: -1;
  opacity: 0.4;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E");
}

/* 主容器 */
.main-container {
  max-width: 1100px;
  margin: 0 auto;
  padding: 2rem 1rem;
}

/* 页面标题 */
.page-header {
  position: relative;
  margin-bottom: 2rem;
  animation: fadeInUp 0.6s ease-out;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 80px;
}

.back-btn {
  position: absolute;
  left: 0;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: none;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  cursor: pointer;
  transition: all 0.3s ease;
  background: white;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #1d1d1f;
  margin-top: 4%;
}

.back-btn:hover {
  transform: scale(1.05);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.back-btn:active {
  transform: scale(0.95);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.back-btn svg {
  color: #1d1d1f;
}

.header-content {
  text-align: center;
}

.page-header h1 {
  font-size: 3.2rem;
  font-weight: 700;
  color: #000;
  letter-spacing: -0.02em;
  margin-bottom: -0.5rem;
}

.page-header .subtitle {
  font-size: 1.2rem;
  font-weight: 500;
  color: #666;
}

/* 标签行容器 */
.tabs-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 2rem;
}

/* 标签切换 */
.tabs-container {
  position: relative;
  display: flex;
  gap: 0.25rem;
  padding: 0.4rem;
  background: rgba(255, 255, 255, 0.4);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border-radius: 9999px;
  width: fit-content;
  border: 1px solid rgba(255, 255, 255, 0.4);
}

/* 用户头像容器 */
.user-avatar-container {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
}

/* 后台管理按钮 */
.admin-button {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: none;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
  color: white;
}

.admin-button:hover {
  transform: scale(1.05);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.5);
}

.admin-button:active {
  transform: scale(0.95);
}

/* 返回首页按钮 */
.home-button {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: none;
  background: white;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  color: #1d1d1f;
}

.home-button:hover {
  transform: scale(1.05);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.home-button:active {
  transform: scale(0.95);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.user-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: none;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  cursor: pointer;
  transition: all 0.3s ease;
  background: white;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #1d1d1f;
}

.user-avatar:hover {
  transform: scale(1.05);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.user-avatar:active {
  transform: scale(0.95);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

/* 滑块 - 使用 @vueuse/motion spring(500, 30) */
.tab-slider {
  position: absolute;
  height: calc(100% - 0.75rem);
  top: 0.375rem;
  background: #000;
  border-radius: 9999px;
  box-shadow: 0 4px 6px -1px rgba(17, 24, 39, 0.2);
  z-index: 0;
  /* transition 由 v-motion 处理 */
}

.tab-button {
  position: relative;
  padding: 0.625rem 1.25rem;
  border-radius: 9999px;
  font-size: 0.875rem;
  font-weight: 500;
  border: none;
  background: transparent;
  cursor: pointer;
  transition: color 0.3s ease;
  color: #666;
  z-index: 1;
}

.tab-button:hover {
  color: #1d1d1f;
}

.tab-button.active {
  color: white;
}

.tab-text {
  position: relative;
  z-index: 10;
}

/* 订单网格 */
.orders-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1.5rem;
}

/* 订单卡片 - 使用 @vueuse/motion */
/* Spring 参数: stiffness: 600, damping: 18 */
/* Initial: opacity: 0, y: 40, scale: 0.9 */
/* Enter: opacity: 1, y: 0, scale: 1 */
/* Stagger: 0.08s, Delay: 0.1s */
.order-card-motion {
  position: relative;
  background: rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(60px);
  border: 1px solid rgba(255, 255, 255, 0.4);
  padding: 1rem 1.5rem;
  border-radius: 1.5rem;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.04);
  cursor: pointer;
  /* 只对阴影应用transition，transform由motion控制 */
  transition: box-shadow 0.3s ease;
  will-change: transform, opacity;
}

.order-card-motion:hover {
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.08);
}

/* Hover时的缩放由JS控制，避免冲突 */

/* 订单头部 */
.order-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1.5rem;
}

.order-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.order-id {
  font-size: 0.875rem;
  color: #666;
  font-weight: 500;
  text-transform: uppercase;
  margin: 0;
  line-height: 1.5;
}

.order-date {
  font-size: 1.2rem;
  font-weight: 600;
  color: #000;
  margin: 0;
}

/* 状态徽章 */
.status-badge {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 500;
  border: 1px solid;
  backdrop-filter: blur(8px);
}

.status-pending {
  background: rgba(251, 191, 36, 0.1);
  color: #d97706;
  border-color: rgba(251, 191, 36, 0.2);
}

.status-completed {
  background: rgba(16, 185, 129, 0.1);
  color: #059669;
  border-color: rgba(16, 185, 129, 0.2);
}

.status-shipped {
  background: rgba(59, 130, 246, 0.1);
  color: #2563eb;
  border-color: rgba(59, 130, 246, 0.2);
}

.status-canceled {
  background: rgba(156, 163, 175, 0.1);
  color: #9ca3af;
  border-color: rgba(156, 163, 175, 0.2);
}

.status-default {
  background: rgba(156, 163, 175, 0.1);
  color: #6b7280;
  border-color: rgba(156, 163, 175, 0.2);
}

/* 产品图片 */
.order-items {
  display: flex;
  margin-left: 0.25rem;
  margin-bottom: 0.5rem;
  overflow: hidden;
}

.item-img {
  width: 3rem;
  height: 3rem;
  border-radius: 50%;
  border: 2px solid white;
  object-fit: cover;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  margin-left: -0.625rem;
  animation: imgSlideIn 0.4s ease-out backwards;
}

.item-img:first-child {
  margin-left: 0;
}

.item-img:nth-child(1) { animation-delay: 0.2s; }
.item-img:nth-child(2) { animation-delay: 0.3s; }
.item-img:nth-child(3) { animation-delay: 0.4s; }

.more-items {
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 50%;
  border: 2px solid white;
  background: #f3f4f6;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  font-weight: 600;
  color: #6b7280;
  margin-left: -0.625rem;
  z-index: 10;
}

/* 订单底部 */
.order-footer {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  padding-top: 0.875rem;
}

.total-label {
  font-size: 0.8rem;
  color: #666;
  margin-bottom: -1rem;
}

.total-amount {
  font-size: 1.3rem;
  font-weight: 700;
  color: #000;
  letter-spacing: -0.01em;
}

.arrow-btn {
  width: 2rem;
  height: 2rem;
  border-radius: 50%;
  background: #f3f4f6;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  color: #000;
  margin-bottom: 1rem;
}

.arrow-btn svg {
  width: 1.3rem;
  height: 1.3rem;
  transform: translateX(1px);
}

.order-card-motion:hover .arrow-btn {
  background: #3b82f6;
  color: white;
}

/* 空状态 */
.empty-state {
  grid-column: 1 / -1;
  text-align: center;
  padding: 5rem 0;
}

.empty-state p {
  color: #a1a1a6;
  font-size: 1.125rem;
}

/* 模态框 */
.modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 50;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  background: rgba(17, 24, 39, 0.2);
  backdrop-filter: blur(4px);
  animation: fadeIn 0.3s ease-out;
}

.modal-content {
  position: relative;
  width: 100%;
  max-width: 42rem;
  max-height: 90vh;
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(80px);
  border: 1px solid rgba(255, 255, 255, 0.5);
  border-radius: 2rem;
  box-shadow: 0 40px 80px -15px rgba(0, 0, 0, 0.2);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  animation: modalSlideIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.modal-header {
  padding: 1rem 2rem;
  border-bottom: 1px solid rgba(229, 231, 235, 0.5);
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: rgba(255, 255, 255, 0.5);
  backdrop-filter: blur(8px);
}

.modal-header h2 {
  font-size: 1.5rem;
  font-weight: 700;
  color: #000;
  letter-spacing: -0.01em;
}

.modal-subtitle {
  font-size: 0.875rem;
  color: #6e6e73;
  margin-top: -0.8rem;
}

.close-btn {
  padding: 0.5rem;
  border-radius: 50%;
  background: #f3f4f6;
  border: none;
  cursor: pointer;
  transition: background 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.close-btn:hover {
  background: #e5e7eb;
}

.modal-body {
  padding: 2rem;
  overflow-y: auto;
  flex: 1;
}

.modal-body::-webkit-scrollbar {
  display: none;
}

.modal-status-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.modal-date {
  font-size: 0.875rem;
  color: #6e6e73;
}

.progress-bar {
  height: 0.375rem;
  width: 100%;
  background: #f3f4f6;
  border-radius: 9999px;
  overflow: hidden;
  margin-bottom: 2.5rem;
}

.progress-fill {
  height: 100%;
  background: #3b82f6;
  border-radius: 9999px;
  transition: width 1s cubic-bezier(0.16, 1, 0.3, 1);
  animation: progressGrow 1s ease-out 0.3s backwards;
}

.progress-fill.canceled {
  background: #ef4444;
}

.section-title {
  font-size: 0.875rem;
  font-weight: 600;
  color: #a1a1a6;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  margin-bottom: 1rem;
}

.items-section {
  margin-bottom: 2rem;
}

.modal-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.75rem;
  border-radius: 1rem;
  transition: background 0.2s ease;
  animation: itemSlideIn 0.4s ease-out backwards;
}

.modal-item:nth-child(2) { animation-delay: 0.2s; }
.modal-item:nth-child(3) { animation-delay: 0.3s; }
.modal-item:nth-child(4) { animation-delay: 0.4s; }

.modal-item:hover {
  background: rgba(255, 255, 255, 0.6);
}

.modal-item-img {
  width: 4rem;
  height: 4rem;
  background: #f9fafb;
  border-radius: 1rem;
  overflow: hidden;
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.05);
}

.modal-item-img img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.modal-item-info {
  flex: 1;
}

.modal-item-name {
  font-weight: 600;
  color: #1d1d1f;
  margin-bottom: 0.25rem;
}

.modal-item-qty {
  font-size: 0.875rem;
  color: #6e6e73;
}

.modal-item-price {
  font-weight: 500;
  color: #1d1d1f;
}

.payment-section {
  background: rgba(255, 255, 255, 0.5);
  border-radius: 1rem;
  padding: 1.5rem;
  border: 1px solid rgba(255, 255, 255, 0.5);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.payment-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.5rem;
  color: #6e6e73;
}

.free-shipping {
  color: #059669;
  font-weight: 500;
}

.payment-total {
  display: flex;
  justify-content: space-between;
  padding-top: 1rem;
  border-top: 1px solid rgba(229, 231, 235, 0.5);
  font-size: 1.125rem;
  font-weight: 700;
  color: #1d1d1f;
}

.modal-footer {
  padding: 1.5rem 2rem;
  border-top: 1px solid rgba(229, 231, 235, 0.5);
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(8px);
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
}

.btn-secondary {
  padding: 0.75rem 1.5rem;
  border-radius: 9999px;
  font-size: 0.875rem;
  font-weight: 600;
  color: #6b7280;
  background: #f3f4f6;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-secondary:hover {
  background: #e5e7eb;
}

.btn-primary {
  padding: 0.9rem 2rem;
  border-radius: 9999px;
  font-size: 0.875rem;
  font-weight: 600;
  color: white;
  background: #1d1d1f;
  border: none;
  cursor: pointer;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  transition: all 0.2s ease;
}

.btn-primary:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 12px -2px rgba(0, 0, 0, 0.15);
}

.btn-primary:active {
  transform: scale(0.98);
  box-shadow: 0 2px 4px -1px rgba(0, 0, 0, 0.1);
}

.btn-primary.blue {
  background: #206ce7;
  box-shadow: 0 4px 6px -1px rgba(59, 130, 246, 0.3);
}

.btn-primary.blue:hover {
  background: #1d5ed9;
  box-shadow: 0 6px 12px -2px rgba(59, 130, 246, 0.4);
}

.btn-secondary-outline {
  padding: 0.9rem 2rem;
  border-radius: 9999px;
  font-size: 0.875rem;
  font-weight: 600;
  color: #1d1d1f;
  background: #ffffff;
  border: 1px solid rgba(0, 0, 0, 0.15);
  cursor: pointer;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  transition: all 0.2s ease;
}

.btn-secondary-outline:hover {
  background: #f5f5f7;
  border-color: rgba(0, 0, 0, 0.25);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.12);
  transform: translateY(-1px);
}

.btn-secondary-outline:active {
  transform: scale(0.98);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.08);
}

/* 动画 */
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes imgSlideIn {
  from {
    opacity: 0;
    transform: translateX(-10px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes modalSlideIn {
  from {
    opacity: 0;
    transform: scale(0.9) translateY(100px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

@keyframes itemSlideIn {
  from {
    opacity: 0;
    transform: translateX(-20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes progressGrow {
  from {
    width: 0;
  }
}

/* 客服聊天组件 - 直接从 index.html 复制 */
.chat-fab {
  position: fixed;
  bottom: 30px;
  right: 30px;
  width: 60px;
  height: 60px;
  background: #3b82f6;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  box-shadow: 0 10px 30px rgba(0,113,227, 0.4);
  cursor: pointer;
  z-index: 200;
  transition: transform 0.2s;
}

.chat-fab:hover {
  transform: scale(1.05);
}

.chat-badge {
  position: absolute;
  top: -5px;
  right: -5px;
  background: #0071e3;
  color: white;
  border-radius: 12px;
  min-width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 600;
  padding: 0 5px;
  box-shadow: 0 2px 4px rgba(0, 113, 227, 0.3);
  animation: badge-pulse 2s ease-in-out infinite;
}

@keyframes badge-pulse {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.1);
  }
}

.chat-window {
  position: fixed;
  bottom: 100px;
  right: 30px;
  width: 350px;
  height: 500px;
  background: #fff;
  border-radius: 18px;
  box-shadow: 0 20px 60px rgba(0,0,0,0.15);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  transform-origin: bottom right;
  z-index: 199;
}

.chat-header {
  padding: 20px;
  border-bottom: 1px solid #d2d2d7;
  background: #fbfbfd;
  font-weight: 600;
}

.chat-body {
  flex: 1;
  padding: 20px;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  background: white;
  overflow-y: auto;
}

/* 欢迎消息和加载动画的样式 */
.message {
  padding: 10px 15px;
  margin-bottom: 10px;
  border-radius: 18px;
  max-width: 80%;
  font-size: 14px;
}

.message.support {
  background: #f5f5f7;
  color: #000;
  align-self: flex-start;
}

.message-wrapper {
  display: flex;
  flex-direction: column;
  margin-bottom: 12px;
  max-width: 80%;
}

.message-wrapper.support {
  align-items: flex-start;
  align-self: flex-start;
}

.message-wrapper.user {
  align-items: flex-end;
  align-self: flex-end;
}

.message-bubble {
  padding: 10px 15px;
  border-radius: 18px;
  font-size: 14px;
  word-wrap: break-word;
}

.message-bubble.support {
  background: #f5f5f7;
  color: #000;
}

.message-bubble.user {
  background: #0071e3;
  color: white;
}

.message-time {
  font-size: 10px;
  color: #999;
  margin-bottom: 4px;
  padding: 0 8px;
}

.loading-dots span {
  display: inline-block;
  width: 6px;
  height: 6px;
  background: #999;
  border-radius: 50%;
  margin: 0 2px;
  animation: bounce 1.4s infinite ease-in-out both;
}

.loading-dots span:nth-child(1) {
  animation-delay: -0.32s;
}

.loading-dots span:nth-child(2) {
  animation-delay: -0.16s;
}

@keyframes bounce {
  0%, 80%, 100% {
    transform: scale(0);
  }
  40% {
    transform: scale(1);
  }
}

.chat-input-container {
  padding: 15px;
  background: #fbfbfd;
  border-top: 1px solid #d2d2d7;
  display: flex;
}

.chat-input {
  width: 100%;
  height: 36px;
  font-size: 14px;
  border: 1px solid transparent;
  background: #e8e8ed;
  border-radius: 12px;
  padding: 0 12px;
  outline: none;
  transition: 0.2s;
}

.chat-input:focus {
  background: #fff;
  border-color: #0071e3;
  box-shadow: 0 0 0 4px rgba(0,113,227, 0.15);
}

/* 移动端适配 - 竖屏设备 */
@media (max-aspect-ratio: 1/1) {
  /* 主容器使用相对定位 */
  .main-container {
    position: relative;
    margin-top: -1rem;
  }
  
  /* 页面标题 */
  .page-header {
    margin-bottom: 1.5rem;
    position: relative;
    padding-left: 50px; /* 为左侧返回按钮留空间 */
    padding-right: 50px; /* 为右侧头像留空间 */
    min-height: 36px;
  }
  
  .back-btn {
    width: 36px;
    height: 36px;
    top: 0;
    left: 0;
    margin-top: 6.5%;
  }
  
  .back-btn svg {
    width: 20px;
    height: 20px;
  }
  
  .header-content {
    text-align: center;
    flex: 1;
  }
  
  .page-header h1 {
    font-size: 2rem;
    font-weight: 700;
    margin-bottom: 0.3rem;
  }
  
  .page-header .subtitle {
    font-size: 0.9rem;
  }
  
  /* 标签行布局 */
  .tabs-row {
    justify-content: flex-start;
    margin-bottom: 1.5rem;
    position: relative;
    padding: 0; /* 移除内边距 */
  }
  
  /* 隐藏后台管理按钮和返回首页按钮 */
  .admin-button,
  .home-button {
    display: none;
  }
  
  /* 头像容器 - 绝对定位到标题右上角 */
  .user-avatar-container {
    position: absolute;
    top: 0; /* 向上移动到标题行 */
    right: 0;
    gap: 0;
    margin-top: -18%;
  }
  
  .user-avatar {
    width: 36px;
    height: 36px;
  }
  
  .user-avatar svg {
    width: 20px;
    height: 20px;
  }
  
  /* 标签容器 - 与订单卡片对齐 */
  .tabs-container {
    padding: 0.4rem;
    gap: 0.25rem;
    width: 100%; /* 占满宽度 */
  }
  
  .tab-button {
    padding: 0.65rem 0.5rem;
    font-size: 0.95rem;
    display: flex;
    align-items: center;
    justify-content: center;
    flex: 1;
  }
  
  
  .orders-grid {
    grid-template-columns: 1fr;
  }
  
  .chat-window {
    width: calc(100vw - 40px);
    height: 500px;
    right: 20px;
    bottom: 90px;
  }
  
  .chat-fab {
    bottom: 20px;
    right: 20px;
    width: 45px;
    height: 45px;
  }
  
  .chat-fab svg {
    width: 20px;
    height: 20px;
  }
  
  /* 订单详情打开时隐藏客服按钮 */
  .orders-page:has(.modal-overlay) .chat-fab {
    display: none;
  }

  /* 订单详情模态框 - 移动端缩放 */
  .modal-header {
    padding: 1rem 1.2rem;
  }
  
  .modal-header h2 {
    font-size: 1.2rem;
    margin-bottom: 1rem;
  }
  
  .modal-subtitle {
    font-size: 0.75rem;
  }
  
  .close-btn {
    width: 32px;
    height: 32px;
    padding: 0.3rem;
    color: #1d1d1f; /* 设置为黑色，与Web端一致 */
  }
  
  .close-btn svg {
    width: 18px;
    height: 18px;
    stroke: currentColor; /* 确保使用当前颜色 */
  }
  
  .modal-body {
    padding: 1.2rem;
  }
  
  .modal-status-section {
    margin-bottom: 0.8rem;
  }
  
  .modal-date {
    font-size: 0.75rem;
  }
  
  .progress-bar {
    height: 0.3rem;
    margin-bottom: 1.5rem;
  }
  
  .section-title {
    font-size: 0.7rem;
    margin-bottom: 0.8rem;
  }
  
  .items-section {
    margin-bottom: 1.2rem;
  }
  
  .modal-item {
    gap: 0.8rem;
    padding: 0.6rem;
    border-radius: 0.8rem;
  }
  
  .modal-item-img {
    width: 3rem;
    height: 3rem;
    border-radius: 0.8rem;
  }
  
  .modal-item-name {
    font-size: 0.95rem;
    margin-bottom: 0.2rem;
  }
  
  .modal-item-qty {
    font-size: 0.75rem;
  }
  
  .modal-item-price {
    font-size: 0.95rem;
  }
  
  .payment-section {
    padding: 1rem;
    border-radius: 0.8rem;
  }
  
  .payment-row {
    font-size: 0.85rem;
    margin-bottom: 0.4rem;
  }
  
  .payment-total {
    font-size: 1rem;
    padding-top: 0.8rem;
  }
  
  .modal-footer {
    padding: 1rem 1.2rem;
    gap: 0.6rem;
    flex-wrap: wrap;
  }
  
  .btn-secondary,
  .btn-secondary-outline,
  .btn-primary {
    padding: 0.7rem 1.2rem;
    font-size: 0.8rem;
    flex: 1;
    min-width: 120px;
  }
  
  .btn-primary.blue {
    padding: 0.7rem 1.2rem;
  }
}

/* Loading 状态 */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  color: #666;
}

.loading-spinner {
  width: 48px;
  height: 48px;
  border: 4px solid rgba(0, 0, 0, 0.1);
  border-top-color: #000;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin-bottom: 1rem;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.loading-state p {
  font-size: 0.95rem;
  font-weight: 500;
}

/* Empty 状态 */
.empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  color: #999;
  font-size: 1rem;
}

</style>
