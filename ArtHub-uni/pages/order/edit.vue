<template>
  <view class="page-container">
    <scroll-view scroll-y class="form-scroll">
      <!-- 基本信息 -->
      <view class="form-section">
        <view class="section-title">基本信息</view>
        <view class="form-item">
          <text class="form-label">橱窗名称</text>
          <input class="form-input" placeholder="请输入" :value="formData.windowName" @input="onInputChange"
            data-field="windowName" />
        </view>
        <view class="form-item">
          <text class="form-label">客户名称</text>
          <input class="form-input" placeholder="请输入" :value="formData.clientName" @input="onInputChange"
            data-field="clientName" />
        </view>
        <view class="form-item form-row">
          <view class="form-half">
            <text class="form-label">价格</text>
            <input class="form-input" type="digit" placeholder="请输入" :value="formData.price" @input="onNumberInput"
              data-field="price" />
          </view>
          <view class="form-half">
            <text class="form-label">数量</text>
            <input class="form-input" type="number" placeholder="请输入" :value="formData.quantity" @input="onNumberInput"
              data-field="quantity" />
          </view>
        </view>
      </view>

      <!-- 时间安排 -->
      <view class="form-section">
        <view class="section-title">时间安排</view>
        <view class="form-item">
          <text class="form-label">开始日期</text>
          <picker mode="date" :value="formData.startDate" @change="onDateChange" data-field="startDate">
            <view class="picker-value">{{ formData.startDate || '请选择日期' }}</view>
          </picker>
        </view>
        <view class="form-item">
          <text class="form-label">截止日期</text>
          <picker mode="date" :value="formData.deadline" @change="onDateChange" data-field="deadline">
            <view class="picker-value">{{ formData.deadline || '请选择日期' }}</view>
          </picker>
        </view>
      </view>

      <!-- 要求描述 -->
      <view class="form-section">
        <view class="section-title">要求描述</view>
        <textarea class="form-textarea" placeholder="请输入要求描述" :value="formData.description" @input="onInputChange"
          data-field="description" auto-height />
      </view>

      <!-- 设定信息 -->
      <view class="form-section">
        <view class="section-title">设定信息</view>
        <textarea class="form-textarea" placeholder="请输入设定信息" :value="formData.settingInfo" @input="onInputChange"
          data-field="settingInfo" auto-height />
      </view>

      <!-- 参考图片（只读展示） -->
      <view class="form-section" v-if="formData.referenceImages && formData.referenceImages.length > 0">
        <view class="section-title">参考图片 ({{ formData.referenceImages.length }})</view>
        <view class="images-grid">
          <view class="image-item" v-for="(url, idx) in formData.referenceImages" :key="idx" @tap="previewImage"
            :data-url="url">
            <image class="reference-image" :src="url" mode="aspectFill"></image>
          </view>
        </view>
      </view>

      <view style="height: 120rpx;"></view>
    </scroll-view>

    <!-- 底部操作栏 -->
    <view class="action-bar">
      <button class="btn cancel" @tap="onCancel">取消</button>
      <button class="btn save" @tap="onSave">保存</button>
    </view>
    <view class="bottom-safe-area"></view>
  </view>
</template>

<script setup lang="ts">
  import { ref, reactive, } from 'vue';
  import { onLoad as uniOnLoad } from '@dcloudio/uni-app';
  import { useStore } from '@/store';

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
  const formData = reactive<OrderData>({} as OrderData);
  const startDate = ref('');
  const startTime = ref('00:00');
  const deadline = ref('');
  const deadlineTime = ref('00:00');

  uniOnLoad((options : any) => {
    const id = parseInt(options.id);
    if (!id) {
      uni.showToast({ title: '订单ID错误', icon: 'error' });
      setTimeout(() => uni.navigateBack(), 1500);
      return;
    }
    const order = store.order.find((item : any) => item.id === id);
    if (!order) {
      uni.showToast({ title: '订单不存在', icon: 'error' });
      setTimeout(() => uni.navigateBack(), 1500);
      return;
    }
    // 深拷贝
    Object.assign(formData, JSON.parse(JSON.stringify(order)));
    const startParts = (order.startDate || '').split(' ');
    const deadlineParts = (order.deadline || '').split(' ');
    startDate.value = startParts[0] || '';
    startTime.value = startParts[1] || '00:00';
    deadline.value = deadlineParts[0] || '';
    deadlineTime.value = deadlineParts[1] || '00:00';
    orderId.value = id;
  });

  const onBack = () => uni.navigateBack();

  const onInputChange = (e : any) => {
    const field = e.currentTarget.dataset.field;
    (formData as any)[field] = e.detail.value;
  };

  const onNumberInput = (e : any) => {
    const field = e.currentTarget.dataset.field;
    let value = e.detail.value;
    value = value.replace(/[^\d.]/g, '');
    const parts = value.split('.');
    if (parts.length > 2) {
      value = parts[0] + '.' + parts.slice(1).join('');
    }
    (formData as any)[field] = value;
  };

  const onDateChange = (e : any) => {
    const field = e.currentTarget.dataset.field;
    const value = e.detail.value;
    (formData as any)[field] = value;
    if (field === 'startDate') startDate.value = value;
    if (field === 'deadline') deadline.value = value;
  };

  const previewImage = (e : any) => {
    const url = e.currentTarget.dataset.url;
    uni.previewImage({ urls: formData.referenceImages, current: url });
  };

  const onSave = () => {
    if (!formData.windowName?.trim()) {
      uni.showToast({ title: '请输入橱窗名称', icon: 'none' });
      return;
    }
    if (!formData.clientName?.trim()) {
      uni.showToast({ title: '请输入客户名称', icon: 'none' });
      return;
    }
    if (!formData.price || formData.price <= 0) {
      uni.showToast({ title: '请输入有效的价格', icon: 'none' });
      return;
    }
    if (!formData.quantity || formData.quantity < 1) {
      uni.showToast({ title: '数量至少为1', icon: 'none' });
      return;
    }
    uni.showLoading({ title: '保存中...' });
    const startDateTime = startDate.value && startTime.value ? `${startDate.value} ${startTime.value}` : (startDate.value || '');
    const deadlineDateTime = deadline.value && deadlineTime.value ? `${deadline.value} ${deadlineTime.value}` : (deadline.value || '');

    store.updateOrderAction(orderId.value, {
      windowName: formData.windowName,
      clientName: formData.clientName,
      price: Number(formData.price),
      quantity: Number(formData.quantity),
      description: formData.description || '',
      settingInfo: formData.settingInfo || '',
      startDate: startDateTime,
      deadline: deadlineDateTime,
    });

    uni.hideLoading();
    uni.showToast({ title: '保存成功', icon: 'success' });
    setTimeout(() => uni.navigateBack(), 1500);
  };

  const onCancel = () => uni.navigateBack();
