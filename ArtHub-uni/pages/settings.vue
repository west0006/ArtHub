<template>
  <view class="page-container settings-page">
    <view class="user-card" @tap="onEditProfile">
      <image class="avatar" :src="userInfo.avatarUrl || '/static/images/t1.png'" mode="aspectFill" />
      <view class="user-info">
        <text class="nickname">{{ userInfo.nickname || '未登录用户' }}</text>
        <text class="uid">ID: {{ userInfo.id || '---' }}</text>
      </view>
      <van-icon name="arrow" size="28rpx" color="#999" />
    </view>

    <view class="settings-group">
      <view class="setting-item" @tap="onEditProfile">
        <van-icon name="edit" size="36rpx" color="#333" />
        <text class="item-text">编辑资料</text>
        <van-icon name="arrow" size="28rpx" color="#ccc" />
      </view>
      <view class="setting-item" @tap="onClearCache">
        <van-icon name="delete-o" size="36rpx" color="#333" />
        <text class="item-text">清除缓存</text>
        <text class="item-desc">{{ cacheSize }}</text>
        <van-icon name="arrow" size="28rpx" color="#ccc" />
      </view>
      <view class="setting-item" @tap="onAbout">
        <van-icon name="info-o" size="36rpx" color="#333" />
        <text class="item-text">关于艺栈</text>
        <text class="item-desc">{{ version }}</text>
        <van-icon name="arrow" size="28rpx" color="#ccc" />
      </view>
    </view>

    <view class="logout-section" v-if="userInfo">
      <button class="logout-btn" @tap="onLogout">退出登录</button>
    </view>
  </view>
</template>

<script setup lang="ts">
  import { ref } from 'vue';
  import { onLoad, onShow } from '@dcloudio/uni-app';
  import { useStore } from '@/store';

  const store = useStore();
  const userInfo = ref<any>(null);
  const cacheSize = ref('0KB');
  const version = ref('1.0.0');

  const loadUserInfo = () => {
    userInfo.value = store.userInfo || {};
  };
  const calcCacheSize = () => {
    const info = uni.getStorageInfoSync();
    const sizeKB = Math.round((info.currentSize || 0) / 1024);
    cacheSize.value = sizeKB > 0 ? `${sizeKB}KB` : '0KB';
  };

  const onEditProfile = () => uni.navigateTo({ url: '/pages/contact/edit' });
  const onClearCache = () => {
    uni.showModal({
      title: '清除缓存',
      content: '将清除所有本地缓存数据（不包含登录状态），确定继续吗？',
      confirmColor: '#E64340',
      success: (res) => {
        if (res.confirm) {
          const token = uni.getStorageSync('token');
          const user = uni.getStorageSync('userInfo');
          uni.clearStorageSync();
          if (token) uni.setStorageSync('token', token);
          if (user) uni.setStorageSync('userInfo', user);
          calcCacheSize();
          uni.showToast({ title: '缓存已清除', icon: 'success' });
        }
      },
    });
  };
  const onAbout = () => {
    uni.showModal({
      title: '关于艺栈',
      content: '版本：1.0.0\n灵感·订单·素材·AI\n\n为创意工作者打造的效率工具',
      showCancel: false,
      confirmText: '知道了',
    });
  };
  const onLogout = () => {
    uni.showModal({
      title: '退出登录',
      content: '退出后需重新登录，确定退出吗？',
      confirmColor: '#E64340',
      success: (res) => {
        if (res.confirm) {
          uni.removeStorageSync('token');
          uni.removeStorageSync('userInfo');
          store.clearUser();
          uni.reLaunch({ url: '/pages/auth/login' });
        }
      },
    });
  };

  onLoad(() => {
    loadUserInfo();
    calcCacheSize();
  });
  onShow(() => loadUserInfo());
