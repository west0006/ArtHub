<template>
  <view class="page-container">
    <!-- 顶部导航 -->
    <view class="nav-header">
      <view class="nav-back" @tap="onBack">
        <van-icon name="arrow-left" size="32rpx" color="#333333" />
      </view>
      <text class="nav-title">订单详情</text>
      <view class="nav-actions">
        <van-icon name="edit" size="32rpx" color="#0A6E51" @tap="onEditOrder" />
      </view>
    </view>

    <!-- 订单基本信息 -->
    <view class="order-basic-info">
      <view class="order-header">
        <text class="order-title">{{ orderData.windowName || '未命名订单' }}</text>
        <view class="order-status" :class="orderData.status">
          <van-icon :name="icon" size="24rpx" :color="color" />
          <text>{{ statusText }}</text>
        </view>
      </view>
      <view class="order-meta">
        <view class="meta-item">
          <van-icon name="user-o" size="28rpx" color="#666666" />
          <text class="meta-label">客户：</text>
          <text class="meta-value">{{ orderData.clientName || '未知客户' }}</text>
        </view>
        <view class="meta-item">
          <van-icon name="bill-o" size="28rpx" color="#666666" />
          <text class="meta-label">单价：</text>
          <text class="meta-value">¥{{ orderData.price || 0 }}</text>
        </view>
        <view class="meta-item">
          <van-icon name="bag-o" size="28rpx" color="#666666" />
          <text class="meta-label">数量：</text>
          <text class="meta-value">{{ orderData.quantity || 1 }}件</text>
        </view>
        <view class="meta-item">
          <van-icon name="balance-list-o" size="28rpx" color="#666666" />
          <text class="meta-label">总金额：</text>
          <text class="meta-value total-amount">¥{{ orderData.totalAmount || 0 }}</text>
        </view>
      </view>
    </view>

    <!-- 时间信息 -->
    <view class="time-info-section">
      <view class="section-title">时间安排</view>
      <view class="time-cards">
        <view class="time-card">
          <van-icon name="underway-o" size="36rpx" color="#0A6E51" />
          <view class="time-content">
            <text class="time-label">开始日期</text>
            <text class="time-value">{{ orderData.startDate || '未设置' }}</text>
          </view>
        </view>
        <view class="time-card">
          <van-icon name="clock-o" size="36rpx" color="#E64340" />
          <view class="time-content">
            <text class="time-label">截止日期</text>
            <text class="time-value">{{ orderData.deadline || '未设置' }}</text>
          </view>
        </view>
        <view class="time-card">
          <van-icon name="calendar-o" size="36rpx" color="#1989fa" />
          <view class="time-content">
            <text class="time-label">总工期</text>
            <text class="time-value">{{ orderData.totalTime ? orderData.totalTime.length : '<1' }}天</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 要求描述 -->
    <view class="description-section" v-if="orderData.description">
      <view class="section-title">要求描述</view>
      <view class="description-content">
        <text>{{ orderData.description }}</text>
      </view>
    </view>

    <!-- 设定信息 -->
    <view class="setting-section" v-if="orderData.settingInfo">
      <view class="section-title">设定信息</view>
      <view class="setting-content">
        <text>{{ orderData.settingInfo }}</text>
      </view>
    </view>

    <!-- 参考图片 -->
    <view class="images-section" v-if="orderData.referenceImages && orderData.referenceImages.length > 0">
      <view class="section-title">参考图片 ({{ orderData.referenceImages.length }})</view>
      <view class="images-grid">
        <view class="image-item" v-for="(url, idx) in orderData.referenceImages" :key="idx" @tap="previewImage"
          :data-url="url">
          <image class="reference-image" :src="url" mode="aspectFill"></image>
        </view>
      </view>
    </view>

    <!-- 操作按钮 -->
    <view class="action-buttons">
      <view class="btn-group">
        <button class="btn secondary" @tap="onChangeStatus" v-if="orderData.status !== 'completed'">
          标记为{{ orderData.status === 'pending' ? '进行中' : '已完成' }}
        </button>
        <button class="btn danger" @tap="onDeleteOrder">删除订单</button>
      </view>
    </view>

    <CustomModal :show="showConfirmModal" :title="modalTitle" :cancelText="modalCancelText"
      :confirmText="modalConfirmText" @cancel="onConfirmModalCancel" @confirm="onConfirmModalConfirm">
      <view style="color: var(--com-text);">{{ modalContent }}</view>
    </CustomModal>

    <ai-float />
    <view class="bottom-safe-area"></view>
  </view>
</template>

