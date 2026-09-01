<template>
  <view class="page-container">
    <scroll-view class="content-scroll" scroll-y>
      <!-- 图片展示 -->
      <view class="image-container">
        <image class="main-image" :src="materialData.imageUrl || '/static/images/t1.png'" mode="widthFix"
          @error="onImageError" show-menu-by-longpress />
      </view>

      <!-- 信息 -->
      <view class="material-info">
        <view class="info-header">
          <text class="material-title">{{ materialData.title || '素材标题' }}</text>
        </view>
        <!-- 作者 -->
        <view class="author-section">
          <image class="author-avatar" :src="materialData.imageUrl || '/static/images/t1.png'" mode="aspectFill" />
          <view class="author-info">
            <text class="author-name">{{ materialData.author || '未知作者' }}</text>
          </view>
          <button class="follow-btn" :class="{ followed: materialData.isFollowing }" @tap="onFollow">
            {{ materialData.isFollowing ? '已关注' : '关注' }}
          </button>
        </view>

        <!-- 标签 -->
        <view class="tags-section" v-if="materialData.tags && materialData.tags.length > 0">
          <text class="section-label">标签</text>
          <view class="tags-container">
            <view class="tag-item" v-for="tag in materialData.tags" :key="tag">
              <text class="tag-text">#{{ tag }}</text>
            </view>
          </view>
        </view>

        <!-- 描述 -->
        <view class="description-section" v-if="materialData.description">
          <text class="section-label">描述</text>
          <text class="description-text">{{ materialData.description }}</text>
        </view>

        <!-- 详细信息 -->
        <view class="details-section">
          <text class="section-label">详细信息</text>
          <view class="details-grid">
            <view class="detail-item">
              <text class="detail-label">类型</text>
              <text class="detail-value">{{ materialData.resourceType === 'material' ? '素材' : '教程' }}</text>
            </view>
            <view class="detail-item">
              <text class="detail-label">分类</text>
              <text class="detail-value">{{ materialData.type || '未知' }}</text>
            </view>
            <view class="detail-item" v-if="materialData.fileSize">
              <text class="detail-label">大小</text>
              <text class="detail-value">{{ materialData.fileSize }}</text>
            </view>
            <view class="detail-item" v-if="materialData.dimension">
              <text class="detail-label">尺寸</text>
              <text class="detail-value">{{ materialData.dimension }}</text>
            </view>
          </view>
        </view>

        <!-- 相关推荐 -->
        <view class="related-section" v-if="relatedMaterials.length > 0">
          <view class="section-header">
            <text class="section-label">相关推荐</text>
          </view>
          <scroll-view class="related-scroll" scroll-x>
            <view class="related-list">
              <view class="related-item" v-for="item in relatedMaterials" :key="item.id" @tap="onRelatedTap"
                :data-id="item.id">
                <image class="related-image" :src="materialData.imageUrl || '/static/images/t1.png'"
                  mode="aspectFill" />
                <text class="related-title">{{ item.title }}</text>
              </view>
            </view>
          </scroll-view>
        </view>
      </view>
      <view class="bottom-safe-area"></view>
    </scroll-view>

    <!-- 底部操作栏 -->
    <view class="fixed-bottom-actions">
      <view class="action-buttons">
        <view class="action-btn add-btn" @tap="onAddToLibrary">
          <van-icon :name="materialData.isCollected ? 'success' : 'plus'" size="32rpx" color="#ffffff" />
          <text>{{ materialData.isCollected ? '已添加' : '添加到库' }}</text>
        </view>
        <view class="action-btn download-btn" @tap="onDownload">
          <van-icon name="down" size="32rpx" color="#ffffff" />
          <text>下载</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
  import { ref } from 'vue';
  import { useStore } from '@/store';
  import { onLoad as uniOnLoad, onShow } from '@dcloudio/uni-app';

  const store = useStore();

  const resourceId = ref(0);
  const resourceType = ref(1); // 1素材 2教程
  const materialData = ref<any>({});
  const relatedMaterials = ref<any[]>([]);

  const loadResourceDetail = () => {
    const resources = resourceType.value === 1 ? store.mockMaterials : store.mockTutorials;
    const resource = resources.find((r : any) => r.id === resourceId.value);
    if (resource) {
      const isInLibrary = store.materialLibrary.some((lib : any) => lib.id === resourceId.value);
      materialData.value = { ...resource, isCollected: isInLibrary, isFollowing: resource.isFollowing || false };
      // 加载相关推荐
      const related = resources
        .filter((r : any) => r.id !== resourceId.value && (r.type === resource.type || r.tags?.some((t : string) => resource.tags?.includes(t))))
        .slice(0, 4);
      relatedMaterials.value = related;
    } else {
      uni.showToast({ title: '资源不存在', icon: 'error' });
      setTimeout(() => uni.navigateBack(), 1500);
    }
  };

  uniOnLoad((options : any) => {
    resourceId.value = options.id;
    resourceType.value = parseInt(options.type) || 1;
    loadResourceDetail();
  });

  onShow(() => {
    if (resourceId.value) loadResourceDetail();
  });

  const onImageError = () => {
    materialData.value.imageUrl = '/static/images/t1.png';
  };
  const onBack = () => uni.navigateBack();
  const onFollow = () => {
    materialData.value.isFollowing = !materialData.value.isFollowing;
    uni.showToast({ title: materialData.value.isFollowing ? '已关注' : '已取消关注', icon: 'success' });
  };
  const onAddToLibrary = () => {
    if (materialData.value.isCollected) {
      store.removeFromMaterialLibrary(resourceId.value);
      materialData.value.isCollected = false;
      uni.showToast({ title: '已从资源库移除', icon: 'success' });
    } else {
      store.addToMaterialLibrary(materialData.value);
      materialData.value.isCollected = true;
      uni.showToast({ title: '已添加到素材库', icon: 'success' });
    }
  };
  const onDownload = () => {
    uni.showLoading({ title: '下载中...' });
    setTimeout(() => {
      uni.hideLoading();
      uni.showToast({ title: '下载成功', icon: 'success' });
    }, 1000);
  };
  const onRelatedTap = (e : any) => {
    const id = e.currentTarget.dataset.id;
    const item = relatedMaterials.value.find(r => r.id === id);
    if (item) {
      uni.redirectTo({ url: `/pages/resource/detail?id=${id}&type=${item.resourceType === 'material' ? 1 : 2}` });
    }
  };
