<template>
  <view class="page-container">
    <!-- 顶部用户信息 -->
    <view class="user-header">
      <view class="user-avatar-section">
        <image class="user-avatar" :src="userInfo.avatarUrl || '/static/images/t1.png'" mode="aspectFill"></image>
        <view class="avatar-edit" @tap="onEditAvatar">
          <van-icon name="edit" size="32rpx" color="#ffffff" />
        </view>
      </view>
      <view class="user-info">
        <view class="user-name-section">
          <text class="user-name">{{ userInfo.nickname || '未登录用户' }}</text>
          <view class="edit-profile-btn" @tap="onEditProfile">
            <van-icon name="edit" size="28rpx" color="#666" />
          </view>
        </view>
        <view class="user-stats">
          <view class="stat-item">
            <text class="stat-value">{{ stats.orderCount || 0 }}</text>
            <text class="stat-label">排单</text>
          </view>
        </view>
      </view>
      <view class="settings-btn" @tap="onSettings">
        <van-icon name="setting-o" size="40rpx" color="#ffffff" />
      </view>
    </view>

    <!-- 数据概览卡片 -->
    <view class="overview-cards">
      <view class="overview-card income-card">
        <van-icon name="bill-o" size="48rpx" color="#0A6E51" />
        <view class="card-content">
          <text class="card-value">¥{{ stats.totalIncome || 0 }}</text>
          <text class="card-label">总收入</text>
        </view>
      </view>
      <view class="overview-card order-card">
        <van-icon name="completed" size="48rpx" color="#0A6E51" />
        <view class="card-content">
          <text class="card-value">{{ stats.completedOrders || 0 }}</text>
          <text class="card-label">已完成</text>
        </view>
      </view>
      <view class="overview-card pending-card">
        <van-icon name="clock-o" size="48rpx" color="#0A6E51" />
        <view class="card-content">
          <text class="card-value">{{ stats.pendingOrders || 0 }}</text>
          <text class="card-label">进行中</text>
        </view>
      </view>
    </view>

    <!-- 功能网格 -->
    <view class="function-grid">
      <view class="grid-items">
        <view class="grid-item" @tap="gotoMyMaterials">
          <van-icon name="photo-o" size="56rpx" color="#0A6E51" />
          <text class="item-label">资源库</text>
          <text class="item-count">{{ stats.materialCount || 0 }}</text>
        </view>
        <view class="grid-item" @tap="navigateToOrders">
          <van-icon name="notes-o" size="56rpx" color="#0A6E51" />
          <text class="item-label">排单总览</text>
          <text class="item-count">{{ stats.orderCount || 0 }}</text>
        </view>
        <view class="grid-item" @tap="gotoIncome">
          <van-icon name="gold-coin-o" size="56rpx" color="#0A6E51" />
          <text class="item-label">账单</text>
        </view>
      </view>
    </view>

    <!-- 最近排单 -->
    <view class="recent-orders">
      <view class="section-header">
        <text class="section-title">最近排单</text>
        <text class="section-more" @tap="navigateToOrders">查看全部 ›</text>
      </view>
      <view class="orders-list">
        <view class="order-item" v-for="item in recentOrders" :key="item.id" @tap="onOrderTap" :data-id="item.id">
          <view class="order-header">
            <text class="order-title">{{ item.title }}</text>
            <view class="order-status" :class="item.status">
              <van-icon :name="getStatusIcon(item.status)" size="24rpx" :color="getStatusColor(item.status)" />
              <text v-if="item.status === 'pending'">待开始</text>
              <text v-else-if="item.status === 'progress'">进行中</text>
              <text v-else-if="item.status === 'completed'">已完成</text>
            </view>
          </view>
          <view class="order-meta">
            <view class="order-client">
              <van-icon name="user-o" size="24rpx" color="#666666" />
              <text>{{ item.client }}</text>
            </view>
            <view class="order-deadline">
              <van-icon name="calendar-o" size="24rpx" color="#666666" />
              <text>截止: {{ item.deadline }}</text>
            </view>
          </view>
          <view class="order-footer">
            <text class="order-price">¥{{ item.price }}</text>
          </view>
        </view>

        <view class="empty-state" v-if="recentOrders.length === 0">
          <van-icon name="description" size="80rpx" color="#cccccc" />
          <text class="empty-text">暂无进行中的排单</text>
          <text class="empty-subtext">快去创建你的第一个排单吧</text>
        </view>
      </view>
    </view>

    <view class="bottom-safe-area" style="height: 40rpx;"></view>
  </view>
