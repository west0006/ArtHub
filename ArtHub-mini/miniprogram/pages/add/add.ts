import { storeBindingsBehavior } from 'mobx-miniprogram-bindings'
import { store } from "../../store/store";
Page({
  behaviors: [storeBindingsBehavior],
  storeBindings: {
    store,
    fields: {
      order: "order",
      orderID: "orderID"
    },
    actions: {
      addorder: "addorder",
      getDatesBetween: "getDatesBetween"
    }
  },
  data: {
    // 表单数据
    windowName: '',
    clientName: '',
    price: '',
    quantity: 1,
    description: '',
    settingInfo: '',
    referenceImages: [],
    startDate: '',
    startTime: '00:00',
    deadline: '',
    deadlineTime: '00:00',

    //稿单信息打包
    orderInfo: [],

    // 临时数据
    tempFilePaths: []
  },

  onLoad(option: any) {
    // 设置默认日期为今天
    const today = this.formatDate(new Date());
    if (option.selectedDate) {
      this.setData({
        startDate: option.selectedDate,
        deadline: option.selectedDate
      });
    } else {
      this.setData({
        startDate: today
      });
    }
  },

  // 格式化日期为 YYYY-MM-DD
  formatDate(date) {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  },

  // 橱窗名称输入
  onWindowNameInput(e) {
    this.setData({
      windowName: e.detail.value
    });
  },

  // 单主名输入
  onClientNameInput(e) {
    this.setData({
      clientName: e.detail.value
    });
  },

  // 价格输入
  onPriceInput(e) {
    let value = e.detail.value;

    // 如果输入为空，直接设置
    if (value === '') {
      this.setData({ price: '' });
      return;
    }

    // 非数字判断 - 只允许数字和小数点
    if (!/^\d*\.?\d*$/.test(value)) {
      wx.showToast({
        title: '请输入有效数字',
        icon: 'none',
        duration: 1500
      });
      // 清除非法字符，只保留数字和小数点
      const cleanedValue = value.replace(/[^\d.]/g, '');
      this.setData({
        price: cleanedValue
      });
      return;
    }

    // 处理多个小数点的情况
    const dotCount = (value.match(/\./g) || []).length;
    if (dotCount > 1) {
      // 只保留第一个小数点
      const parts = value.split('.');
      value = parts[0] + '.' + parts.slice(1).join('');
    }

    // 如果输入的是小数点且是第一个字符，在前面补0
    if (value === '.') {
      value = '0.';
    }

    // 限制小数点后最多两位
    if (value.includes('.')) {
      const parts = value.split('.');
      if (parts[1].length > 2) {
        value = parts[0] + '.' + parts[1].substring(0, 2);
        wx.showToast({
          title: '最多保留两位小数',
          icon: 'none',
          duration: 1000
        });
      }
    }

    // 防止以0开头的多位数字（如001 -> 1）
    if (value.length > 1 && value[0] === '0' && value[1] !== '.') {
      value = value.replace(/^0+/, '') || '0';
    }

    this.setData({
      price: value
    });
  },

  // 数量输入
  onQuantityInput(e) {
    let value = parseInt(e.detail.value) || 1;
    if (value < 1) value = 1;

    this.setData({
      quantity: value
    });
  },

  // 减少数量
  decreaseQuantity() {
    if (this.data.quantity > 1) {
      this.setData({
        quantity: this.data.quantity - 1
      });
    }
  },

  // 增加数量
  increaseQuantity() {
    this.setData({
      quantity: this.data.quantity + 1
    });
  },

  // 要求描述输入
  onDescriptionInput(e) {
    let value = e.detail.value;
    const maxLength = 500;

    // 检查字数是否超过限制
    if (value.length > maxLength) {
      // 如果超过限制，截取前500个字符
      value = value.substring(0, maxLength);

      // 显示提示信息
      wx.showToast({
        title: `最多输入${maxLength}字`,
        icon: 'none',
        duration: 1500
      });
    }

    this.setData({
      description: value
    });
  },

  // 设定信息输入
  onSettingInfoInput(e) {
    this.setData({
      settingInfo: e.detail.value
    });
  },

  // 从素材库添加
  onAddFromLibrary() {
    wx.showToast({
      title: '跳转至素材库选择',
      icon: 'none'
    });
    // 实际开发中这里应该跳转到素材库页面
    // wx.navigateTo({
    //   url: '/pages/material-library/index'
    // });
  },

  // 选择图片
  onChooseImage() {
    const that = this;
    wx.chooseMedia({
      count: 9 - that.data.referenceImages.length,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      maxDuration: 30,
      camera: 'back',
      success(res) {
        const tempFiles = res.tempFiles;
        const newImages = tempFiles.map(file => file.tempFilePath);

        that.setData({
          referenceImages: [...that.data.referenceImages, ...newImages],
          tempFilePaths: [...that.data.tempFilePaths, ...newImages]
        });
      }
    });
  },

  // 删除图片
  onDeleteImage(e) {
    const index = e.currentTarget.dataset.index;
    const referenceImages = this.data.referenceImages;
    const tempFilePaths = this.data.tempFilePaths;

    referenceImages.splice(index, 1);
    tempFilePaths.splice(index, 1);

    this.setData({
      referenceImages,
      tempFilePaths
    });
  },

   // 开始日期改变
   onStartDateChange(e) {
    this.setData({ startDate: e.detail.value });
  },
  // 开始时间改变
  onStartTimeChange(e) {
    this.setData({ startTime: e.detail.value });
  },
  // 截止日期改变
  onDeadlineDateChange(e) {
    this.setData({ deadline: e.detail.value });
  },
  // 截止时间改变
  onDeadlineTimeChange(e) {
    this.setData({ deadlineTime: e.detail.value });
  },

  //清空表格
  clearConfirm() {
    const today = this.formatDate(new Date());
    this.setData({
      windowName: '',
      clientName: '',
      price: '',
      quantity: 1,
      description: '',
      settingInfo: '',
      referenceImages: [],
      startDate: today,
      deadline: '',
      startTime:'00:00',
      deadlineTime:'00:00'
    })
  },
  // 取消创建
  onCancel() {
    wx.showModal({
      title: '确认取消',
      content: '确定要取消创建排单吗？所有未保存的内容将会丢失。',
      confirmColor: '#E64340',
      success: (res) => {
        if (res.confirm) {
          this.clearConfirm()
          wx.navigateBack()
        }
      }
    });
  },

  // 提交表单
  onSubmit() {
    // 表单验证
    if (!this.validateForm()) {return;}
      
     // 拼接完整的日期时间字符串
     const startDateTime = this.data.startDate
     ? `${this.data.startDate} ${this.data.startTime || '00:00'}`
     : '';
   const deadlineDateTime = this.data.deadline
     ? `${this.data.deadline} ${this.data.deadlineTime || '00:00'}`
     : '';

    // 组装数据
    const orderData = {
      id: this.data.orderID,
      windowName: this.data.windowName,
      clientName: this.data.clientName,
      price: parseFloat(this.data.price),
      quantity: this.data.quantity,
      description: this.data.description,
      settingInfo: this.data.settingInfo,
      referenceImages: this.data.referenceImages,
      startDate: startDateTime,
      deadline: deadlineDateTime,
      totalTime: startDateTime && deadlineDateTime
        ? this.getDatesBetween(startDateTime, deadlineDateTime)
        : [],
      createTime: new Date(),
      status: 'pending', // 待开始 ;进行中;已结束
      totalAmount: parseFloat(this.data.price) * this.data.quantity//总收入
    };

    // 显示加载中
    wx.showLoading({
      title: '创建中...',
    });

    // 模拟API调用
    setTimeout(() => {
      wx.hideLoading();

      try {
        this.addorder(orderData);
        // console.log('创建排单数据:', this.data.order); 

        wx.showToast({
          title: '创建成功',
          icon: 'success',
          duration: 1500,
          success: () => {
            setTimeout(() => {
              // 返回上一页或跳转到排单列表
              this.clearConfirm()
              wx.navigateBack()
            }, 1000);
          }
        });
      } catch (error) {
        console.error('创建订单失败:', error);
        wx.showToast({
          title: '创建失败',
          icon: 'error'
        });
      }
    }, 1000);
  },

  // 表单验证
  validateForm() {
    if (!this.data.windowName.trim()) {
      wx.showToast({
        title: '请输入橱窗名称',
        icon: 'none'
      });
      return false;
    }

    if (!this.data.clientName.trim()) {
      wx.showToast({
        title: '请输入单主名',
        icon: 'none'
      });
      return false;
    }

    if (!this.data.price || parseFloat(this.data.price) <= 0) {
      wx.showToast({
        title: '请输入有效价格',
        icon: 'none'
      });
      return false;
    }

    if (this.data.quantity < 1) {
      wx.showToast({
        title: '数量至少为1',
        icon: 'none'
      });
      return false;
    }

    if (!this.data.description.trim()) {
      wx.showToast({
        title: '请输入要求描述',
        icon: 'none'
      });
      return false;
    }

    return true;
  }
});