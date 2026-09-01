<template>
  <view class="page-container create-order-container">
    <scroll-view class="form-container" scroll-y>
      <!-- 基础信息部分 -->
      <view class="form-section">
        <view class="section-header">
          <text class="section-title">基础信息</text>
        </view>
        <!-- 橱窗名称 -->
        <view class="form-item">
          <view class="form-label">
            <text class="label-text">橱窗名称</text>
            <text class="required-mark">*</text>
          </view>
          <input class="form-input" placeholder="请输入橱窗名称" :value="windowName" @input="onWindowNameInput" />
        </view>
        <!-- 单主名 -->
        <view class="form-item">
          <view class="form-label">
            <text class="label-text">单主名</text>
            <text class="required-mark">*</text>
          </view>
          <input class="form-input" placeholder="请输入单主名称" :value="clientName" @input="onClientNameInput" />
        </view>
        <!-- 价格和数量 -->
        <view class="form-row">
          <view class="form-item half-width">
            <view class="form-label">
              <text class="label-text">价格</text>
              <text class="required-mark">*</text>
            </view>
            <view class="price-input-container">
              <input class="form-input price-input" placeholder="0.00" type="digit" :value="price"
                @input="onPriceInput" />
              <text class="price-unit">元</text>
            </view>
          </view>
          <view class="form-item half-width">
            <view class="form-label">
              <text class="label-text">数量</text>
              <text class="required-mark">*</text>
            </view>
            <view class="quantity-container">
              <view class="quantity-btn" :class="{ disabled: quantity <= 1 }" @tap="decreaseQuantity">-</view>
              <input class="form-input quantity-input" :value="quantity" type="number" @input="onQuantityInput" />
              <view class="quantity-btn" @tap="increaseQuantity">+</view>
            </view>
          </view>
        </view>
      </view>

      <!-- 要求描述 -->
      <view class="form-section">
        <view class="section-header">
          <text class="section-title">要求描述</text>
        </view>
        <view class="form-item">
          <textarea class="form-textarea" placeholder="请详细描述稿件要求，包括风格、内容、特殊要求等..." :value="description"
            @input="onDescriptionInput" maxlength="500"></textarea>
          <view class="textarea-counter">
            <text class="counter-text">{{ description.length }}/500</text>
          </view>
        </view>
      </view>

      <!-- 设定信息 -->
      <view class="form-section">
        <view class="section-header">
          <text class="section-title">设定信息</text>
          <text class="section-subtitle">可从素材库中添加可参照素材</text>
        </view>
        <view class="form-item">
          <textarea class="form-textarea" placeholder="请输入角色设定、世界观等详细信息..." :value="settingInfo"
            @input="onSettingInfoInput" maxlength="1000"></textarea>
          <view class="textarea-counter">
            <text class="counter-text">{{ settingInfo.length }}/1000</text>
          </view>
        </view>
        <view class="add-from-library" @tap="onAddFromLibrary">
          <view class="add-icon">+</view>
          <text class="add-text">从素材库添加参照素材</text>
        </view>
      </view>

      <!-- 参考图 -->
      <view class="form-section">
        <view class="section-header">
          <text class="section-title">参考图</text>
        </view>
        <view class="form-item">
          <view class="uploader-container">
            <view class="uploader-item" v-for="(image, index) in referenceImages" :key="index">
              <image class="uploaded-image" :src="image" mode="aspectFill"></image>
              <view class="delete-btn" @tap="onDeleteImage" :data-index="index">×</view>
            </view>
            <view class="uploader-btn" v-if="referenceImages.length < 9" @tap="onChooseImage">
              <view class="uploader-icon">+</view>
              <text class="uploader-text">添加图片</text>
            </view>
          </view>
          <view class="uploader-tips">
            <text class="tips-text">最多可上传9张图片，建议尺寸一致</text>
          </view>
        </view>
      </view>

      <!-- 日期设置 -->
      <view class="form-section">
        <view class="section-header">
          <text class="section-title">日期设置</text>
        </view>
        <view class="form-item">
          <view class="form-label">
            <text class="label-text">开始日期</text>
          </view>
          <picker mode="date" :value="startDate" @change="onStartDateChange">
            <view class="picker-value" :class="{ placeholder: !startDate }">{{ startDate || '请选择开始日期' }}</view>
          </picker>
          <picker mode="time" :value="startTime" @change="onStartTimeChange">
            <view class="picker-value" style="margin-left:20rpx;">{{ startTime || '00:00' }}</view>
          </picker>
        </view>
        <view class="form-item">
          <view class="form-label">
            <text class="label-text">截稿日期</text>
          </view>
          <picker mode="date" :value="deadline" @change="onDeadlineDateChange">
            <view class="picker-value" :class="{ placeholder: !deadline }">{{ deadline || '请选择截稿日期' }}</view>
          </picker>
          <picker mode="time" :value="deadlineTime" @change="onDeadlineTimeChange">
            <view class="picker-value" style="margin-left:20rpx;">{{ deadlineTime || '00:00' }}</view>
          </picker>
        </view>
      </view>

      <view class="bottom-safe-area" style="height: 160rpx;"></view>
    </scroll-view>

    <!-- 底部操作栏 -->
    <view class="action-bar">
      <view class="action-btn cancel-btn" @tap="onCancel">取消</view>
      <view class="action-btn confirm-btn" @tap="onSubmit">确认创建</view>
    </view>
  </view>
