// store.ts
import { action, observable } from "mobx-miniprogram";
import { mockMaterials, mockTutorials } from "../utils/mockData";
import { getOrders, createOrder, updateOrder, deleteOrder } from "../api/order";
import { getMyMaterials, deleteMaterial } from "../api/material";
import { createMaterial } from '../api/material';

export const store = observable({

  activetabbarindex: 0,

  // 用户相关
  userInfo: null as any,
  isLogin: false,

  setUser: action(function (user: any) {
    this.userInfo = user;
    this.isLogin = true;
  }),

  clearUser: action(function () {
    this.userInfo = null;
    this.isLogin = false;
    this.order = [];
    this.ordercount = 0;
    this.materialLibrary = [];
  }),

  // 订单相关
  ordercount: 0,
  order: [],

  fetchOrders: action(function () {
    return getOrders().then((orders: any[]) => {
      this.order = orders.map(o => ({
        ...o,
        totalAmount: Number(o.totalAmount),
      }));
      this.ordercount = this.order.length;
    }).catch(err => {
      console.error('加载订单失败', err);
    });
  }),

  // 创建订单（调用后端 API）
  addorder: action(function (orderData) {
    wx.showLoading({ title: '创建中...' });
    return createOrder({
      title: orderData.windowName || '未命名订单',
      clientName: orderData.clientName || '',
      price: orderData.price,
      quantity: orderData.quantity,
      totalAmount: orderData.totalAmount,
      description: orderData.description,
      startDate: orderData.startDate,
      deadline: orderData.deadline,
      status: 'pending',
    }).then(() => {
      wx.hideLoading();
      wx.showToast({ title: '创建成功' });
      this.fetchOrders();
    }).catch(err => {
      wx.hideLoading();
      wx.showToast({ title: '创建失败: ' + (err.message || '未知错误'), icon: 'none' });
      console.error('创建订单失败', err);
    });
  }),

  // 删除订单
  removeorder: action(function (orderId: number) {
    return deleteOrder(orderId).then(() => this.fetchOrders());
  }),

  // 修改订单状态
  changestatus: action(function (orderId: number, newStatus: string) {
    return updateOrder(orderId, { status: newStatus }).then(() => {
      const order = this.order.find(item => item.id === orderId);
      if (order) order.status = newStatus;
    });
  }),

  // 更新订单通用方法（用于编辑页）
  updateOrder: action(function (orderId: number, updatedFields: any) {
    return updateOrder(orderId, updatedFields).then(() => this.fetchOrders());
  }),

  // 素材库 - 我的
  materialLibrary: [] as any[],

  fetchMyMaterials: action(function () {
    return getMyMaterials().then((materials: any[]) => {
      this.materialLibrary = materials.map(m => ({
        ...m,
        tags: typeof m.tags === 'string' ? m.tags.split(',') : (m.tags || []),
      }));
    });
  }),
// 添加导入外部素材方法
importExternalMaterial: action(function (stockImage: any) {
  wx.showLoading({ title: '导入中...' });
  return createMaterial({
    title: stockImage.title || '外部素材',
    description: `来源：${stockImage.source} · 作者：${stockImage.author}`,
    tags: stockImage.source,
    fileUrl: stockImage.fullUrl || stockImage.previewUrl, // 直接存储外站 URL
    copyright: '可能需要版权确认',
    sourcePlatform: stockImage.source,
    sourceUrl: stockImage.sourceUrl,
  }).then(() => {
    wx.hideLoading();
    wx.showToast({ title: '导入成功', icon: 'success' });
    return this.fetchMyMaterials();
  }).catch(err => {
    wx.hideLoading();
    wx.showToast({ title: '导入失败', icon: 'none' });
    console.error(err);
  });
}),

// 搜索素材
searchMaterials: action(function (keyword: string, tag?: string, copyright?: string) {
  return searchMaterials({ keyword, tag, copyright }).then(res => {
    return res;
  }).catch(err => {
    console.error('搜索失败', err);
    return [];
  });
}),
  // 移除素材
  removeFromMaterialLibrary: action(function (resourceId: number) {
    wx.showLoading({ title: '移除中...' });
    return deleteMaterial(resourceId).then(() => {
      wx.hideLoading();
      wx.showToast({ title: '已移除', icon: 'success' });
      this.materialLibrary = this.materialLibrary.filter(item => item.id !== resourceId);
    }).catch(err => {
      wx.hideLoading();
      wx.showToast({ title: '移除失败: ' + (err.message || '未知错误'), icon: 'none' });
      console.error('移除素材失败', err);
    });
  }),  

  // 添加素材到本地库
  addToMaterialLibrary: action(function (resource: any) {
    // 如果已经存在，只刷新即可
    if (this.materialLibrary.some(item => item.id === resource.id)) {
      return Promise.resolve();
    }
  
    wx.showLoading({ title: '添加中...' });
    return createMaterial({
      title: resource.title || '未命名素材',
      description: resource.description || '',
      tags: Array.isArray(resource.tags) ? resource.tags.join(',') : (resource.tags || ''),
      fileUrl: resource.imageUrl || resource.fileUrl || '',   // 关键：原图片地址
      user: undefined  // 由后端自动关联
    }).then((newMaterial: any) => {
      wx.hideLoading();
      wx.showToast({ title: '已添加到素材库', icon: 'success' });
      // 可选：刷新素材库列表
      this.fetchMyMaterials();
    }).catch(err => {
      wx.hideLoading();
      wx.showToast({ title: '添加失败: ' + (err.message || '未知错误'), icon: 'none' });
      console.error('添加素材失败', err);
    });
  }),

  // 以下为原有计算属性和方法，保持不变
  mockMaterials: mockMaterials,
  mockTutorials: mockTutorials,

  updataactivetabbaarindex: action(function (index) {
    this.activetabbarindex = index;
  }),

  initMockData: action(function (this: any) {
    if (this.materialLibrary.length === 0) {
      const initialMaterials = this.mockMaterials.slice(0, 3).map((material: any) => ({
        ...material,
        addTime: new Date(),
      }));
      this.materialLibrary.push(...initialMaterials);
    }
  }),

  get orderPeriods() {
    const periods: Array<{ id: number, date: string, type: 'start' | 'deadline' | 'period' }> = [];
    this.order.forEach((order: any) => {
      const orderId = order.id;
      if (order.startDate) {
        periods.push({
          id: orderId,
          date: order.startDate,
          type: 'start'
        });
      }
      if (order.deadline) {
        periods.push({
          id: orderId,
          date: order.deadline,
          type: 'deadline'
        });
      }
      if (order.startDate && order.deadline) {
        const periodDates = this.getDatesBetween(order.startDate, order.deadline);
        periodDates.forEach(date => {
          if (!periods.some(item => item.date === date)) {
            periods.push({
              id: orderId,
              date: date,
              type: 'period'
            });
          }
        });
      }
    });
    return periods;
  },

  getDatesBetween(startDateStr: string, endDateStr: string): string[] {
    const dates: string[] = [];
    const startDate = new Date(startDateStr);
    const endDate = new Date(endDateStr);
    if (startDate > endDate) return dates;
    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      const year = currentDate.getFullYear();
      const month = (currentDate.getMonth() + 1).toString().padStart(2, '0');
      const day = currentDate.getDate().toString().padStart(2, '0');
      dates.push(`${year}-${month}-${day}`);
      currentDate.setDate(currentDate.getDate() + 1);
    }
    return dates;
  },

  getOrderStatus(dateStr: string): boolean {
    const orderPeriod = this.orderPeriods.find(item => item.date === dateStr);
    if (!orderPeriod) return false;
    const order = this.order.find(item => item.id === orderPeriod.id);
    return order?.status === "completed";
  },

  hasOrderOnDate(dateStr: string): boolean {
    return this.orderPeriods.some(item => item.date === dateStr);
  },

  getOrderInfoByDate(dateStr: string): { hasOrder: boolean, orderId: number | null } {
    const orderDate = this.orderPeriods.find(item => item.date === dateStr);
    return {
      hasOrder: !!orderDate,
      orderId: orderDate ? orderDate.id : null
    };
  },

  getOrderDatesById(orderId: number): string[] {
    return this.orderPeriods
      .filter(item => item.id === orderId)
      .map(item => item.date);
  },

  get materialLibraryStats() {
    return {
      total: this.materialLibrary.length,
      byCategory: this.materialLibrary.reduce((acc, item) => {
        acc[item.type] = (acc[item.type] || 0) + 1;
        return acc;
      }, {} as { [key: string]: number })
    };
  },

  searchResources: action(function (this: any, keyword: string, resourceType?: 'material' | 'tutorial') {
    let resources: any[] = [];
    if (resourceType === 'material') {
      resources = this.mockMaterials;
    } else if (resourceType === 'tutorial') {
      resources = this.mockTutorials;
    } else {
      resources = [...this.mockMaterials, ...this.mockTutorials];
    }
    return resources.filter((item: any) =>
      item.title.toLowerCase().includes(keyword.toLowerCase()) ||
      item.description.toLowerCase().includes(keyword.toLowerCase()) ||
      item.tags.some((tag: string) => tag.toLowerCase().includes(keyword.toLowerCase()))
    );
  }),

  getResourcesByType: action(function (this: any, resourceType: 'material' | 'tutorial', category?: string) {
    const resources = resourceType === 'material' ? this.mockMaterials : this.mockTutorials;
    if (category && category !== '推荐') {
      return resources.filter((item: any) => item.type === category);
    }
    return resources;
  })
});