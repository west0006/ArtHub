import { defineStore } from 'pinia';
import { mockMaterials, mockTutorials } from '@/utils/mockData';
import { getOrders, createOrder, updateOrder, deleteOrder } from '@/api/order';
import { getMyMaterials, deleteMaterial, createMaterial } from '@/api/material';
import { getUserProfile, refreshToken } from '@/api/auth';

interface OrderItem {
  id : number;
  windowName : string;
  clientName : string;
  price : number;
  quantity : number;
  description : string;
  settingInfo : string;
  referenceImages : string[];
  startDate : string;
  deadline : string;
  totalTime : string[];
  createTime : Date;
  status : 'pending' | 'progress' | 'completed';
  totalAmount : number;
}

export const useStore = defineStore('main', {
  state: () => ({
    activetabbarindex: 0,
    userInfo: null as any,
    isLogin: false,
    ordercount: 0,
    order: [] as OrderItem[],
    materialLibrary: [] as any[],
    mockMaterials,
    mockTutorials,
    pageSnapshot: {
      route: '',
      data: {} as Record<string, any>
    },
  }),
  getters: {
    orderPeriods(state) {
      const periods : Array<{ id : number; date : string; type : string }> = [];
      state.order.forEach((order : OrderItem) => {
        const orderId = order.id;
        if (order.startDate) {
          periods.push({ id: orderId, date: order.startDate, type: 'start' });
        }
        if (order.deadline) {
          periods.push({ id: orderId, date: order.deadline, type: 'deadline' });
        }
        if (order.startDate && order.deadline) {
          const dates = this.getDatesBetween(order.startDate, order.deadline);
          dates.forEach(date => {
            if (!periods.some(item => item.date === date && item.id === orderId)) {
              periods.push({ id: orderId, date, type: 'period' });
            }
          });
        }
      });
      return periods;
    },
    materialLibraryStats(state) {
      return {
        total: state.materialLibrary.length,
        byCategory: state.materialLibrary.reduce((acc : any, item : any) => {
          acc[item.type] = (acc[item.type] || 0) + 1;
          return acc;
        }, {}),
      };
    },
  },
  actions: {
    setUser(user : any) {
      this.userInfo = user;
      this.isLogin = true;
    },
    async checkLoginStatus() {
      const refreshTokenStr = uni.getStorageSync('refreshToken');
      if (refreshTokenStr) {
        try {
          const res = await refreshToken(refreshTokenStr); // 从 api/auth 导入
          uni.setStorageSync('token', res.accessToken);
          uni.setStorageSync('refreshToken', res.refreshToken);
          this.setUser(res.user);
        } catch (err) {
          uni.removeStorageSync('token');
          uni.removeStorageSync('refreshToken');
          uni.removeStorageSync('userInfo');
          this.clearUser();
        }
      } else {
        const token = uni.getStorageSync('token');
        if (token) {
          try {
            const user = await getUserProfile();
            this.setUser(user);
          } catch (err) {
            uni.removeStorageSync('token');
            this.clearUser();
          }
        }
      }
    },
    clearUser() {
      this.userInfo = null;
      this.isLogin = false;
      this.order = [];
      this.ordercount = 0;
      this.materialLibrary = [];
    },
    async fetchOrders() {
      try {
        const orders = await getOrders();
        this.order = orders.map((o : any) => ({
          ...o,
          totalAmount: Number(o.totalAmount),
        }));
        this.ordercount = this.order.length;
      } catch (err) {
        console.error('加载订单失败', err);
      }
    },
    updatePageSnapshot(route : string, data : Record<string, any>) {
      this.pageSnapshot = { route, data };
    },
    async addorder(orderData : any) {
      uni.showLoading({ title: '创建中...' });
      try {
        await createOrder({
          title: orderData.windowName || '未命名订单',
          clientName: orderData.clientName || '',
          price: orderData.price,
          quantity: orderData.quantity,
          totalAmount: orderData.totalAmount,
          description: orderData.description,
          startDate: orderData.startDate,
          deadline: orderData.deadline,
          status: 'pending',
        });
        uni.hideLoading();
        uni.showToast({ title: '创建成功' });
        await this.fetchOrders();
      } catch (err : any) {
        uni.hideLoading();
        uni.showToast({ title: '创建失败: ' + (err.message || '未知错误'), icon: 'none' });
      }
    },
    async removeorder(orderId : number) {
      await deleteOrder(orderId);
      await this.fetchOrders();
    },
    async changestatus(orderId : number, newStatus : string) {
      await updateOrder(orderId, { status: newStatus });
      const order = this.order.find(item => item.id === orderId);
      if (order) order.status = newStatus as any;
    },
    async updateOrderAction(orderId : number, updatedFields : any) {
      await updateOrder(orderId, updatedFields);
      await this.fetchOrders();
    },
    async fetchMyMaterials() {
      try {
        const materials = await getMyMaterials();
        this.materialLibrary = materials.map((m : any) => ({
          ...m,
          tags: typeof m.tags === 'string' ? m.tags.split(',') : (m.tags || []),
        }));
      } catch (err) {
        console.error('获取素材失败', err);
      }
    },
    async removeFromMaterialLibrary(resourceId : number) {
      uni.showLoading({ title: '移除中...' });
      try {
        await deleteMaterial(resourceId);
        uni.hideLoading();
        uni.showToast({ title: '已移除', icon: 'success' });
        this.materialLibrary = this.materialLibrary.filter(item => item.id !== resourceId);
      } catch (err : any) {
        uni.hideLoading();
        uni.showToast({ title: '移除失败: ' + (err.message || '未知错误'), icon: 'none' });
      }
    },
    async addToMaterialLibrary(resource : any) {
      if (this.materialLibrary.some(item => item.id === resource.id)) return;
      uni.showLoading({ title: '添加中...' });
      try {
        await createMaterial({
          title: resource.title || '未命名素材',
          description: resource.description || '',
          tags: Array.isArray(resource.tags) ? resource.tags.join(',') : (resource.tags || ''),
          fileUrl: resource.imageUrl || resource.fileUrl || '',
        });
        uni.hideLoading();
        uni.showToast({ title: '已添加到素材库', icon: 'success' });
        await this.fetchMyMaterials();
      } catch (err : any) {
        uni.hideLoading();
        uni.showToast({ title: '添加失败: ' + (err.message || '未知错误'), icon: 'none' });
      }
    },
    updataactivetabbaarindex(index : number) {
      this.activetabbarindex = index;
    },
    initMockData() {
      if (this.materialLibrary.length === 0) {
        const initial = this.mockMaterials.slice(0, 3).map((m : any) => ({
          ...m,
          addTime: new Date(),
        }));
        this.materialLibrary.push(...initial);
      }
    },
    getDatesBetween(startDateStr : string, endDateStr : string) : string[] {
      const dates : string[] = [];
      const start = new Date(startDateStr);
      const end = new Date(endDateStr);
      if (start > end) return dates;
      const current = new Date(start);
      while (current <= end) {
        const year = current.getFullYear();
        const month = (current.getMonth() + 1).toString().padStart(2, '0');
        const day = current.getDate().toString().padStart(2, '0');
        dates.push(`${year}-${month}-${day}`);
        current.setDate(current.getDate() + 1);
      }
      return dates;
    },
    getOrderStatus(dateStr : string) : boolean {
      const period = this.orderPeriods.find(item => item.date === dateStr);
      if (!period) return false;
      const order = this.order.find(item => item.id === period.id);
      return order?.status === 'completed';
    },
    hasOrderOnDate(dateStr : string) : boolean {
      return this.orderPeriods.some(item => item.date === dateStr);
    },
    getOrderInfoByDate(dateStr : string) {
      const orderDate = this.orderPeriods.find(item => item.date === dateStr);
      return {
        hasOrder: !!orderDate,
        orderId: orderDate ? orderDate.id : null,
      };
    },
    getOrderDatesById(orderId : number) : string[] {
      return this.orderPeriods.filter(item => item.id === orderId).map(item => item.date);
    },
    searchResources(keyword : string, resourceType ?: 'material' | 'tutorial') {
      let resources : any[] = [];
      if (resourceType === 'material') {
        resources = this.mockMaterials;
      } else if (resourceType === 'tutorial') {
        resources = this.mockTutorials;
      } else {
        resources = [...this.mockMaterials, ...this.mockTutorials];
      }
      const lower = keyword.toLowerCase();
      return resources.filter((item : any) =>
        item.title.toLowerCase().includes(lower) ||
        item.description.toLowerCase().includes(lower) ||
        item.tags.some((tag : string) => tag.toLowerCase().includes(lower))
      );
    },
    getResourcesByType(resourceType : 'material' | 'tutorial', category ?: string) {
      const resources = resourceType === 'material' ? this.mockMaterials : this.mockTutorials;
      if (category && category !== '推荐') {
        return resources.filter((item : any) => item.type === category);
      }
      return resources;
    },
  },
});