</template>

<script setup lang="ts">
  import { ref } from 'vue';
  import { useStore } from '@/store';
  import { onLoad as uniOnLoad } from '@dcloudio/uni-app';

  const store = useStore();

  const windowName = ref('');
  const clientName = ref('');
  const price = ref('');
  const quantity = ref(1);
  const description = ref('');
  const settingInfo = ref('');
  const referenceImages = ref<string[]>([]);
  const startDate = ref('');
  const startTime = ref('00:00');
  const deadline = ref('');
  const deadlineTime = ref('00:00');
  const tempFilePaths = ref<string[]>([]);

  const formatDate = (date : Date) : string => {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  uniOnLoad((option : any) => {
    const today = formatDate(new Date());
    if (option?.selectedDate) {
      startDate.value = option.selectedDate;
      deadline.value = option.selectedDate;
    } else {
      startDate.value = today;
    }
    updateSnapshot();
  });

  const onWindowNameInput = (e : any) => {
    windowName.value = e.detail.value;
  };
  const onClientNameInput = (e : any) => {
    clientName.value = e.detail.value;
  };
  const onPriceInput = (e : any) => {
    let value = e.detail.value;
    if (value === '') {
      price.value = '';
      return;
    }
    if (!/^\d*\.?\d*$/.test(value)) {
      uni.showToast({ title: '请输入有效数字', icon: 'none', duration: 1500 });
      const cleaned = value.replace(/[^\d.]/g, '');
      price.value = cleaned;
      return;
    }
    const dotCount = (value.match(/\./g) || []).length;
    if (dotCount > 1) {
      const parts = value.split('.');
      value = parts[0] + '.' + parts.slice(1).join('');
    }
    if (value === '.') {
      value = '0.';
    }
    if (value.includes('.')) {
      const parts = value.split('.');
      if (parts[1].length > 2) {
        value = parts[0] + '.' + parts[1].substring(0, 2);
        uni.showToast({ title: '最多保留两位小数', icon: 'none', duration: 1000 });
      }
    }
    if (value.length > 1 && value[0] === '0' && value[1] !== '.') {
      value = value.replace(/^0+/, '') || '0';
    }
    price.value = value;
  };
  const onQuantityInput = (e : any) => {
    let val = parseInt(e.detail.value) || 1;
    if (val < 1) val = 1;
    quantity.value = val;
  };
  const decreaseQuantity = () => {
    if (quantity.value > 1) {
      quantity.value--;
    }
  };
  const increaseQuantity = () => {
    quantity.value++;
  };
  const onDescriptionInput = (e : any) => {
    let value = e.detail.value;
    const maxLength = 500;
    if (value.length > maxLength) {
      value = value.substring(0, maxLength);
      uni.showToast({ title: `最多输入${maxLength}字`, icon: 'none', duration: 1500 });
    }
    description.value = value;
    updateSnapshot();
  };
  const onSettingInfoInput = (e : any) => {
    settingInfo.value = e.detail.value;
    updateSnapshot();
  };
  const onAddFromLibrary = () => {
    uni.showToast({ title: '跳转至素材库选择', icon: 'none' });
  };
  const onChooseImage = () => {
    uni.chooseMedia({
      count: 9 - referenceImages.value.length,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      maxDuration: 30,
      camera: 'back',
      success(res) {
        const tempFiles = res.tempFiles;
        const newImages = tempFiles.map(file => file.tempFilePath);
        referenceImages.value = [...referenceImages.value, ...newImages];
        tempFilePaths.value = [...tempFilePaths.value, ...newImages];
      }
    });
  };
  const onDeleteImage = (e : any) => {
    const index = e.currentTarget.dataset.index;
    referenceImages.value.splice(index, 1);
    tempFilePaths.value.splice(index, 1);
  };
  const onStartDateChange = (e : any) => {
    startDate.value = e.detail.value;
  };
  const onStartTimeChange = (e : any) => {
    startTime.value = e.detail.value;
  };
  const onDeadlineDateChange = (e : any) => {
    deadline.value = e.detail.value;
  };
  const onDeadlineTimeChange = (e : any) => {
    deadlineTime.value = e.detail.value;
  };
  const clearConfirm = () => {
    const today = formatDate(new Date());
    windowName.value = '';
    clientName.value = '';
    price.value = '';
    quantity.value = 1;
    description.value = '';
    settingInfo.value = '';
    referenceImages.value = [];
    startDate.value = today;
    deadline.value = '';
    startTime.value = '00:00';
    deadlineTime.value = '00:00';
  };
  const onCancel = () => {
    uni.showModal({
      title: '确认取消',
      content: '确定要取消创建排单吗？所有未保存的内容将会丢失。',
      confirmColor: '#E64340',
      success: (res) => {
        if (res.confirm) {
          clearConfirm();
          uni.navigateBack();
        }
      }
    });
  };
  // 在表单数据变动时更新（可在 watchEffect 或输入事件中调用）
  const updateSnapshot = () => {
    store.updatePageSnapshot('pages/order/add', {
      description: description.value,
      settingInfo: settingInfo.value,
      startDate: startDate.value,
      deadline: deadline.value,
    });
  };
  const validateForm = () : boolean => {
    if (!windowName.value.trim()) {
      uni.showToast({ title: '请输入橱窗名称', icon: 'none' });
      return false;
    }
    if (!clientName.value.trim()) {
      uni.showToast({ title: '请输入单主名', icon: 'none' });
      return false;
    }
    if (!price.value || parseFloat(price.value) <= 0) {
      uni.showToast({ title: '请输入有效价格', icon: 'none' });
      return false;
    }
    if (quantity.value < 1) {
      uni.showToast({ title: '数量至少为1', icon: 'none' });
      return false;
    }
    if (!description.value.trim()) {
      uni.showToast({ title: '请输入要求描述', icon: 'none' });
      return false;
    }
    return true;
  };
  const onSubmit = () => {
    if (!validateForm()) return;

    const startDateTime = startDate.value ? `${startDate.value} ${startTime.value || '00:00'}` : '';
    const deadlineDateTime = deadline.value ? `${deadline.value} ${deadlineTime.value || '00:00'}` : '';

    const orderData = {
      id: Date.now(), // 临时用时间戳，实际应该由后端生成
      windowName: windowName.value,
      clientName: clientName.value,
      price: parseFloat(price.value),
      quantity: quantity.value,
      description: description.value,
      settingInfo: settingInfo.value,
      referenceImages: referenceImages.value,
      startDate: startDateTime,
      deadline: deadlineDateTime,
      totalTime: startDateTime && deadlineDateTime ? store.getDatesBetween(startDateTime, deadlineDateTime) : [],
      createTime: new Date(),
      status: 'pending',
      totalAmount: parseFloat(price.value) * quantity.value,
    };

    uni.showLoading({ title: '创建中...' });
    setTimeout(() => {
      uni.hideLoading();
      try {
        store.addorder(orderData);
        uni.showToast({
          title: '创建成功',
          icon: 'success',
          duration: 1500,
          success: () => {
            setTimeout(() => {
              clearConfirm();
              uni.navigateBack();
            }, 1000);
          }
        });
      } catch (error) {
        console.error('创建订单失败:', error);
        uni.showToast({ title: '创建失败', icon: 'error' });
      }
    }, 1000);
  };
</script>

<style scoped>
  /** 创建订单页样式 - 夸克立体粗边框 + 绿色点缀 **/

  .create-order-container {
    background-color: #ffffff;
  }

  /* 页面标题 */
  .page-header {
    padding: var(--title-content) var(--large-plate);
    background: #2e7d32;
    border-bottom: 6rpx solid #1a1a1a;
    /* 底部保持粗黑，上下无需立体 */
  }

  .page-title {
    font-size: 36rpx;
    font-weight: 700;
    color: #ffffff;
  }

  /* 表单容器 */
  .form-container {
    flex: 1;
    width: 740rpx;
    margin: 6rpx;
  }

  /* 表单部分 - 立体卡片边框 */
  .form-section {
    margin-bottom: var(--large-module);
    background: #ffffff;
    border-radius: 8rpx;
    overflow: hidden;
    box-shadow: none;
    box-sizing: border-box;
    /* 立体边框：上左浅色细边，下右深色粗边 */
    border-top: 2rpx solid #cccccc;
    border-left: 2rpx solid #cccccc;
    border-right: 6rpx solid #1a1a1a;
    border-bottom: 6rpx solid #1a1a1a;
  }

  .section-header {
    padding: var(--title-content);
    border-bottom: 4rpx solid #1a1a1a;
  }

  .section-title {
    font-size: 30rpx;
    font-weight: 700;
    color: #1a1a1a;
    border-left: 8rpx solid #2e7d32;
    padding-left: 16rpx;
  }

  .section-subtitle {
    font-size: 24rpx;
    color: #5a5a5a;
    margin-left: 16rpx;
    font-weight: 500;
  }

  /* 表单项 */
  .form-item {
    padding: var(--card-meta) var(--title-content);
  }

  .form-item:not(:last-child) {
    border-bottom: 3rpx solid #1a1a1a;
  }

  .form-label {
    display: flex;
    align-items: center;
    margin-bottom: 16rpx;
  }

  .label-text {
    font-size: 28rpx;
    color: #1a1a1a;
    font-weight: 700;
  }

  .required-mark {
    color: #2e7d32;
    margin-left: 8rpx;
    font-weight: 700;
  }

  /* 输入框 - 立体边框 */
  .form-input {
    width: 100%;
    padding: 20rpx 0;
    font-size: 28rpx;
    color: #1a1a1a;
    border: none;
    outline: none;
    background: transparent;
    font-weight: 500;
  }

  .placeholder {
    color: #8a8a8a;
  }

  /* 价格输入 */
  .price-input-container {
    position: relative;
    display: flex;
    align-items: center;
  }

  .price-input {
    padding-right: 60rpx;
  }

  .price-unit {
    position: absolute;
    right: 0;
    color: #5a5a5a;
    font-size: 28rpx;
    font-weight: 500;
  }

  /* 表单行 */
  .form-row {
    display: flex;
    gap: var(--card-meta);
  }

  .half-width {
    flex: 1;
  }

  /* 数量选择器 - 立体边框 */
  .quantity-container {
    display: flex;
    align-items: center;
    border-radius: 6rpx;
    overflow: hidden;
    box-sizing: border-box;
    /* 立体边框 */
    border-top: 2rpx solid #cccccc;
    border-left: 2rpx solid #cccccc;
    border-right: 4rpx solid #1a1a1a;
    border-bottom: 4rpx solid #1a1a1a;
  }

  .quantity-btn {
    width: 80rpx;
    height: 60rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #ffffff;
    font-size: 32rpx;
    color: #1a1a1a;
    font-weight: 700;
    border-right: 2rpx solid #1a1a1a;
  }

  .quantity-btn:last-child {
    border-right: none;
    border-left: 2rpx solid #1a1a1a;
  }

  .quantity-btn.disabled {
    background: #f5f5f5;
    color: #8a8a8a;
  }

  .quantity-input {
    flex: 1;
    text-align: center;
    padding: 0;
    border: none;
    font-weight: 700;
  }

  /* 文本域 - 立体边框 */
  .form-textarea {
    width: 100%;
    min-height: 200rpx;
    padding: 20rpx;
    font-size: 28rpx;
    color: #1a1a1a;
    border-radius: 6rpx;
    background: #ffffff;
    box-sizing: border-box;
    font-weight: 500;
    /* 立体边框 */
    border-top: 2rpx solid #cccccc;
    border-left: 2rpx solid #cccccc;
    border-right: 4rpx solid #1a1a1a;
    border-bottom: 4rpx solid #1a1a1a;
  }

  .textarea-counter {
    text-align: right;
    margin-top: 16rpx;
  }

  .counter-text {
    font-size: 24rpx;
    color: #5a5a5a;
    font-weight: 500;
  }

  /* 从素材库添加 - 立体虚线边框 */
  .add-from-library {
    display: flex;
    align-items: center;
    padding: 24rpx;
    border-radius: 6rpx;
    margin-top: 16rpx;
    background: #ffffff;
    box-sizing: border-box;
    /* 立体虚线边框 */
    border-top: 2rpx dashed #cccccc;
    border-left: 2rpx dashed #cccccc;
    border-right: 4rpx dashed #1a1a1a;
    border-bottom: 4rpx dashed #1a1a1a;
  }

  .add-icon {
    width: 40rpx;
    height: 40rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #2e7d32;
    color: #ffffff;
    border: 3rpx solid #1a1a1a;
    border-radius: 4rpx;
    font-size: 24rpx;
    margin-right: 16rpx;
    font-weight: 700;
  }

  .add-text {
    font-size: 28rpx;
    color: #2e7d32;
    font-weight: 700;
  }

  /* 图片上传 */
  .uploader-container {
    display: flex;
    flex-wrap: wrap;
    gap: 20rpx;
  }

  .uploader-item {
    position: relative;
    width: 200rpx;
    height: 200rpx;
    border-radius: 6rpx;
    overflow: hidden;
    box-sizing: border-box;
    /* 立体边框 */
    border-top: 2rpx solid #cccccc;
    border-left: 2rpx solid #cccccc;
    border-right: 4rpx solid #1a1a1a;
    border-bottom: 4rpx solid #1a1a1a;
  }

  .uploaded-image {
    width: 100%;
    height: 100%;
  }

  .delete-btn {
    position: absolute;
    top: 8rpx;
    right: 8rpx;
    width: 40rpx;
    height: 40rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #1a1a1a;
    color: #ffffff;
    border: 2rpx solid #ffffff;
    border-radius: 4rpx;
    font-size: 24rpx;
    font-weight: 700;
  }

  .uploader-btn {
    width: 200rpx;
    height: 200rpx;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    border-radius: 6rpx;
    background: #ffffff;
    box-sizing: border-box;
    /* 立体虚线边框 */
    border-top: 2rpx dashed #cccccc;
    border-left: 2rpx dashed #cccccc;
    border-right: 4rpx dashed #1a1a1a;
    border-bottom: 4rpx dashed #1a1a1a;
  }

  .uploader-icon {
    width: 60rpx;
    height: 60rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 3rpx solid #1a1a1a;
    border-radius: 4rpx;
    font-size: 32rpx;
    color: #1a1a1a;
    margin-bottom: 16rpx;
  }

  .uploader-text {
    font-size: 24rpx;
    color: #5a5a5a;
    font-weight: 500;
  }

  .uploader-tips {
    margin-top: 16rpx;
  }

  .tips-text {
    font-size: 24rpx;
    color: #5a5a5a;
    font-weight: 500;
  }

  /* 日期选择器 */
  .picker-value {
    padding: 20rpx 0;
    font-size: 28rpx;
    color: #1a1a1a;
    font-weight: 500;
  }

  /* 底部操作栏 - 顶部粗边框保持不变（无需立体） */
  .action-bar {
    position: fixed;
    bottom: 120rpx;
    left: 0;
    right: 0;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 24rpx 32rpx;
    background-color: #ffffff;
    border-top: 6rpx solid #1a1a1a;
    box-shadow: none;
  }

  /* 按钮 - 立体按压效果 */
  .action-btn {
    flex: 1;
    height: 80rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 6rpx;
    font-size: 30rpx;
    font-weight: 700;
    box-sizing: border-box;
    /* 立体边框 */
    border-top: 2rpx solid #cccccc;
    border-left: 2rpx solid #cccccc;
    border-right: 5rpx solid #1a1a1a;
    border-bottom: 5rpx solid #1a1a1a;
    transition: none;
  }

  .action-btn:active {
    transform: translateY(2rpx);
    border-top: 4rpx solid #1a1a1a;
    border-left: 4rpx solid #1a1a1a;
    border-right: 2rpx solid #cccccc;
    border-bottom: 2rpx solid #cccccc;
  }

  .cancel-btn {
    background: #ffffff;
    color: #1a1a1a;
    margin-right: 16rpx;
  }

  .confirm-btn {
    background: #2e7d32;
    color: #ffffff;
    margin-left: 16rpx;
  }
</style>