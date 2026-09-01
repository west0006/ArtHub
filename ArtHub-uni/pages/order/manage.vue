<template>
  <view class="page-container">
    <!-- 状态标签栏 -->
    <view class="tabs-container">
      <view class="tabs">
        <view class="tab" :class="{ active: currentTab === 'all' }" @tap="onTabChange" data-tab="all">
          <text>全部订单</text>
          <text class="tab-count">({{ orderCounts.all }})</text>
        </view>
        <view class="tab" :class="{ active: currentTab === 'completed' }" @tap="onTabChange" data-tab="completed">
          <text>已完成</text>
          <text class="tab-count">({{ orderCounts.completed }})</text>
        </view>
        <view class="tab" :class="{ active: currentTab === 'progress' }" @tap="onTabChange" data-tab="progress">
          <text>进行中</text>
          <text class="tab-count">({{ orderCounts.progress }})</text>
        </view>
        <view class="tab" :class="{ active: currentTab === 'pending' }" @tap="onTabChange" data-tab="pending">
          <text>待开始</text>
          <text class="tab-count">({{ orderCounts.pending }})</text>
        </view>
      </view>
      <view class="tab-indicator" :style="{ transform: `translateX(${tabIndicatorPosition}%)` }"></view>
    </view>

    <!-- 订单列表 -->
    <scroll-view class="orders-scroll" scroll-y>
      <view class="orders-list">
        <view class="order-item" v-for="item in filteredOrders" :key="item.id" @tap="onOrderTap" :data-id="item.id">
          <view class="order-header">
            <text class="order-title">{{ item.windowName || '未命名订单' }}</text>
            <view class="order-status" :class="item.status">
              <van-icon :name="getStatusIcon(item.status)" size="20rpx" :color="getStatusColor(item.status)" />
              <text v-if="item.status === 'pending'">待开始</text>
              <text v-else-if="item.status === 'progress'">进行中</text>
              <text v-else-if="item.status === 'completed'">已完成</text>
            </view>
          </view>
          <view class="order-meta">
            <view class="meta-row">
              <view class="meta-item">
                <van-icon name="user-o" size="24rpx" color="#666666" />
                <text class="meta-text">{{ item.clientName || '未知客户' }}</text>
              </view>
              <view class="meta-item">
                <van-icon name="cash-o" size="24rpx" color="#666666" />
                <text class="meta-text">¥{{ item.totalAmount || 0 }}</text>
              </view>
            </view>
            <view class="meta-row">
              <view class="meta-item">
                <van-icon name="calendar-o" size="24rpx" color="#666666" />
                <text class="meta-text">{{ item.startDate || '未设置' }}</text>
              </view>
              <view class="meta-item">
                <van-icon name="clock-o" size="24rpx" color="#666666" />
                <text class="meta-text">{{ item.deadline || '未设置' }}</text>
              </view>
            </view>
          </view>
          <view class="order-actions">
            <view class="action-btn edit" @tap.stop="onEditOrder" :data-id="item.id">
              <van-icon name="edit" size="24rpx" color="#0A6E51" />
              <text>编辑</text>
            </view>
            <view class="action-btn status" @tap.stop="onChangeStatus" :data-id="item.id" :data-status="item.status">
              <van-icon name="exchange" size="24rpx" color="#1989fa" />
              <text>改状态</text>
            </view>
            <view class="action-btn delete" @tap.stop="onDeleteOrder" :data-id="item.id">
              <van-icon name="delete" size="24rpx" color="#E64340" />
              <text>删除</text>
            </view>
          </view>
        </view>

        <view class="empty-state" v-if="filteredOrders.length === 0">
          <van-icon name="description" size="120rpx" color="#cccccc" />
          <text class="empty-text">
            {{ currentTab === 'all' ? '暂无订单' : currentTab === 'completed' ? '暂无已完成订单' : currentTab === 'progress' ? '暂无进行中订单' : '暂无待开始订单' }}
          </text>
          <text class="empty-subtext" v-if="currentTab !== 'all'">试试查看其他状态的订单</text>
        </view>
      </view>
    </scroll-view>

    <!-- 创建订单按钮 -->
    <view class="create-order-btn" @tap="onCreateOrder">
      <van-icon name="plus" size="48rpx" color="#ffffff" />
    </view>
    <view class="bottom-safe-area"></view>
  </view>
</template>

