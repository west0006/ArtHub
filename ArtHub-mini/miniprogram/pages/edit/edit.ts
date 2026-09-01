// pages/edit/index.ts
import { storeBindingsBehavior } from 'mobx-miniprogram-bindings'
import { store } from "../../store/store";

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
      updateOrder: "updateOrder"
    }
  },

  data: {
    orderId: 0,
    formData: {} as OrderData,
    // 用于日期选择器
    startDate: '',
    deadline: '',
  },

  onLoad(options: any) {
    const orderId = parseInt(options.id);
    if (!orderId) {
      wx.showToast({ title: '订单ID错误', icon: 'error' });
      setTimeout(() => wx.navigateBack(), 1500);
      return;
    }

    const order = store.order.find((item: any) => item.id === orderId);
    if (!order) {
      wx.showToast({ title: '订单不存在', icon: 'error' });
      setTimeout(() => wx.navigateBack(), 1500);
      return;
    }

    // 深拷贝订单数据到表单，避免直接修改 store 中的原始对象
    const startParts = (order.startDate || '').split(' ');
    const deadlineParts = (order.deadline || '').split(' ');
    this.setData({
      orderId,
      formData: JSON.parse(JSON.stringify(order)),
      startDate: startParts[0] || '',
      startTime: startParts[1] || '00:00',
      deadline: deadlineParts[0] || '',
      deadlineTime: deadlineParts[1] || '00:00',
    });
  },

  // 返回上一页
  onBack() {
    wx.navigateBack();
  },

  // 处理输入变化
  onInputChange(e: any) {
    const { field } = e.currentTarget.dataset;
    const value = e.detail.value;
    this.setData({
      [`formData.${field}`]: value
    });
  },

  // 处理数字输入（价格、数量）
  onNumberInput(e: any) {
    const { field } = e.currentTarget.dataset;
    let value = e.detail.value;
    // 去除空格，只保留数字和小数点
    value = value.replace(/[^\d.]/g, '');
    // 确保最多一个小数点
    const parts = value.split('.');
    if (parts.length > 2) {
      value = parts[0] + '.' + parts.slice(1).join('');
    }
    this.setData({
      [`formData.${field}`]: value
    });
  },

  // 日期选择
  onDateChange(e: any) {
    const { field } = e.currentTarget.dataset;
    const value = e.detail.value;
    this.setData({
      [`formData.${field}`]: value,
      [field]: value
    });
  },

  // 预览图片（从详情页复制）
  previewImage(e: any) {
    const url = e.currentTarget.dataset.url;
    wx.previewImage({
      urls: this.data.formData.referenceImages,
      current: url
    });
  },

  // 保存修改
  onSave() {
    const { formData, orderId } = this.data;
    // 简单校验
    if (!formData.windowName?.trim()) {
      wx.showToast({ title: '请输入橱窗名称', icon: 'none' });
      return;
    }
    if (!formData.clientName?.trim()) {
      wx.showToast({ title: '请输入客户名称', icon: 'none' });
      return;
    }
    if (!formData.price || formData.price <= 0) {
      wx.showToast({ title: '请输入有效的价格', icon: 'none' });
      return;
    }
    if (!formData.quantity || formData.quantity < 1) {
      wx.showToast({ title: '数量至少为1', icon: 'none' });
      return;
    }

    wx.showLoading({ title: '保存中...' });

    const startDateTime = this.data.startDate && this.data.startTime
    ? `${this.data.startDate} ${this.data.startTime}`
    : (this.data.startDate || '');
  const deadlineDateTime = this.data.deadline && this.data.deadlineTime
    ? `${this.data.deadline} ${this.data.deadlineTime}`
    : (this.data.deadline || '');
    // 调用 store 的 updateOrder 方法
    this.updateOrder(orderId, {
      windowName: formData.windowName,
      clientName: formData.clientName,
      price: Number(formData.price),
      quantity: Number(formData.quantity),
      description: formData.description || '',
      settingInfo: formData.settingInfo || '',
      startDate: startDateTime,
      deadline: deadlineDateTime,
      // 注意：referenceImages 暂时不修改，可后续扩展
    });

    wx.hideLoading();
    wx.showToast({ title: '保存成功', icon: 'success' });
    setTimeout(() => wx.navigateBack(), 1500);
  },

  // 取消返回
  onCancel() {
    wx.navigateBack();
  }
});