<script setup lang="ts">
  import { ref, reactive, } from 'vue';
  import { onLoad as uniOnLoad, onShow } from '@dcloudio/uni-app';
  import { useStore } from '@/store';
  import CustomModal from '@/components/custom-modal/index.vue';
  import AiFloat from '@/components/ai-float/index.vue';

  const store = useStore();

  interface OrderData {
    id : number;
    windowName : string;
    clientName : string;
    price : number;
    quantity : number;
    description : string;
    settingInfo : string;
    referenceImages : string[];
    startDate : string;
    deadline : string;
    totalTime : string[];
    createTime : Date;
    status : 'pending' | 'progress' | 'completed';
    totalAmount : number;
  }

  const orderId = ref(0);
  const orderData = reactive<OrderData>({} as OrderData);
  const statusText = ref('');
  const icon = ref('');
  const color = ref('');

  const showConfirmModal = ref(false);
  const modalTitle = ref('');
  const modalContent = ref('');
  const modalConfirmText = ref('');
  const modalCancelText = ref('');

  const updateSnapshot = () => {
    store.updatePageSnapshot('pages/order/detail', {
      orderStatus: orderData.status,
      orderData: {
        clientName: orderData.clientName,
        windowName: orderData.windowName,
        description: orderData.description,
        settingInfo: orderData.settingInfo,
        startDate: orderData.startDate,
        deadline: orderData.deadline,
      },
    });
  };

  const loadOrderData = (id : number) => {
    const order = store.order.find(item => item.id === id);
    if (order) {
      Object.assign(orderData, order);
      getStatusText(orderData.status);
      getStatusIcon(orderData.status);
      getStatusColor(orderData.status);
    } else {
      uni.showToast({ title: '订单不存在', icon: 'error' });
      setTimeout(() => uni.navigateBack(), 1500);
    }
    updateSnapshot();
  };

  const getStatusText = (status : string) => {
    const map : Record<string, string> = { pending: '待开始', progress: '进行中', completed: '已完成' };
    statusText.value = map[status] || '暂无';
  };
  const getStatusIcon = (status : string) => {
    const map : Record<string, string> = { pending: 'clock-o', progress: 'underway-o', completed: 'passed' };
    icon.value = map[status] || 'info-o';
  };
  const getStatusColor = (status : string) => {
    const map : Record<string, string> = { pending: '#856404', progress: '#0c5460', completed: '#155724' };
    color.value = map[status] || '#666666';
  };

  uniOnLoad((options : any) => {
    const id = parseInt(options.id);
    if (id) {
      orderId.value = id;
      loadOrderData(id);
    } else {
      uni.showToast({ title: '订单ID错误', icon: 'error' });
      setTimeout(() => uni.navigateBack(), 1500);
    }
  });

  onShow(() => {
    if (orderId.value) loadOrderData(orderId.value);
    updateSnapshot();
  });

  const onBack = () => uni.navigateBack();
  const onEditOrder = () => uni.navigateTo({ url: `/pages/order/edit?id=${orderId.value}` });

  const previewImage = (e : any) => {
    const url = e.currentTarget.dataset.url;
    uni.previewImage({ urls: orderData.referenceImages, current: url });
  };

  const onChangeStatus = () => {
    const current = orderData.status;
    let newStatus : 'pending' | 'progress' | 'completed' = 'progress';
    let confirmText = '';
    if (current === 'pending') {
      newStatus = 'progress';
      confirmText = '确定要将订单标记为进行中吗？';
    } else if (current === 'progress') {
      newStatus = 'completed';
      confirmText = '确定要将订单标记为已完成吗？';
    }

    modalTitle.value = '修改状态';
    modalContent.value = confirmText;
    modalConfirmText.value = '确定';
    modalCancelText.value = '取消';
    showConfirmModal.value = true;

    // 保存目标状态
    (window as any).__tempNewStatus = newStatus;
  };

  const onConfirmModalConfirm = () => {
    const newStatus = (window as any).__tempNewStatus;
    if (newStatus) {
      store.changestatus(orderId.value, newStatus);
      loadOrderData(orderId.value);
      uni.showToast({ title: '状态更新成功', icon: 'success' });
    }
    (window as any).__tempNewStatus = null;
  };

  const onConfirmModalCancel = () => {
    // 不做操作
  };

  const onDeleteOrder = () => {
    uni.showModal({
      title: '删除订单',
      content: '确定要删除这个订单吗？此操作不可恢复。',
      confirmColor: '#E64340',
      success: (res) => {
        if (res.confirm) {
          store.removeorder(orderId.value);
          uni.showToast({ title: '订单删除成功', icon: 'success' });
          setTimeout(() => uni.navigateBack(), 1500);
        }
      }
    });
  };
</script>

