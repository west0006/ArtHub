// pages/detail/index.ts
import { storeBindingsBehavior } from 'mobx-miniprogram-bindings'
import { store } from "../../store/store";

// 定义订单数据类型
interface OrderData {
  id: number;
  windowName: string;
  clientName: string;
  price: number;
  quantity: number;
  description: string;
  settingInfo: string;
  referenceImages: string[];
  startDate: string;
  deadline: string;
  totalTime: string[];
  createTime: Date;
  status: 'pending' | 'progress' | 'completed';
  totalAmount: number;
}

Page({
  behaviors: [storeBindingsBehavior],
  storeBindings: {
    store,
    fields: {
      orderList: "order"
    },
    actions: {
      removeorder: "removeorder",
      changestatus: "changestatus",
    }
  },

  data: {
    orderId: 0,
    status: '',
    icon: '',
    color: '',
    orderData: {} as OrderData,
    orderList: [] as any[]
  },

  onLoad(options: any) {
    const orderId = parseInt(options.id);
    console.log(orderId)
    if (orderId) {
      this.setData({ orderId });
      this.loadOrderData(orderId);
    } else {
      wx.showToast({
        title: '订单ID错误',
        icon: 'error'
      });
      setTimeout(() => {
        wx.navigateBack();
      }, 1500);
    }
  },

  onShow() {
    // 重新加载订单数据，确保显示最新状态
    if (this.data.orderId) {
      this.loadOrderData(this.data.orderId);
    }
  },

  // 加载订单数据
  loadOrderData(orderId: number): void {
    const order = store.order.find(item => item.id === orderId);
    if (order) {
      this.setData({
        orderData: order
      });
      this.getStatusText(this.data.orderData.status)
      this.getStatusIcon(this.data.orderData.status)
      this.getStatusColor(this.data.orderData.status)
    } else {
      wx.showToast({
        title: '订单不存在',
        icon: 'error'
      });
      setTimeout(() => {
        wx.navigateBack();
      }, 1500);
    }
  },

  // 获取状态文本
  getStatusText(status: string) {
    const statusMap: { [key: string]: string } = {
      'pending': '待开始',
      'progress': '进行中',
      'completed': '已完成'
    };
    this.setData({
      status: statusMap[status] || "暂无"
    })
  },

  // 获取状态图标
  getStatusIcon(status: string) {
    const iconMap: { [key: string]: string } = {
      'pending': 'clock-o',
      'progress': 'underway-o',
      'completed': 'passed'
    };
    this.setData({
      icon: iconMap[status] || 'info-o'
    })
  },

  // 获取状态颜色
  getStatusColor(status: string) {
    const colorMap: { [key: string]: string } = {
      'pending': '#856404',
      'progress': '#0c5460',
      'completed': '#155724'
    };
    this.setData({
      color: colorMap[status] || '#666666'
    })
  },

  // 返回上一页
  onBack(): void {
    wx.navigateBack();
  },

  // 编辑订单
  onEditOrder(): void {
    wx.navigateTo({
      url: `/pages/edit/edit?id=${this.data.orderId}`
    });
  },

  // 预览图片
  previewImage(e: any): void {
    const url = e.currentTarget.dataset.url;
    wx.previewImage({
      urls: this.data.orderData.referenceImages,
      current: url
    });
  },

  // 修改订单状态
  onChangeStatus(): void {
    const currentStatus = this.data.orderData.status;
    let newStatus: 'pending' | 'progress' | 'completed' = 'progress';
    let confirmText = '';

    if (currentStatus === 'pending') {
      newStatus = 'progress';
      confirmText = '确定要将订单标记为进行中吗？';
    } else if (currentStatus === 'progress') {
      newStatus = 'completed';
      confirmText = '确定要将订单标记为已完成吗？';
    }

    wx.showModal({
      title: '修改状态',
      content: confirmText,
      success: (res) => {
        if (res.confirm) {
          store.changestatus(this.data.orderId, newStatus);
          // console.log(store.order)
          // 更新本地数据
          this.setData({
            'orderData.status': newStatus
          });
          this.getStatusText(this.data.orderData.status)
          this.getStatusIcon(this.data.orderData.status)
          this.getStatusColor(this.data.orderData.status)
          wx.showToast({
            title: '状态更新成功',
            icon: 'success'
          });
        }
      }
    });
  },

  // 删除订单
  onDeleteOrder(): void {
    wx.showModal({
      title: '删除订单',
      content: '确定要删除这个订单吗？此操作不可恢复。',
      confirmColor: '#E64340',
      success: (res) => {
        if (res.confirm) {
          store.removeorder(this.data.orderId);

          wx.showToast({
            title: '订单删除成功',
            icon: 'success'
          });

          setTimeout(() => {
            wx.navigateBack();
          }, 1500);
        }
      }
    });
  }
});