</script>

<style scoped>
  .page-container {
    background-color: #ffffff;
    min-height: 100vh;
    display: flex;
    flex-direction: column;
  }

  .form-scroll {
    flex: 1;
    padding: 24rpx 32rpx 32rpx;
  }

  .form-section {
    background-color: #ffffff;
    border: 6rpx solid #1a1a1a;
    border-radius: 8rpx;
    padding: 28rpx;
    margin-bottom: 32rpx;
    box-sizing: border-box;
  }

  .section-title {
    font-size: 30rpx;
    font-weight: 700;
    color: #1a1a1a;
    margin-bottom: 24rpx;
    border-left: 8rpx solid #2e7d32;
    padding-left: 20rpx;
  }

  .form-item {
    margin-bottom: 28rpx;
  }

  .form-item:last-child {
    margin-bottom: 0;
  }

  .form-label {
    display: block;
    font-size: 26rpx;
    color: #5a5a5a;
    font-weight: 500;
    margin-bottom: 12rpx;
  }

  .form-input {
    width: 100%;
    height: 80rpx;
    background-color: #ffffff;
    border: 4rpx solid #1a1a1a;
    border-radius: 6rpx;
    padding: 0 24rpx;
    font-size: 28rpx;
    color: #1a1a1a;
    font-weight: 500;
    box-sizing: border-box;
    outline: none;
  }

  .form-input::placeholder {
    color: #8a8a8a;
  }

  .form-row {
    display: flex;
    gap: 20rpx;
  }

  .form-half {
    flex: 1;
  }

  .picker-value {
    width: 100%;
    height: 80rpx;
    background-color: #ffffff;
    border: 4rpx solid #1a1a1a;
    border-radius: 6rpx;
    padding: 0 24rpx;
    font-size: 28rpx;
    color: #1a1a1a;
    line-height: 80rpx;
    font-weight: 500;
    box-sizing: border-box;
  }

  .form-textarea {
    width: 100%;
    min-height: 160rpx;
    background-color: #ffffff;
    border: 4rpx solid #1a1a1a;
    border-radius: 6rpx;
    padding: 20rpx 24rpx;
    font-size: 28rpx;
    color: #1a1a1a;
    font-weight: 500;
    box-sizing: border-box;
    outline: none;
  }

  .form-textarea::placeholder {
    color: #8a8a8a;
  }

  .images-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 16rpx;
    margin-top: 16rpx;
  }

  .image-item {
    width: calc(33.333% - 11rpx);
    aspect-ratio: 1;
    border: 4rpx solid #1a1a1a;
    border-radius: 6rpx;
    overflow: hidden;
    box-sizing: border-box;
  }

  .reference-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .action-bar {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    background-color: #ffffff;
    padding: 24rpx 32rpx;
    border-top: 6rpx solid #1a1a1a;
    box-shadow: none;
    display: flex;
    gap: 20rpx;
    flex-shrink: 0;
    box-sizing: border-box;
  }

  .btn {
    flex: 1;
    height: 80rpx;
    border: 4rpx solid #1a1a1a;
    border-radius: 6rpx;
    font-size: 28rpx;
    font-weight: 700;
    display: flex;
    align-items: center;
    justify-content: center;
    box-sizing: border-box;
  }

  .btn.cancel {
    background-color: #ffffff;
    color: #1a1a1a;
  }

  .btn.save {
    background-color: #2e7d32;
    color: #ffffff;
  }

  .bottom-safe-area {
    height: env(safe-area-inset-bottom);
    background-color: transparent;
  }
</style>