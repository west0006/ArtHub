// pages/login/login.ts
import { loginByWechat } from '../../api/auth';
import { store } from '../../store/store';

Page({
  data: {
    isLogin: false,
    userInfo: null as any,
  },

  onLoad() {
    const app = getApp();
    if (app.globalData.isLogin) {
      this.setData({
        isLogin: true,
        userInfo: app.globalData.userInfo,
      });
    }
  },

  // 真实微信登录
  async wechatLogin() {
    try {
      // 1. 获取微信临时 code
      // const loginRes = await wx.login();
      // if (!loginRes.code) {
      //   throw new Error('获取微信登录凭证失败');
      // }

      // 2. 调用后端接口登录
      const res = await loginByWechat({
        // code: loginRes.code,
        code: 'dev_test_code',   //测试 code
        // 可在此处获取用户头像昵称（需用户授权），这里留空则后端使用默认值
      });

      // 3. 持久化存储
      wx.setStorageSync('token', res.accessToken);
wx.setStorageSync('refreshToken', res.refreshToken);
wx.setStorageSync('userInfo', res.user);

      // 4. 更新全局状态
      const app = getApp();
      app.globalData.userInfo = res.user;
      app.globalData.isLogin = true;
      store.setUser(res.user);

      wx.showToast({
        title: '登录成功',
        icon: 'success',
        duration: 1500,
        success: () => {
          setTimeout(() => {
            wx.switchTab({ url: '/pages/studios/studios' });
          }, 1500);
        },
      });
    } catch (err: any) {
      console.log(err)
      wx.showToast({
        title: err.message || '登录失败',
        icon: 'none',
      });
    }
  },

  // 退出登录
  onLogout() {
    wx.removeStorageSync('token');
    wx.removeStorageSync('refreshToken');
    wx.removeStorageSync('userInfo');
    getApp().globalData.isLogin = false;
    getApp().globalData.userInfo = null;
    store.clearUser();
    this.setData({
      isLogin: false,
      userInfo: null,
    });
    wx.showToast({ title: '已退出', icon: 'success' });
  },

  // 游客模式
  onGuest() {
    wx.switchTab({ url: '/pages/studios/studios' });
  },

  onPrivacy() {
    // 跳转协议页面
  },
});