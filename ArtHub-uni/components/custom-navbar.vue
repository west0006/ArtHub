<template>
  <!-- 占位容器，确保页面内容不被状态栏遮挡 -->
  <view class="custom-navbar-placeholder" :style="{ paddingTop: statusBarHeight + 'px' }">
    <view class="navbar" :style="{
      background: background,
      borderBottom: borderBottom,
      paddingTop: statusBarHeight + 'px'
    }">
      <view class="navbar-left">
        <view v-if="showBack" class="back-btn" @tap="handleBack">
          <van-icon name="arrow-left" :size="iconSize" :color="textColor" />
        </view>
      </view>
      <view class="navbar-center">
        <text class="title" :style="{ color: textColor, fontSize: titleSize }">{{ title }}</text>
      </view>
      <view class="navbar-right">
        <slot name="right"></slot>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
  import { ref, onMounted } from 'vue';

  const props = defineProps({
    title: { type: String, default: '' },
    showBack: { type: Boolean, default: true },
    background: { type: String, default: '#ffffff' },
    textColor: { type: String, default: '#1a1a1a' },
    titleSize: { type: String, default: '36rpx' },
    iconSize: { type: String, default: '32rpx' },
    borderBottom: { type: String, default: '6rpx solid #1a1a1a' }  // 夸克风格粗黑下边框
  });

  const emit = defineEmits(['back']);

  const statusBarHeight = ref(20);
  onMounted(() => {
    const systemInfo = uni.getSystemInfoSync();
    statusBarHeight.value = systemInfo.statusBarHeight || 20;
  });

  const handleBack = () => {
    emit('back');
    // 默认行为：返回上一页
    uni.navigateBack();
  };
</script>

<style scoped>
  .custom-navbar-placeholder {
    width: 100%;
    box-sizing: border-box;
  }

  .navbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: 44px;
    /* 标准导航栏高度 */
    padding: 0 32rpx;
    /* paddingTop 已在 inline style 中动态设置，合并状态栏高度 */
    box-sizing: border-box;
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    z-index: 999;
  }

  .navbar-left,
  .navbar-right {
    min-width: 64rpx;
    display: flex;
    align-items: center;
  }

  .navbar-center {
    flex: 1;
    text-align: center;
    overflow: hidden;
  }

  .title {
    font-weight: 700;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .back-btn {
    width: 64rpx;
    height: 64rpx;
    display: flex;
    align-items: center;
    justify-content: center;
  }
</style>