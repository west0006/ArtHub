import { store } from '../../store/store';

Page({
  data: {
    userInfo: null as any,
    cacheSize: '0KB',
    version: '1.0.0',
  },

  onLoad() {
    this.loadUserInfo();
    this.calcCacheSize();
  },

  onShow() {
    this.loadUserInfo();
  },

  // 加载用户信息
  loadUserInfo() {
    const user = store.userInfo || getApp().globalData.userInfo;
    this.setData({ userInfo: user });
  },

  // 计算缓存大小
  calcCacheSize() {
    // 简单估算，实际可遍历 storage
    const info = wx.getStorageInfoSync();
    const sizeKB = Math.round((info.currentSize || 0) / 1024);
    this.setData({
      cacheSize: sizeKB > 0 ? `${sizeKB}KB` : '0KB',
    });
  },

  // 编辑资料
  onEditProfile() {
    wx.navigateTo({ url: '/pages/profile/profile' });
  },

  // 清除缓存
  onClearCache() {
    wx.showModal({
      title: '清除缓存',
      content: '将清除所有本地缓存数据（不包含登录状态），确定继续吗？',
      confirmColor: '#E64340',
      success: (res) => {
        if (res.confirm) {
          // 保留 token 和 userInfo
          const token = wx.getStorageSync('token');
          const userInfo = wx.getStorageSync('userInfo');
          wx.clearStorageSync();
          if (token) wx.setStorageSync('token', token);
          if (userInfo) wx.setStorageSync('userInfo', userInfo);
          this.calcCacheSize();
          wx.showToast({ title: '缓存已清除', icon: 'success' });
        }
      }
    });
  },

  // 退出登录
  onLogout() {
    wx.showModal({
      title: '退出登录',
      content: '退出后需重新登录，确定退出吗？',
      confirmColor: '#E64340',
      success: (res) => {
        if (res.confirm) {
          // 清除登录态
          wx.removeStorageSync('token');
          wx.removeStorageSync('userInfo');
          store.clearUser();
          getApp().globalData.isLogin = false;
          getApp().globalData.userInfo = null;
          wx.reLaunch({ url: '/pages/login/login' });
        }
      }
    });
  },

  // 关于我们
  onAbout() {
    wx.showModal({
      title: '关于艺栈',
      content: '版本：1.0.0\n灵感·订单·素材·AI\n\n为创意工作者打造的效率工具',
      showCancel: false,
      confirmText: '知道了',
    });
  },

  // 返回
  onBack() {
    wx.navigateBack();
  },
});