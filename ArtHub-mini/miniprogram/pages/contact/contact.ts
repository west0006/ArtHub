// pages/contact/contact.ts
import { storeBindingsBehavior } from 'mobx-miniprogram-bindings'
import { store } from "../../store/store";

interface UserInfo {
  avatarUrl?: string;
  nickName?: string;
  level?: number;
  bio?: string;
}

interface StatsData {
  orderCount: number;
  totalIncome: number;
  completedOrders: number;
  pendingOrders: number;
  materialCount: number;
  tutorialCount: number;
}

interface OrderItem {
  id: string;
  title: string;
  client: string;
  price: number;
  deadline: string;
  status: 'pending' | 'progress' | 'completed';
}

Page({
  behaviors: [storeBindingsBehavior],
  storeBindings: {
    store,
    fields: {
      orderList: "order",
      orderCount: "ordercount",
      materialLibrary: "materialLibrary",
      userInfo: "userInfo",
    },
    actions: {
      removeorder: "removeorder",
      changestatus: "changestatus"
    }
  },

  data: {
    userInfo: {} as UserInfo,
    stats: {
      orderCount: 0,
      totalIncome: 0,
      completedOrders: 0,
      pendingOrders: 0,
      materialCount: 0,
      tutorialCount: 0
    } as StatsData,
    recentOrders: [] as OrderItem[],
    isDarkMode: false,
    orderList: [] as any[],
    orderCount: 0,
    favoriteList: [] as number[]
  },

  onLoad() {
    // 优先使用 store 数据（已同步）
    const user = store.userInfo || getApp().globalData.userInfo;
    this.setData({ userInfo: user });
    this.loadDashboardData();
  },

  onShow() {
    // 每次显示页面时从全局状态同步用户信息
  const user = store.userInfo || getApp().globalData.userInfo;
  this.setData({ userInfo: user });
    // 页面显示时刷新数据（订单可能在其他页面改动）
    this.loadDashboardData();
  },

  // 加载综合数据（调用后端和 store）
  async loadDashboardData() {
    try {
      // 如果 store 中有订单数据，直接计算；否则先加载
      if (store.order.length === 0) {
        await store.fetchOrders();
      }
      this.calculateStatsData();
      this.loadRecentOrders();
    } catch (err) {
      console.error('加载数据失败', err);
    }
  },

  // 计算统计数据
  calculateStatsData(): void {
    const orders = store.order;
    const completedOrders = orders.filter(order => order.status === 'completed').length;
    const pendingOrders = orders.filter(order => order.status === 'pending' || order.status === 'progress').length;
    const totalIncome = orders
      .filter(order => order.status === 'completed')
      .reduce((sum, order) => sum + (order.totalAmount || 0), 0);

    const stats: StatsData = {
      orderCount: orders.length,
      totalIncome: totalIncome,
      completedOrders: completedOrders,
      pendingOrders: pendingOrders,
      materialCount: store.materialLibrary.length,
      tutorialCount: 15 // 后期可换成真实教程数量
    };

    this.setData({ stats });
  },

  // 加载最近排单（取最新3个）
  loadRecentOrders(): void {
    const orders = store.order;
    console.log(orders)
    const sortedOrders = orders
      .sort((a, b) => new Date(b.createTime).getTime() - new Date(a.createTime).getTime())
      .slice(0, 3);

    const recentOrders: OrderItem[] = sortedOrders.map(order => ({
      id: (order.id != null ? order.id.toString() : '0'), 
      title: order.title || order.windowName || '未命名订单',
      client: order.clientName || order.client || '未知客户',
      price: order.totalAmount || 0,
      deadline: order.deadline || '',
      status: this.mapOrderStatus(order.status)
    }));

    this.setData({ recentOrders });
  },

  // 映射订单状态
  mapOrderStatus(status: string): 'pending' | 'progress' | 'completed' {
    const statusMap: { [key: string]: any } = {
      'pending': 'pending',
      'progress': 'progress',
      'completed': 'completed'
    };
    return statusMap[status] || 'pending';
  },

  // 检查主题模式
  checkThemeMode(): void {
    // 可后续完善
  },

  getStatusText(status: string): string {
    const statusMap: { [key: string]: string } = {
      'pending': '待开始',
      'progress': '进行中',
      'completed': '已完成'
    };
    return statusMap[status] || '未知';
  },

  getStatusIcon(status: string): string {
    const iconMap: { [key: string]: string } = {
      'pending': 'clock-o',
      'progress': 'underway-o',
      'completed': 'passed'
    };
    return iconMap[status] || 'info-o';
  },

  getStatusColor(status: string): string {
    const colorMap: { [key: string]: string } = {
      'pending': '#856404',
      'progress': '#0c5460',
      'completed': '#155724'
    };
    return colorMap[status] || '#666666';
  },

  onEditAvatar(): void {
    wx.showActionSheet({
      itemList: ['从相册选择', '拍照'],
      success: (res) => {
        if (res.tapIndex === 0) {
          this.chooseImageFromAlbum();
        } else if (res.tapIndex === 1) {
          this.takePhoto();
        }
      }
    });
  },

  chooseImageFromAlbum(): void {
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['album'],
      success: (res) => {
        const tempFilePath = res.tempFiles[0].tempFilePath;
        wx.showLoading({ title: '上传中...' });
        // 后续可加入真实上传逻辑
        setTimeout(() => {
          wx.hideLoading();
          this.setData({
            'userInfo.avatarUrl': tempFilePath
          });
          wx.showToast({ title: '头像更新成功', icon: 'success' });
        }, 1500);
      }
    });
  },

  takePhoto(): void {
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['camera'],
      success: (res) => {
        const tempFilePath = res.tempFiles[0].tempFilePath;
        wx.showLoading({ title: '上传中...' });
        setTimeout(() => {
          wx.hideLoading();
          this.setData({
            'userInfo.avatarUrl': tempFilePath
          });
          wx.showToast({ title: '头像更新成功', icon: 'success' });
        }, 1500);
      }
    });
  },
  onEditProfile() {
    wx.navigateTo({ url: '/pages/profile/profile' });
  },
  onSettings(): void {
    wx.navigateTo({ url: '/pages/settings/settings' });
  },

  gotoIncome() {
    wx.navigateTo({ url: "/pages/income/income" });
  },

  gotoMyMaterials(): void {
    wx.navigateTo({ url: '/pages/Slib/Slib' });
  },

  gotoMyTutorials(): void {
    wx.navigateTo({ url: '/pages/Slib/Slib' });
  },

  navigateToOrders(): void {
    wx.navigateTo({ url: '/pages/orderView/orderView' });
  },

  onThemeSwitch(): void {
    const newMode = !this.data.isDarkMode;
    this.setData({ isDarkMode: newMode });
    wx.setStorageSync('themeMode', newMode ? 'dark' : 'light');
    wx.showToast({ title: `已切换到${newMode ? '深色' : '浅色'}模式`, icon: 'success' });
  },

  onOrderTap(e: any): void {
    const orderId = e.currentTarget.dataset.id;
    console.log(orderId)
    wx.navigateTo({ url: `/pages/detail/detail?id=${orderId}` });
  }
});