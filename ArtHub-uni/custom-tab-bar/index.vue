<template>
  <van-tabbar :active="store.activetabbarindex" @change="onChange">
    <van-tabbar-item v-for="item in list" :key="item.text" :icon="item.icon" :size="item.size">
      {{ item.text }}
    </van-tabbar-item>
  </van-tabbar>
</template>

<script setup lang="ts">
  import { useStore } from '@/store';
  import { ref } from 'vue';

  const store = useStore();

  const list = ref([
    {
      pagePath: '/pages/resource/list',
      text: '首页',
      icon: 'home-o',
      size: '22px',
    },
    {
      pagePath: '/pages/order/calendar',
      text: '排期',
      icon: 'apps-o',
      size: '22px',
    },
    {
      pagePath: '/pages/contact/index',
      text: '我的',
      icon: 'contact',
      size: '22px',
    },
  ]);

  const onChange = (event : any) => {
    const index = event.detail;
    store.updataactivetabbaarindex(index);
    uni.switchTab({ url: list.value[index].pagePath });
  };
</script>

<style scoped>
  /* 使用 Vant 原生样式覆盖 */
  :deep(.van-tabbar) {
    --tabbar-height: 100rpx;
    background-color: #ffffff;
    border-top: 6rpx solid #1a1a1a;
    box-shadow: none;
  }

  :deep(.van-tabbar-item) {
    --tabbar-item-margin-bottom: 6rpx;
    --tabbar-margin-top: 8rpx;
    --tabbar-item-icon-size: 40rpx;
    --tabbar-item-active-color: #2e7d32;
    --tabbar-item-text-size: 24rpx;
    position: relative;
  }

  :deep(.van-tabbar-item:not(.van-tabbar-item--active)) {
    --tabbar-item-icon-color: #8a8a8a;
    --tabbar-item-text-color: #5a5a5a;
  }

  :deep(.van-tabbar-item--active) {
    --tabbar-item-icon-color: #2e7d32;
    --tabbar-item-text-color: #2e7d32;
    font-weight: 700;
  }

  :deep(.van-tabbar-item--active::after) {
    content: '';
    position: absolute;
    bottom: 8rpx;
    left: 50%;
    transform: translateX(-50%);
    width: 48rpx;
    height: 6rpx;
    background-color: #2e7d32;
    border-radius: 0;
    border: 2rpx solid #1a1a1a;
    box-sizing: border-box;
  }

  :deep(.van-tabbar-item:active) {
    background-color: #1a1a1a !important;
    opacity: 0.05;
  }

  :deep(.van-tabbar-item__icon) {
    margin-bottom: 6rpx !important;
  }

  :deep(.van-tabbar::after) {
    display: none;
  }
</style>