<script setup lang="ts">
  import { ref, reactive, computed } from 'vue';
  import { onShow } from '@dcloudio/uni-app';
  import { useStore } from '@/store';

  const store = useStore();

  const currentTab = ref<'all' | 'completed' | 'progress' | 'pending'>('all');
  const orderCounts = reactive({
    all: 0,
    completed: 0,
    progress: 0,
    pending: 0
  });
  const tabIndicatorPosition = ref(0);

  const calculateOrderCounts = () => {
    const orders = store.order;
    orderCounts.all = orders.length;
    orderCounts.completed = orders.filter(o => o.status === 'completed').length;
    orderCounts.progress = orders.filter(o => o.status === 'progress').length;
    orderCounts.pending = orders.filter(o => o.status === 'pending').length;
  };

  const filteredOrders = computed(() => {
    let list = store.order;
    switch (currentTab.value) {
      case 'completed': list = list.filter(o => o.status === 'completed'); break;
      case 'progress': list = list.filter(o => o.status === 'progress'); break;
      case 'pending': list = list.filter(o => o.status === 'pending'); break;
    }
    return list.sort((a, b) => new Date(b.createTime).getTime() - new Date(a.createTime).getTime());
  });

  const calculateTabIndicatorPosition = () => {
    const pos : Record<string, number> = { all: 0, completed: 100, progress: 200, pending: 300 };
    tabIndicatorPosition.value = pos[currentTab.value];
  };

  const onTabChange = (e : any) => {
    currentTab.value = e.currentTarget.dataset.tab;
    calculateTabIndicatorPosition();
  };

  const getStatusText = (status : string) => {
    const map : Record<string, string> = { pending: '待开始', progress: '进行中', completed: '已完成' };
    return map[status] || '未知';
  };
  const getStatusIcon = (status : string) => {
    const map : Record<string, string> = { pending: 'clock-o', progress: 'underway-o', completed: 'passed' };
    return map[status] || 'info-o';
  };
  const getStatusColor = (status : string) => {
    const map : Record<string, string> = { pending: '#856404', progress: '#0c5460', completed: '#155724' };
    return map[status] || '#666666';
  };

  const onBack = () => uni.navigateBack();
  const onCreateOrder = () => uni.navigateTo({ url: '/pages/order/add' });

  const onOrderTap = (e : any) => {
    const id = e.currentTarget.dataset.id;
    uni.navigateTo({ url: `/pages/order/detail?id=${id}` });
  };

  const onEditOrder = (e : any) => {
    const id = e.currentTarget.dataset.id;
    uni.navigateTo({ url: `/pages/order/edit?id=${id}` });
  };

  const onChangeStatus = (e : any) => {
    const id = e.currentTarget.dataset.id;
    const currentStatus = e.currentTarget.dataset.status;
    let newStatus = 'progress';
    let confirmText = '';

    if (currentStatus === 'pending') {
      newStatus = 'progress';
      confirmText = '确定要将订单标记为进行中吗？';
    } else if (currentStatus === 'progress') {
      newStatus = 'completed';
      confirmText = '确定要将订单标记为已完成吗？';
    } else if (currentStatus === 'completed') {
      newStatus = 'pending';
      confirmText = '确定要将订单重新标记为待开始吗？';
    }

    uni.showModal({
      title: '修改状态',
      content: confirmText,
      success: (res) => {
        if (res.confirm) {
          store.changestatus(id, newStatus);
          uni.showToast({ title: '状态更新成功', icon: 'success' });
          setTimeout(() => {
            calculateOrderCounts();
          }, 500);
        }
      }
    });
  };

  const onDeleteOrder = (e : any) => {
    const id = e.currentTarget.dataset.id;
    uni.showModal({
      title: '删除订单',
      content: '确定要删除这个订单吗？此操作不可恢复。',
      confirmColor: '#E64340',
      success: (res) => {
        if (res.confirm) {
          store.removeorder(id);
          uni.showToast({ title: '订单删除成功', icon: 'success' });
          setTimeout(() => {
            calculateOrderCounts();
          }, 500);
        }
      }
    });
  };

  onShow(() => {
    calculateOrderCounts();
  });
</script>