</template>

<script setup lang="ts">
  import { ref, reactive, } from 'vue';
  import { onShow } from '@dcloudio/uni-app';
  import { useStore } from '@/store';

  const store = useStore();

  const userInfo = ref<any>({});
  const stats = reactive({
    orderCount: 0,
    totalIncome: 0,
    completedOrders: 0,
    pendingOrders: 0,
    materialCount: 0,
    tutorialCount: 0,
  });

  const recentOrders = ref<any[]>([]);

  const loadDashboardData = () => {
    if (store.order.length === 0) {
      store.fetchOrders().then(() => calculateStats());
    } else {
      calculateStats();
    }
  };

  const calculateStats = () => {
    const orders = store.order;
    const completedOrders = orders.filter(o => o.status === 'completed');
    const pendingOrders = orders.filter(o => o.status === 'pending' || o.status === 'progress');
    stats.orderCount = orders.length;
    stats.totalIncome = completedOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
    stats.completedOrders = completedOrders.length;
    stats.pendingOrders = pendingOrders.length;
    stats.materialCount = store.materialLibrary.length;
    stats.tutorialCount = 15; // mock

    const sorted = orders
      .sort((a, b) => new Date(b.createTime).getTime() - new Date(a.createTime).getTime())
      .slice(0, 3);
    recentOrders.value = sorted.map(order => ({
      id: order.id,
      title: order.windowName || '未命名订单',
      client: order.clientName || '未知客户',
      price: order.totalAmount,
      deadline: order.deadline,
      status: order.status,
    }));
  };

  const getStatusIcon = (status : string) => {
    const map : Record<string, string> = { pending: 'clock-o', progress: 'underway-o', completed: 'passed' };
    return map[status] || 'info-o';
  };
  const getStatusColor = (status : string) => {
    const map : Record<string, string> = { pending: '#856404', progress: '#0c5460', completed: '#155724' };
    return map[status] || '#666666';
  };

  const onEditAvatar = () => {
    uni.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        uni.showLoading({ title: '上传中...' });
        setTimeout(() => {
          uni.hideLoading();
          userInfo.value.avatarUrl = res.tempFiles[0].tempFilePath;
          uni.showToast({ title: '头像更新成功', icon: 'success' });
        }, 1500);
      },
    });
  };
  const onEditProfile = () => uni.navigateTo({ url: '/pages/contact/edit' });
  const onSettings = () => uni.navigateTo({ url: '/pages/settings' });
  const gotoIncome = () => uni.navigateTo({ url: '/pages/contact/income' });
  const gotoMyMaterials = () => uni.navigateTo({ url: '/pages/contact/lib' });
  const navigateToOrders = () => uni.navigateTo({ url: '/pages/order/manage' });
  const onOrderTap = (e : any) => {
    const id = e.currentTarget.dataset.id;
    uni.navigateTo({ url: `/pages/order/detail?id=${id}` });
  };

  onShow(() => {
    userInfo.value = store.userInfo || {};
    loadDashboardData();
  });
</script>

