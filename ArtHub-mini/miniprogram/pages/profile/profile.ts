import request from '../../utils/request';
import { store } from '../../store/store';

Page({
  data: {
    userInfo: null as any,
    originalNickname: '',
    originalPhone: '',
    avatarUrl: '',
    nickname: '',
    phone: '',
    canSave: false,
  },

  onLoad() {
    // 从全局或 store 获取用户信息
    const user = store.userInfo || getApp().globalData.userInfo;
    if (user) {
      this.setData({
        userInfo: user,
        avatarUrl: user.avatarUrl || '',
        nickname: user.nickname || '',
        phone: user.phone || '',
        originalNickname: user.nickname || '',
        originalPhone: user.phone || '',
      });
    }
  },

  // 选择头像
  onChooseAvatar() {
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const tempFilePath = res.tempFiles[0].tempFilePath;
        // 模拟上传（实际应上传到服务器或云存储，这里简化使用临时路径）
        wx.showLoading({ title: '上传中...' });
        setTimeout(() => {
          this.setData({ avatarUrl: tempFilePath });
          wx.hideLoading();
          wx.showToast({ title: '头像更新成功', icon: 'success' });
          this.checkCanSave();
        }, 1000);
      }
    });
  },

  // 输入昵称
  onNicknameInput(e: any) {
    this.setData({ nickname: e.detail.value });
    this.checkCanSave();
  },

  // 输入手机号
  onPhoneInput(e: any) {
    this.setData({ phone: e.detail.value });
    this.checkCanSave();
  },

  // 检查是否有修改
  checkCanSave() {
    const { nickname, originalNickname, phone, originalPhone, avatarUrl, userInfo } = this.data;
    const changed =
      nickname !== originalNickname ||
      phone !== originalPhone ||
      avatarUrl !== (userInfo.avatarUrl || '');
    this.setData({ canSave: changed });
  },

  // 保存修改
  async saveProfile() {
    if (!this.data.canSave) return;
    wx.showLoading({ title: '保存中...' });
    try {
      const res = await request({
        url: '/auth/profile',
        method: 'PUT',
        data: {
          nickname: this.data.nickname || '',
          avatarUrl: this.data.avatarUrl || '',
          phone: this.data.phone || '',
        },
      });
      // 更新全局和 store 中的用户信息
      const updatedUser = { ...(store.userInfo || {}), ...res };
      store.setUser(updatedUser);
      getApp().globalData.userInfo = updatedUser;
      wx.setStorageSync('userInfo', updatedUser);

      this.setData({
        userInfo: updatedUser,
        originalNickname: updatedUser.nickname,
        originalPhone: updatedUser.phone || '',
      });
      wx.hideLoading();
      wx.showToast({ title: '保存成功', icon: 'success' });
      this.setData({ canSave: false });
    } catch (err) {
      wx.hideLoading();
      wx.showToast({ title: '保存失败', icon: 'none' });
    }
  },

  // 返回
  onBack() {
    wx.navigateBack();
  },
});