</script>
<!-- 样式沿用 cDetail.wxss -->

<style>
  .page-container {
    background: #ffffff;
    padding-bottom: 120rpx;
  }

  .content-scroll {
    height: 100vh;
  }

  /* 图片展示区域 - 底部粗边框不变 */
  .image-container {
    position: relative;
    background: #ffffff;
    border-bottom: 6rpx solid #1a1a1a;
  }

  .image-wrapper {
    width: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    background: #f5f5f5;
  }

  .main-image {
    width: 100%;
    max-width: 100%;
  }

  .image-swiper {
    height: 500rpx;
  }

  .swiper-image-wrapper {
    width: 100%;
    height: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    background: #f5f5f5;
  }

  .swiper-image {
    width: 100%;
    height: 100%;
    object-fit: contain;
  }

  /* 图片计数器 - 立体效果 */
  .image-indicator {
    position: absolute;
    bottom: 20rpx;
    right: 20rpx;
    background: #1a1a1a;
    color: #ffffff;
    padding: 8rpx 16rpx;
    border-radius: 4rpx;
    font-size: 24rpx;
    font-weight: 700;
    /* 立体边框 */
    border-top: 2rpx solid #cccccc;
    border-left: 2rpx solid #cccccc;
    border-right: 3rpx solid #1a1a1a;
    border-bottom: 3rpx solid #1a1a1a;
    box-sizing: border-box;
  }

  .indicator-text {
    color: #ffffff;
  }

  /* 素材信息 */
  .material-info {
    padding: var(--large-plate);
    background: #ffffff;
  }

  .info-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: var(--large-module);
  }

  .material-title {
    flex: 1;
    font-size: 34rpx;
    font-weight: 700;
    color: #1a1a1a;
    line-height: 1.4;
    margin-right: var(--large-module);
  }

  .material-meta {
    display: flex;
    flex-direction: column;
    gap: 8rpx;
    flex-shrink: 0;
  }

  .meta-item {
    display: flex;
    align-items: center;
    gap: 4rpx;
  }

  .meta-text {
    font-size: 22rpx;
    color: #5a5a5a;
    font-weight: 500;
  }

  /* 作者信息 - 底部粗分割线保留 */
  .author-section {
    display: flex;
    align-items: center;
    gap: var(--large-module);
    padding: var(--large-module) 0;
    border-bottom: 4rpx solid #1a1a1a;
    margin-bottom: var(--large-module);
  }

  /* 作者头像 - 立体边框 */
  .author-avatar {
    width: 80rpx;
    height: 80rpx;
    border-radius: 6rpx;
    flex-shrink: 0;
    box-sizing: border-box;
    /* 立体边框 */
    border-top: 2rpx solid #cccccc;
    border-left: 2rpx solid #cccccc;
    border-right: 4rpx solid #1a1a1a;
    border-bottom: 4rpx solid #1a1a1a;
  }

  .author-info {
    flex: 1;
  }

  .author-name {
    display: block;
    font-size: 28rpx;
    font-weight: 700;
    color: #1a1a1a;
    margin-bottom: 4rpx;
  }

  .author-bio {
    font-size: 22rpx;
    color: #5a5a5a;
  }

  /* 关注按钮 - 立体按压 */
  .follow-btn {
    padding: 12rpx 24rpx;
    background: #2e7d32;
    color: #ffffff;
    border-radius: 6rpx;
    font-size: 24rpx;
    font-weight: 700;
    box-sizing: border-box;
    /* 立体边框 */
    border-top: 2rpx solid #cccccc;
    border-left: 2rpx solid #cccccc;
    border-right: 5rpx solid #1a1a1a;
    border-bottom: 5rpx solid #1a1a1a;
  }

  .follow-btn:active {
    transform: translateY(2rpx);
    border-top: 4rpx solid #1a1a1a;
    border-left: 4rpx solid #1a1a1a;
    border-right: 2rpx solid #cccccc;
    border-bottom: 2rpx solid #cccccc;
  }

  .follow-btn::after {
    border: none;
  }

  /* 各部分样式 */
  .tags-section,
  .description-section,
  .details-section,
  .related-section {
    margin-bottom: var(--large-plate);
  }

  .section-label {
    display: block;
    font-size: 28rpx;
    font-weight: 700;
    color: #1a1a1a;
    margin-bottom: var(--title-content);
    border-left: 8rpx solid #2e7d32;
    padding-left: 16rpx;
  }

  .tags-container {
    display: flex;
    flex-wrap: wrap;
    gap: 16rpx;
  }

  /* 标签 - 立体边框 */
  .tag-item {
    padding: 8rpx 16rpx;
    background: #ffffff;
    border-radius: 4rpx;
    box-sizing: border-box;
    /* 立体边框 */
    border-top: 2rpx solid #cccccc;
    border-left: 2rpx solid #cccccc;
    border-right: 3rpx solid #1a1a1a;
    border-bottom: 3rpx solid #1a1a1a;
  }

  .tag-text {
    font-size: 24rpx;
    color: #1a1a1a;
    font-weight: 500;
  }

  .description-text {
    font-size: 26rpx;
    color: #5a5a5a;
    line-height: 1.6;
    font-weight: 500;
  }

  .details-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--large-module);
  }

  .detail-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: var(--card-meta) 0;
    border-bottom: 3rpx solid #1a1a1a;
  }

  .detail-label {
    font-size: 24rpx;
    color: #5a5a5a;
    font-weight: 500;
  }

  .detail-value {
    font-size: 24rpx;
    color: #1a1a1a;
    font-weight: 700;
  }

  /* 相关推荐 */
  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: var(--title-content);
  }

  .section-more {
    font-size: 24rpx;
    color: #2e7d32;
    font-weight: 700;
    border-bottom: 2rpx solid #2e7d32;
  }

  .related-scroll {
    white-space: nowrap;
  }

  .related-list {
    display: inline-flex;
    gap: var(--large-module);
  }

  .related-item {
    width: 200rpx;
    flex-shrink: 0;
  }

  /* 相关推荐图片 - 立体边框 */
  .related-image {
    width: 200rpx;
    height: 150rpx;
    border-radius: 6rpx;
    margin-bottom: 8rpx;
    box-sizing: border-box;
    /* 立体边框 */
    border-top: 2rpx solid #cccccc;
    border-left: 2rpx solid #cccccc;
    border-right: 4rpx solid #1a1a1a;
    border-bottom: 4rpx solid #1a1a1a;
  }

  .related-title {
    display: block;
    font-size: 24rpx;
    font-weight: 700;
    color: #1a1a1a;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  /* 底部操作栏 - 顶部粗边框 */
  .fixed-bottom-actions {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    background: #ffffff;
    padding: 20rpx var(--large-plate);
    border-top: 6rpx solid #1a1a1a;
    z-index: 999;
  }

  .action-buttons {
    display: flex;
    gap: var(--large-module);
  }

  /* 底部按钮 - 立体按压 */
  .action-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8rpx;
    padding: 20rpx;
    border-radius: 6rpx;
    font-size: 26rpx;
    font-weight: 700;
    transition: none;
    box-sizing: border-box;
    /* 立体边框 */
    border-top: 2rpx solid #cccccc;
    border-left: 2rpx solid #cccccc;
    border-right: 5rpx solid #1a1a1a;
    border-bottom: 5rpx solid #1a1a1a;
  }

  .action-btn:active {
    transform: translateY(2rpx);
    border-top: 4rpx solid #1a1a1a;
    border-left: 4rpx solid #1a1a1a;
    border-right: 2rpx solid #cccccc;
    border-bottom: 2rpx solid #cccccc;
  }

  .collect-btn {
    background: #ffffff;
    color: #1a1a1a;
    flex: 1;
  }

  .collect-btn.collected {
    background: #2e7d32;
    color: #ffffff;
  }

  .add-btn {
    background: #2e7d32;
    color: #ffffff;
    flex: 2;
  }

  .download-btn {
    background: #1a1a1a;
    color: #ffffff;
    flex: 1;
  }

  .bottom-safe-area {
    height: 40rpx;
    background: transparent;
  }
</style>