<style scoped>
  page {
    background-color: #ffffff;
  }

  .page-container {
    background-color: #ffffff;
  }

  .user-header {
    display: flex;
    align-items: flex-start;
    padding: 60rpx 32rpx 40rpx;
    background: #2e7d32;
    color: #ffffff;
    position: relative;
    border-bottom: 6rpx solid #1a1a1a;
  }

  .user-avatar {
    width: 140rpx;
    height: 140rpx;
    border: 6rpx solid #1a1a1a;
    border-radius: 8rpx;
    background-color: #ffffff;
  }

  .avatar-edit {
    position: absolute;
    bottom: 0;
    right: 0;
    width: 48rpx;
    height: 48rpx;
    background-color: #1a1a1a;
    border: 4rpx solid #ffffff;
    border-radius: 6rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #ffffff;
  }

  .user-info {
    flex: 1;
  }

  .user-name {
    font-size: 38rpx;
    font-weight: 700;
    margin-right: 20rpx;
    color: #ffffff;
  }

  .user-stats {
    display: flex;
    gap: 40rpx;
  }

  .stat-item {
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .stat-value {
    font-size: 30rpx;
    font-weight: 700;
    margin: 8rpx;
    color: #ffffff;
  }

  .stat-label {
    font-size: 20rpx;
    opacity: 0.8;
    color: #ffffff;
  }

  .settings-btn {
    width: 64rpx;
    height: 64rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: #1a1a1a;
    border: 4rpx solid #ffffff;
    border-radius: 6rpx;
    color: #ffffff;
  }

  .overview-cards {
    display: flex;
    padding: 0 32rpx;
    margin-top: 40rpx;
    gap: 24rpx;
  }

  .overview-card {
    flex: 1;
    background-color: #ffffff;
    border: 4rpx solid #1a1a1a;
    border-radius: 8rpx;
    padding: 32rpx 24rpx;
    display: flex;
    align-items: center;
  }

  .card-value {
    font-size: 30rpx;
    font-weight: 700;
    color: #1a1a1a;
    margin-bottom: 8rpx;
  }

  .card-label {
    font-size: 20rpx;
    color: #5a5a5a;
  }

  .function-grid {
    background-color: #ffffff;
    margin: 32rpx;
    border: 4rpx solid #1a1a1a;
    border-radius: 8rpx;
    padding: 32rpx;
  }

  .grid-items {
    display: flex;
    flex-wrap: wrap;
    gap: 32rpx;
  }

  .grid-item {
    width: calc(33.333% - 22rpx);
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 32rpx 0;
    border: 4rpx solid #1a1a1a;
    border-radius: 4rpx;
  }

  .item-label {
    font-size: 22rpx;
    color: #1a1a1a;
    margin-bottom: 12rpx;
    font-weight: 700;
  }

  .item-count {
    font-size: 18rpx;
    color: #5a5a5a;
  }

  .recent-orders {
    background-color: #ffffff;
    margin: 32rpx;
    border: 4rpx solid #1a1a1a;
    border-radius: 8rpx;
    padding: 32rpx;
  }

  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 32rpx;
  }

  .section-title {
    font-size: 30rpx;
    font-weight: 700;
    color: #1a1a1a;
  }

  .section-more {
    font-size: 24rpx;
    color: #2e7d32;
    font-weight: 700;
  }

  .order-item {
    padding: 24rpx;
    border: 4rpx solid #1a1a1a;
    border-radius: 4rpx;
    border-left-width: 8rpx;
    border-left-color: #2e7d32;
    margin-bottom: 24rpx;
  }

  .order-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16rpx;
  }

  .order-title {
    font-size: 26rpx;
    font-weight: 700;
    color: #1a1a1a;
    flex: 1;
  }

  .order-status {
    display: flex;
    align-items: center;
    gap: 8rpx;
    padding: 6rpx 14rpx;
    border-radius: 4rpx;
    font-size: 18rpx;
    font-weight: 700;
    border: 2rpx solid #1a1a1a;
  }

  .order-status.pending {
    background-color: #ffffff;
    color: #1a1a1a;
  }

  .order-status.progress {
    background-color: #2e7d32;
    color: #ffffff;
  }

  .order-status.completed {
    background-color: #1a1a1a;
    color: #ffffff;
  }

  .order-meta {
    display: flex;
    justify-content: space-between;
    margin-bottom: 20rpx;
  }

  .order-price {
    font-size: 24rpx;
    font-weight: 700;
    color: #1a1a1a;
  }
</style>