</script>
<!-- 样式沿用 settings.wxss -->
<style>
  /* 引入全局变量：border-thin、border-thick、border-top-light、border-bottom-dark、
     accent-green、large-plate、title-content 等已在 app.wxss 中定义 */

  .settings-page {
    background: var(--bg-page, #ffffff);
    min-height: 100vh;
  }

  /* 导航栏 – 简洁版 */
  .nav-header {
    display: flex;
    align-items: center;
    padding: 20rpx var(--large-plate);
    background: var(--bg-surface, #ffffff);
    border-bottom: var(--border-thin) solid var(--border-top-light);
  }

  .nav-title {
    flex: 1;
    text-align: center;
    font-size: 36rpx;
    font-weight: 700;
    color: var(--text-primary);
  }

  /* 用户信息卡片 – 夸克粗边框 */
  .user-card {
    display: flex;
    align-items: center;
    background: var(--bg-surface);
    margin: var(--large-module) var(--large-plate);
    padding: var(--title-content);
    border-top: var(--border-thin) solid var(--border-top-light);
    border-left: var(--border-thin) solid var(--border-top-light);
    border-right: var(--border-thick) solid var(--border-bottom-dark);
    border-bottom: var(--border-thick) solid var(--border-bottom-dark);
    border-radius: 8rpx;
    box-shadow: none;
  }

  .user-card:active {
    background: var(--primary-black, #1a1a1a);
  }

  .user-card:active .nickname,
  .user-card:active .uid {
    color: #ffffff;
  }

  .avatar {
    width: 100rpx;
    height: 100rpx;
    border-radius: 50%;
    background: var(--extra-light, #eee);
    margin-right: 20rpx;
    border: var(--border-thin) solid var(--border-top-light);
  }

  .user-info {
    flex: 1;
  }

  .nickname {
    font-size: 34rpx;
    font-weight: 700;
    color: var(--text-primary);
  }

  .uid {
    font-size: 26rpx;
    color: var(--text-secondary);
    margin-top: 4rpx;
  }

  /* 设置列表组 – 整体卡片效果 */
  .settings-group {
    margin: 0 var(--large-plate) var(--large-module);
    background: var(--bg-surface);
    border-top: var(--border-thin) solid var(--border-top-light);
    border-left: var(--border-thin) solid var(--border-top-light);
    border-right: var(--border-thick) solid var(--border-bottom-dark);
    border-bottom: var(--border-thick) solid var(--border-bottom-dark);
    border-radius: 8rpx;
    overflow: hidden;
  }

  .setting-item {
    display: flex;
    align-items: center;
    padding: 24rpx var(--title-content);
    border-bottom: var(--border-thin) solid var(--border-top-light);
  }

  .setting-item:last-child {
    border-bottom: none;
  }

  .setting-item:active {
    background: var(--primary-black);
  }

  .setting-item:active .item-text,
  .setting-item:active .item-desc {
    color: #ffffff;
  }

  .item-text {
    flex: 1;
    margin-left: 20rpx;
    font-size: 30rpx;
    font-weight: 500;
    color: var(--text-primary);
  }

  .item-desc {
    font-size: 26rpx;
    color: var(--text-secondary);
    margin-right: 8rpx;
  }

  /* 退出登录按钮 – 夸克按钮风格 */
  .logout-section {
    padding: 40rpx var(--large-plate) 0;
  }

  .logout-btn {
    width: 100%;
    background: var(--bg-surface);
    color: var(--com-color-warn, #e74c3c);
    border-top: var(--border-thin) solid var(--border-top-light);
    border-left: var(--border-thin) solid var(--border-top-light);
    border-right: var(--border-thick) solid var(--border-bottom-dark);
    border-bottom: var(--border-thick) solid var(--border-bottom-dark);
    border-radius: 8rpx;
    font-size: 34rpx;
    font-weight: 700;
    padding: 24rpx;
    box-shadow: none;
  }

  .logout-btn:active {
    background: var(--com-color-warn, #e74c3c);
    color: #ffffff;
    border-color: var(--com-color-warn);
  }
</style>