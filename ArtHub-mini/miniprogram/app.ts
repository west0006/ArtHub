import { getUserProfile, refreshToken } from './api/auth';
import { store } from './store/store';

App({
  globalData: {
    userInfo: null as any,
    isLogin: false,
  },

  onLaunch() {
    this.checkLoginStatus();
  },

  async checkLoginStatus() {
    const refreshTokenStr = wx.getStorageSync('refreshToken');
    if (refreshTokenStr) {
      try {
        const res = await refreshToken(refreshTokenStr);
        // 刷新成功，存储新 token
        wx.setStorageSync('token', res.accessToken);
        wx.setStorageSync('refreshToken', res.refreshToken);
        this.globalData.userInfo = res.user;
        this.globalData.isLogin = true;
        store.setUser(res.user);
        console.log('自动登录成功', res.user);
      } catch (err) {
        wx.removeStorageSync('token');
        wx.removeStorageSync('refreshToken');
        wx.removeStorageSync('userInfo');
        store.clearUser();
        console.log('自动登录失败，请重新登录');
      }
    } else {
      // 无 refreshToken，尝试用现有 token 获取用户信息
      const token = wx.getStorageSync('token');
      if (token) {
        try {
          const user = await getUserProfile();
          this.globalData.userInfo = user;
          this.globalData.isLogin = true;
          store.setUser(user);
        } catch (err) {
          wx.removeStorageSync('token');
          store.clearUser();
        }
      }
    }
  },
});