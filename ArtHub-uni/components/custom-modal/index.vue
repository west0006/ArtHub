<template>
  <view class="modal-mask" v-if="show" @tap="onMaskTap" catchtouchmove="preventTouchMove"></view>
  <view class="modal-dialog" v-if="show">
    <view class="modal-title">{{ title }}</view>
    <view class="modal-content">
      <slot></slot>
    </view>
    <view class="modal-footer">
      <view class="btn-cancel" @tap="onCancel">{{ cancelText }}</view>
      <view class="btn-confirm" @tap="onConfirm">{{ confirmText }}</view>
    </view>
  </view>
</template>

<script setup lang="ts">
  import { ref } from 'vue';

  const props = defineProps<{
    show : boolean;
    title : string;
    cancelText : string;
    confirmText : string;
    maskBehavior ?: string;
  }>();

  const emit = defineEmits(['close', 'cancel', 'confirm']);

  const preventTouchMove = () => { };

  const onMaskTap = () => {
    if (props.maskBehavior !== 'close') return;
    emit('close');
  };

  const onCancel = () => {
    emit('cancel');
  };

  const onConfirm = () => {
    emit('confirm');
  };
</script>

<style scoped>
  .modal-mask {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.5);
    z-index: 9998;
  }

  .modal-dialog {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 80%;
    max-width: 600rpx;
    background-color: #ffffff;
    border-radius: 8rpx;
    z-index: 9999;
    overflow: hidden;
    box-sizing: border-box;
    border-top: 2rpx solid #cccccc;
    border-left: 2rpx solid #cccccc;
    border-right: 6rpx solid #1a1a1a;
    border-bottom: 6rpx solid #1a1a1a;
    animation: modalFadeIn 0.2s ease;
  }

  @keyframes modalFadeIn {
    from {
      opacity: 0;
      transform: translate(-50%, -48%);
    }

    to {
      opacity: 1;
      transform: translate(-50%, -50%);
    }
  }

  .modal-title {
    font-size: 36rpx;
    font-weight: 700;
    text-align: center;
    padding: 40rpx 20rpx 16rpx;
    color: #1a1a1a;
    border-bottom: 3rpx solid #1a1a1a;
    margin: 0 20rpx;
  }

  .modal-content {
    min-height: 100rpx;
    padding: 24rpx 40rpx 32rpx;
    text-align: center;
    font-size: 30rpx;
    color: #5a5a5a;
    font-weight: 500;
    line-height: 1.5;
  }

  .modal-footer {
    display: flex;
    border-top: 4rpx solid #1a1a1a;
  }

  .btn-cancel,
  .btn-confirm {
    flex: 1;
    height: 88rpx;
    line-height: 88rpx;
    text-align: center;
    font-size: 32rpx;
    font-weight: 700;
    box-sizing: border-box;
  }

  .btn-cancel {
    color: #1a1a1a;
    background-color: #ffffff;
    border-right: 4rpx solid #1a1a1a;
  }

  .btn-cancel:active {
    background-color: #f5f5f5;
    transform: translateY(1rpx);
  }

  .btn-confirm {
    color: #ffffff;
    background-color: #2e7d32;
    border-top: 2rpx solid #4caf50;
    border-left: 2rpx solid #4caf50;
    border-right: 4rpx solid #1a1a1a;
    border-bottom: 4rpx solid #1a1a1a;
  }

  .btn-confirm:active {
    opacity: 1;
    transform: translateY(2rpx);
    border-top: 3rpx solid #1a1a1a;
    border-left: 3rpx solid #1a1a1a;
    border-right: 2rpx solid #4caf50;
    border-bottom: 2rpx solid #4caf50;
  }
</style>