<style scoped>
  .page-container {
    background-color: #ffffff;
    min-height: 100vh;
    padding-bottom: 120rpx;
  }

  .nav-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 28rpx 32rpx;
    background-color: #ffffff;
    border-bottom: 6rpx solid #1a1a1a;
  }

  .nav-back,
  .nav-actions {
    width: 64rpx;
    height: 64rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #1a1a1a;
  }

  .nav-title {
    font-size: 36rpx;
    font-weight: 700;
    color: #1a1a1a;
  }

  .order-basic-info,
  .time-info-section,
  .description-section,
  .setting-section,
  .images-section {
    background-color: #ffffff;
    margin: 24rpx 32rpx;
    border-radius: 8rpx;
    padding: 28rpx;
    box-sizing: border-box;
    border-top: 2rpx solid #cccccc;
    border-left: 2rpx solid #cccccc;
    border-right: 6rpx solid #1a1a1a;
    border-bottom: 6rpx solid #1a1a1a;
  }

  .order-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 28rpx;
  }

  .order-title {
    font-size: 34rpx;
    font-weight: 700;
    color: #1a1a1a;
    flex: 1;
    margin-right: 20rpx;
    line-height: 1.3;
  }

  .order-status {
    display: flex;
    align-items: center;
    gap: 8rpx;
    padding: 10rpx 18rpx;
    border-radius: 6rpx;
    font-size: 22rpx;
    font-weight: 700;
    white-space: nowrap;
    background-color: #ffffff;
    color: #1a1a1a;
    box-sizing: border-box;
    border-top: 2rpx solid #cccccc;
    border-left: 2rpx solid #cccccc;
    border-right: 3rpx solid #1a1a1a;
    border-bottom: 3rpx solid #1a1a1a;
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
    display: flex;
    flex-direction: column;
    gap: 20rpx;
  }

  .meta-item {
    display: flex;
    align-items: center;
    gap: 16rpx;
  }

  .meta-label {
    font-size: 26rpx;
    color: #5a5a5a;
    font-weight: 500;
    min-width: 120rpx;
  }

  .meta-value {
    font-size: 26rpx;
    color: #1a1a1a;
    font-weight: 600;
    flex: 1;
  }

  .total-amount {
    font-size: 28rpx;
    font-weight: 700;
    color: #1a1a1a;
    border-bottom: 3rpx solid #2e7d32;
    padding-bottom: 4rpx;
  }

  .section-title {
    font-size: 30rpx;
    font-weight: 700;
    color: #1a1a1a;
    margin-bottom: 24rpx;
    border-left: 8rpx solid #2e7d32;
    padding-left: 20rpx;
  }

  .time-cards {
    display: flex;
    flex-direction: column;
    gap: 16rpx;
  }

  .time-card {
    display: flex;
    align-items: center;
    gap: 20rpx;
    padding: 20rpx;
    background-color: #ffffff;
    border-radius: 6rpx;
    box-sizing: border-box;
    border-top: 2rpx solid #cccccc;
    border-left: 2rpx solid #cccccc;
    border-right: 4rpx solid #1a1a1a;
    border-bottom: 4rpx solid #1a1a1a;
  }

  .time-content {
    display: flex;
    flex-direction: column;
    flex: 1;
  }

  .time-label {
    font-size: 24rpx;
    color: #5a5a5a;
    font-weight: 500;
    margin-bottom: 6rpx;
  }

  .time-value {
    font-size: 26rpx;
    color: #1a1a1a;
    font-weight: 700;
  }

  .description-content,
  .setting-content {
    font-size: 26rpx;
    color: #1a1a1a;
    line-height: 1.6;
    font-weight: 500;
  }

  .images-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 16rpx;
  }

  .image-item {
    width: calc(33.333% - 11rpx);
    aspect-ratio: 1;
    border-radius: 6rpx;
    overflow: hidden;
    box-sizing: border-box;
    border-top: 2rpx solid #cccccc;
    border-left: 2rpx solid #cccccc;
    border-right: 4rpx solid #1a1a1a;
    border-bottom: 4rpx solid #1a1a1a;
  }

  .reference-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .action-buttons {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    background-color: #ffffff;
    padding: 24rpx 32rpx;
    border-top: 6rpx solid #1a1a1a;
    box-shadow: none;
    box-sizing: border-box;
  }

  .btn-group {
    display: flex;
    gap: 20rpx;
  }

  .btn {
    flex: 1;
    height: 80rpx;
    border-radius: 6rpx;
    font-size: 28rpx;
    font-weight: 700;
    display: flex;
    align-items: center;
    justify-content: center;
    box-sizing: border-box;
    border-top: 2rpx solid #cccccc;
    border-left: 2rpx solid #cccccc;
    border-right: 5rpx solid #1a1a1a;
    border-bottom: 5rpx solid #1a1a1a;
    transition: none;
  }

  .btn:active {
    transform: translateY(2rpx);
    border-top: 4rpx solid #1a1a1a;
    border-left: 4rpx solid #1a1a1a;
    border-right: 2rpx solid #cccccc;
    border-bottom: 2rpx solid #cccccc;
  }

  .btn.secondary {
    background-color: #2e7d32;
    color: #ffffff;
  }

  .btn.danger {
    background-color: #1a1a1a;
    color: #ffffff;
  }

  .bottom-safe-area {
    height: env(safe-area-inset-bottom);
    background-color: transparent;
  }
</style>