<style scoped>
  .page-container {
    background-color: #ffffff;
    min-height: 100vh;
  }

  .tabs-container {
    background-color: #ffffff;
    position: relative;
    border-bottom: 4rpx solid #1a1a1a;
  }

  .tabs {
    display: flex;
    padding: 0 32rpx;
  }

  .tab {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 24rpx 0;
    font-size: 28rpx;
    font-weight: 500;
    color: #5a5a5a;
  }

  .tab.active {
    color: #2e7d32;
    font-weight: 700;
  }

  .tab-count {
    font-size: 20rpx;
    margin-top: 4rpx;
  }

  .tab-indicator {
    position: absolute;
    bottom: -2rpx;
    left: 0;
    width: 25%;
    height: 6rpx;
    background-color: #2e7d32;
    border: 2rpx solid #1a1a1a;
    box-sizing: border-box;
    transition: transform 0.2s ease;
  }

  .orders-scroll {
    height: calc(100vh - 240rpx);
  }

  .orders-list {
    padding: 24rpx 32rpx;
  }

  .order-item {
    background-color: #ffffff;
    border-radius: 8rpx;
    padding: 28rpx;
    margin-bottom: 24rpx;
    border-top: 2rpx solid #cccccc;
    border-left: 2rpx solid #cccccc;
    border-right: 6rpx solid #1a1a1a;
    border-bottom: 6rpx solid #1a1a1a;
    box-sizing: border-box;
  }

  .order-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 24rpx;
  }

  .order-title {
    font-size: 32rpx;
    font-weight: 700;
    color: #1a1a1a;
    flex: 1;
    margin-right: 20rpx;
  }

  .order-status {
    display: flex;
    align-items: center;
    gap: 8rpx;
    padding: 8rpx 16rpx;
    border: 3rpx solid #1a1a1a;
    border-radius: 6rpx;
    font-size: 20rpx;
    font-weight: 700;
    white-space: nowrap;
    background-color: #ffffff;
    color: #1a1a1a;
  }

  .order-status.pending {
    border-left-width: 8rpx;
    border-left-color: #2e7d32;
  }

  .order-status.progress {
    border-left-width: 8rpx;
    border-left-color: #2e7d32;
    background-color: #2e7d32;
    color: #ffffff;
  }

  .order-status.completed {
    border-left-width: 8rpx;
    border-left-color: #1a1a1a;
    background-color: #1a1a1a;
    color: #ffffff;
  }

  .order-meta {
    margin-bottom: 24rpx;
  }

  .meta-row {
    display: flex;
    justify-content: space-between;
    margin-bottom: 16rpx;
  }

  .meta-item {
    display: flex;
    align-items: center;
    gap: 8rpx;
    flex: 1;
  }

  .meta-text {
    font-size: 24rpx;
    color: #5a5a5a;
    font-weight: 500;
  }

  .order-actions {
    display: flex;
    gap: 16rpx;
    border-top: 3rpx solid #1a1a1a;
    padding-top: 24rpx;
  }

  .action-btn {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8rpx;
    padding: 16rpx;
    border-radius: 6rpx;
    font-size: 22rpx;
    font-weight: 700;
    border-top: 2rpx solid #cccccc;
    border-left: 2rpx solid #cccccc;
    border-right: 5rpx solid #1a1a1a;
    border-bottom: 5rpx solid #1a1a1a;
    box-sizing: border-box;
  }

  .action-btn:active {
    transform: translateY(2rpx);
    border-top: 4rpx solid #1a1a1a;
    border-left: 4rpx solid #1a1a1a;
    border-right: 2rpx solid #cccccc;
    border-bottom: 2rpx solid #cccccc;
  }

  .action-btn.edit {
    background-color: #ffffff;
    color: #2e7d32;
  }

  .action-btn.status {
    background-color: #ffffff;
    color: #1a1a1a;
  }

  .action-btn.delete {
    background-color: #ffffff;
    color: #1a1a1a;
  }

  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 120rpx 0;
    text-align: center;
  }

  .empty-text {
    font-size: 32rpx;
    color: #1a1a1a;
    font-weight: 700;
    margin-bottom: 16rpx;
  }

  .empty-subtext {
    font-size: 26rpx;
    color: #5a5a5a;
  }

  .create-order-btn {
    position: fixed;
    bottom: 140rpx;
    right: 32rpx;
    width: 100rpx;
    height: 100rpx;
    background: #2e7d32;
    border-radius: 8rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: none;
    z-index: 999;
    border-top: 2rpx solid #cccccc;
    border-left: 2rpx solid #cccccc;
    border-right: 6rpx solid #1a1a1a;
    border-bottom: 6rpx solid #1a1a1a;
    box-sizing: border-box;
  }

  .create-order-btn:active {
    transform: translateY(2rpx);
    border-top: 4rpx solid #1a1a1a;
    border-left: 4rpx solid #1a1a1a;
    border-right: 2rpx solid #cccccc;
    border-bottom: 2rpx solid #cccccc;
  }

  .bottom-safe-area {
    height: env(safe-area-inset-bottom);
    background-color: transparent;
  }
</style>