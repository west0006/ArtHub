<template>
  <view class="login-container">
    <view class="logo-area">
      <image class="logo" src="/static/images/1.jpg" mode="widthFix"></image>
      <text class="app-name">艺栈</text>
      <text class="slogan">灵感·订单·素材·AI</text>
    </view>

    <block v-if="isLogin">
      <view class="user-info">
        <image class="avatar" :src="userInfo.avatarUrl" mode="aspectFill"></image>
        <text class="nickname">{{ userInfo.nickName }}</text>
      </view>
      <button class="logout-btn" @tap="onLogout">退出登录</button>
      <view class="tip">登录后可在不同设备同步数据</view>
    </block>

    <block v-else>
      <button class="wx-login-btn" @tap="wechatLogin">
        <van-icon name="wechat" size="40rpx" color="#fff" />
        微信一键登录
      </button>
      <view class="guest-btn" @tap="onGuest">暂不登录，继续使用</view>
      <view class="privacy-tip">
        点击登录即表示同意
        <text class="link" @tap="onPrivacy">《用户协议》</text>及
        <text class="link" @tap="onPrivacy">《隐私政策》</text>
      </view>
    </block>
  </view>
</template>

<script setup lang="ts">
  import { ref } from 'vue';
  import { onLoad } from '@dcloudio/uni-app';
  import { useStore } from '@/store';
  import { loginByWechat } from '@/api/auth';

  const store = useStore();
  const isLogin = ref(false);
  const userInfo = ref<any>({});

  onLoad(() => {
    if (store.isLogin) {
      isLogin.value = true;
      userInfo.value = store.userInfo;
    }
  });

  const wechatLogin = async () => {
    try {
      // 实际需调用 wx.login 获取 code，此处用测试 code
      const res = await loginByWechat({ code: 'dev_test_code' });
      uni.setStorageSync('token', res.accessToken);
      uni.setStorageSync('refreshToken', res.refreshToken);
      uni.setStorageSync('userInfo', res.user);
      store.setUser(res.user);
      isLogin.value = true;
      userInfo.value = res.user;
      uni.showToast({ title: '登录成功', icon: 'success' });
      setTimeout(() => uni.switchTab({ url: '/pages/resource/list' }), 1500);
    } catch (err : any) {
      uni.showToast({ title: err.message || '登录失败', icon: 'none' });
    }
  };

  const onLogout = () => {
    uni.removeStorageSync('token');
    uni.removeStorageSync('refreshToken');
    uni.removeStorageSync('userInfo');
    store.clearUser();
    isLogin.value = false;
    userInfo.value = null;
    uni.showToast({ title: '已退出', icon: 'success' });
  };

  const onGuest = () => uni.switchTab({ url: '/pages/resource/list' });
  const onPrivacy = () => { };
</script>
<!-- 样式沿用 login.wxss -->

<style>
  /* 登录页样式 - 夸克粗边框圆角风 + 绿色点缀 */

  page {
    background-color: #ffffff;
    /* 纯白背景 */
  }

  .login-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 100vh;
    padding: 60rpx 48rpx;
    box-sizing: border-box;
    background-color: #ffffff;
  }

  .logo-area {
    text-align: center;
    margin-bottom: 80rpx;
  }

  .logo {
    width: 160rpx;
    height: 160rpx;
    margin-bottom: 24rpx;
    border-radius: 8rpx;
    border: 6rpx solid #1a1a1a;
    /* 粗黑边框 */
    box-sizing: border-box;
  }

  .app-name {
    display: block;
    font-size: 42rpx;
    font-weight: 700;
    color: #1a1a1a;
    margin-bottom: 12rpx;
    letter-spacing: -0.5px;
  }

  .slogan {
    font-size: 24rpx;
    color: #5a5a5a;
    /* 次级文字 */
    font-weight: 500;
  }

  .user-info {
    display: flex;
    flex-direction: column;
    align-items: center;
    margin-bottom: 40rpx;
  }

  .avatar {
    width: 120rpx;
    height: 120rpx;
    border-radius: 8rpx;
    border: 6rpx solid #1a1a1a;
    margin-bottom: 20rpx;
    box-sizing: border-box;
  }

  .nickname {
    font-size: 30rpx;
    font-weight: 700;
    color: #1a1a1a;
  }

  /* 微信登录按钮 - 绿色背景，粗黑边框 */
  .wx-login-btn {
    width: 100%;
    background-color: #2e7d32;
    color: #ffffff;
    border-radius: 8rpx;
    height: 88rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 30rpx;
    font-weight: 700;
    gap: 12rpx;
    border: 6rpx solid #1a1a1a;
    margin-bottom: 24rpx;
    box-sizing: border-box;
  }

  .wx-login-btn::after {
    border: none;
  }

  /* 游客按钮 - 白底黑字，粗黑边框 */
  .guest-btn {
    width: 100%;
    text-align: center;
    font-size: 26rpx;
    font-weight: 600;
    color: #1a1a1a;
    padding: 24rpx 0;
    border-radius: 8rpx;
    background-color: #ffffff;
    border: 6rpx solid #1a1a1a;
    /* 粗黑边框 */
    margin-bottom: 48rpx;
    box-sizing: border-box;
  }

  /* 退出登录按钮 - 白底黑字，粗边框 */
  .logout-btn {
    width: 60%;
    background-color: #ffffff;
    color: #1a1a1a;
    border-radius: 8rpx;
    height: 80rpx;
    font-size: 26rpx;
    font-weight: 600;
    margin-bottom: 24rpx;
    border: 6rpx solid #1a1a1a;
    box-sizing: border-box;
  }

  .tip {
    font-size: 22rpx;
    color: #5a5a5a;
    text-align: center;
  }

  .privacy-tip {
    font-size: 22rpx;
    color: #5a5a5a;
    text-align: center;
    margin-top: 40rpx;
  }

  .link {
    color: #2e7d32;
    text-decoration: none;
    font-weight: 700;
    margin: 0 4rpx;
    border-bottom: 2rpx solid #2e7d32;
  }
</style>