// pages/orders/index.ts
import { storeBindingsBehavior } from 'mobx-miniprogram-bindings'
import { store } from "../../store/store";

// 定义数据类型
interface OrderCounts {
  all: number;
  completed: number;
  progress: number;
  pending: number;
}

interface OrderItem {
  id: number;
  windowName: string;
  clientName: string;
  price: number;
  quantity: number;
  totalAmount: number;
  startDate: string;
  deadline: string;
  status: 'pending' | 'progress' | 'completed';
  createTime: Date;
}

Page({
  behaviors: [storeBindingsBehavior],
  storeBindings: {
    store,
    fields: {
      orderList: "order",
      orderCount: "ordercount",
      active: 'activetabbarindex'
    },
    actions: {
      removeorder: "removeorder",
      changestatus: "changestatus",
      updataactive: 'updataactivetabbaarindex'
    }
  },

  data: {
    // 当前选中的标签
    currentTab: 'all' as 'all' | 'completed' | 'progress' | 'pending',

    // 各状态订单数量
    orderCounts: {
      all: 0,
      completed: 0,
      progress: 0,
      pending: 0
    } as OrderCounts,

    // 筛选后的订单列表
    filteredOrders: [] as OrderItem[],

    // 标签指示器位置
    tabIndicatorPosition: 0,

    // 从 store 获取的数据
    orderList: [] as any[],
    orderCount: 0
  },

  onLoad() {
    this.setData({
      orderList: store.order
    })
    this.calculateOrderCounts();//订单计数
    this.filterOrders();//订单分类
    this.calculateTabIndicatorPosition();
  },

  onShow() {
    // 每次显示页面时刷新数据
    this.calculateOrderCounts();
    this.filterOrders();
  },

  // 计算各状态订单数量
  calculateOrderCounts(): void {
    // const orders = store.order;

    const completed = this.data.orderList.filter(order => order.status === 'completed').length;
    const progress = this.data.orderList.filter(order => order.status === 'progress').length;
    const pending = this.data.orderList.filter(order => order.status === 'pending').length;

    this.setData({
      orderCounts: {
        all: this.data.orderList.length,
        completed,
        progress,
        pending
      }
    });
  },

  // 根据当前标签筛选订单
  filterOrders(): void {
    // const orderList = store.order;
    const { currentTab, orderList } = this.data;

    let filteredOrders = [];

    switch (currentTab) {
      case 'all':
        filteredOrders = orderList;
        break;
      case 'completed':
        filteredOrders = orderList.filter(order => order.status === 'completed');
        break;
      case 'progress':
        filteredOrders = orderList.filter(order => order.status === 'progress');
        break;
      case 'pending':
        filteredOrders = orderList.filter(order => order.status === 'pending');
        break;
    }

    // 按创建时间倒序排列
    filteredOrders = filteredOrders.sort((a, b) =>
      new Date(b.createTime).getTime() - new Date(a.createTime).getTime()
    );

    this.setData({ filteredOrders });
  },

  // 计算标签指示器位置
  calculateTabIndicatorPosition(): void {
    const positions = {
      'all': 0,
      'completed': 100,
      'progress': 200,
      'pending': 300
    };

    this.setData({
      tabIndicatorPosition: positions[this.data.currentTab]
    });
  },

  // 标签切换
  onTabChange(e: any): void {
    const tab = e.currentTarget.dataset.tab;

    this.setData({
      currentTab: tab
    });

    this.filterOrders();
    this.calculateTabIndicatorPosition();
  },

  // 获取状态文本
  getStatusText(status: string): string {
    const statusMap: { [key: string]: string } = {
      'pending': '待开始',
      'progress': '进行中',
      'completed': '已完成'
    };
    return statusMap[status] || '未知';
  },

  // 获取状态图标
  getStatusIcon(status: string): string {
    const iconMap: { [key: string]: string } = {
      'pending': 'clock-o',
      'progress': 'underway-o',
      'completed': 'passed'
    };
    return iconMap[status] || 'info-o';
  },

  // 获取状态颜色
  getStatusColor(status: string): string {
    const colorMap: { [key: string]: string } = {
      'pending': '#856404',
      'progress': '#0c5460',
      'completed': '#155724'
    };
    return colorMap[status] || '#666666';
  },

  // 返回上一页
  onBack(): void {
    wx.navigateBack();
  },

  // 创建订单
  onCreateOrder(): void {
    wx.navigateTo({
      url: '/pages/add/add'
    })
  },

  // 查看订单详情
  onOrderTap(e: any): void {
    const orderId = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/detail/detail?id=${orderId}`
    });
  },

  // 编辑订单
  onEditOrder(e: any): void {
    const orderId = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/edit/edit?id=${orderId}`
    });

    // 阻止事件冒泡
    // e.stopPropagation();
  },

  // 修改订单状态
  onChangeStatus(e: any): void {
    const orderId = e.currentTarget.dataset.id;
    const currentStatus = e.currentTarget.dataset.status;

    let newStatus: 'pending' | 'progress' | 'completed' = 'progress';
    let confirmText = '';

    if (currentStatus === 'pending') {
      newStatus = 'progress';
      confirmText = '确定要将订单标记为进行中吗？';
    } else if (currentStatus === 'progress') {
      newStatus = 'completed';
      confirmText = '确定要将订单标记为已完成吗？';
    } else if (currentStatus === 'completed') {
      newStatus = 'pending';
      confirmText = '确定要将订单重新标记为待开始吗？';
    }

    wx.showModal({
      title: '修改状态',
      content: confirmText,
      success: (res) => {
        if (res.confirm) {
          this.changestatus(orderId, newStatus);

          wx.showToast({
            title: '状态更新成功',
            icon: 'success'
          });

          // 刷新数据
          setTimeout(() => {
            this.calculateOrderCounts();
            this.filterOrders();
          }, 500);
        }
      }
    });

    // 阻止事件冒泡
    e.stopPropagation();
  },

  // 删除订单
  onDeleteOrder(e: any): void {
    const orderId = e.currentTarget.dataset.id;

    wx.showModal({
      title: '删除订单',
      content: '确定要删除这个订单吗？此操作不可恢复。',
      confirmColor: '#E64340',
      success: (res) => {
        if (res.confirm) {
          this.removeorder(orderId);

          wx.showToast({
            title: '订单删除成功',
            icon: 'success'
          });

          // 刷新数据
          setTimeout(() => {
            this.calculateOrderCounts();
            this.filterOrders();
          }, 500);
        }
      }
    });

    // 阻止事件冒泡
    e.stopPropagation();
  }
});