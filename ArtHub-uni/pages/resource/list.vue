<template>
  <view class="page-container studios-page">
    <custom-navbar :title="'主页'">

    </custom-navbar>
    <view class="nav">
      <view class="nav_search" @tap="gotoSearch">
        <van-icon name="search" size="40rpx" color="#666666" />
        <text class="search-text">搜索素材和教程</text>
      </view>
      <view class="nav_tag">
        <view class="nav_text" :class="{ active: currentTag === 1 }" @tap="tolearn1">素材</view>
        <view class="nav_text" :class="{ active: currentTag === 2 }" @tap="tolearn2">教程</view>
      </view>
    </view>

    <view class="content-container">
      <van-tabs :active="active" @change="onChange" animated sticky swipeable class="category-tabs">
        <van-tab v-for="item in type" :key="item.name" :title="item.name">
          <scroll-view class="tab-content-scroll" scroll-y>
            <view class="resource-grid">
              <view class="resource-item" v-for="resource in resourceList" :key="resource.id" @tap="onResourceTap"
                @longpress="onResourceLongPress" :data-item="resource">
                <view class="resource-image">
                  <view class="image-placeholder" :class="resource.index">
                    <van-icon v-if="currentTag === 1" name="photo-o" size="80rpx" color="#ffffff" />
                    <van-icon v-else name="video-o" size="80rpx" color="#ffffff" />
                  </view>
                  <view class="resource-badge" v-if="resource.isNew">NEW</view>
                  <view class="library-badge" v-if="resource.isInLibrary">
                    <van-icon name="passed" size="24rpx" color="#ffffff" />
                    <text>已入库</text>
                  </view>
                </view>
                <view class="resource-info">
                  <text class="resource-title">{{ resource.title }}</text>
                  <view class="resource-meta">
                    <text class="resource-author">{{ resource.author }}</text>
                  </view>
                </view>
              </view>
            </view>

            <view class="empty-state" v-if="resourceList.length === 0">
              <van-icon name="photo-o" size="120rpx" color="#cccccc" />
              <text class="empty-text">暂无内容</text>
              <text class="empty-subtext">去其他地方看看吧</text>
            </view>
          </scroll-view>
          <view class="bottom-safe-area" style="height: 60rpx;"></view>
        </van-tab>
      </van-tabs>
    </view>

    <ai-float />
    <van-action-sheet :show="showActionSheet" :actions="actions" @close="onCloseActionSheet" @select="onSelectAction"
      close-on-click-action />
  </view>
</template>

<script setup lang="ts">
  import { ref } from 'vue';
  import { onShow } from '@dcloudio/uni-app';
  import { useStore } from '@/store';
  import AiFloat from '@/components/ai-float/index.vue';
  import CustomNavbar from '@/components/custom-navbar';

  const store = useStore();

  const active = ref(0);
  const currentTag = ref(1); // 1素材 2教程
  const resourceList = ref<any[]>([]);
  const showActionSheet = ref(false);
  const actions = ref<any[]>([]);
  const selectedResource = ref<any>(null);

  const type1 = [
    { name: '推荐', idx: 'q' }, { name: 'UI/UX', idx: 'w' }, { name: '平面', idx: 'e' }, { name: '插画', idx: 'r' },
    { name: '游戏', idx: 't' }, { name: '动漫', idx: 'y' }, { name: '建筑', idx: 'u' }, { name: '服装', idx: 'i' },
    { name: '汽车', idx: 'o' }, { name: '动物', idx: 'p' }
  ];
  const type2 = [
    { name: '速写', idx: 'a' }, { name: '人体', idx: 's' }, { name: '动态', idx: 'd' }, { name: '色彩', idx: 'f' },
    { name: '设计', idx: 'g' }, { name: '氛围感', idx: 'h' }, { name: '大场景', idx: 'j' }
  ];

  const type = ref(type1);

  const loadResources = () => {
    const category = type.value[active.value]?.name || '推荐';
    const resourceType = currentTag.value === 1 ? 'material' : 'tutorial';
    const resources = store.getResourcesByType(resourceType, category === '推荐' ? undefined : category);
    resourceList.value = resources.map((r : any) => ({
      ...r,
      isInLibrary: store.materialLibrary.some((item : any) => item.id === r.id),
    }));
  };

  const onChange = (e : any) => {
    active.value = e.detail.index;
    loadResources();
  };
  const tolearn1 = () => {
    currentTag.value = 1;
    type.value = type1;
    loadResources();
  };
  const tolearn2 = () => {
    currentTag.value = 2;
    type.value = type2;
    loadResources();
  };
  const gotoSearch = () => uni.navigateTo({ url: '/pages/resource/search' });

  const onResourceTap = (e : any) => {
    const item = e.currentTarget.dataset.item;
    uni.navigateTo({ url: `/pages/resource/detail?id=${item.id}&type=${currentTag.value}` });
  };

  const onResourceLongPress = (e : any) => {
    const item = e.currentTarget.dataset.item;
    selectedResource.value = item;
    const acts = [];
    if (item.resourceType === 'material') {
      if (item.isInLibrary) {
        acts.push({ name: '从素材库移除', value: 'removeFromLibrary' });
        acts.push({ name: '添加到订单素材', value: 'addToOrder' });
      } else {
        acts.push({ name: '添加到素材库', value: 'addToLibrary' });
        acts.push({ name: '添加到订单素材', value: 'addToOrder' });
      }
    } else {
      acts.push({ name: '查看教程详情', value: 'viewTutorial' });
    }
    actions.value = acts;
    showActionSheet.value = true;
  };

  const onCloseActionSheet = () => {
    showActionSheet.value = false;
    selectedResource.value = null;
    actions.value = [];
  };

  const onSelectAction = (e : any) => {
    const value = e.detail.value;
    const res = selectedResource.value;
    if (!res) return;
    switch (value) {
      case 'addToLibrary':
        store.addToMaterialLibrary(res);
        break;
      case 'removeFromLibrary':
        store.removeFromMaterialLibrary(res.id);
        break;
      case 'addToOrder':
        uni.showToast({ title: '已添加到订单素材', icon: 'success' });
        break;
      case 'viewTutorial':
        uni.navigateTo({ url: `/pages/resource/detail?id=${res.id}&type=2` });
        break;
    }
    onCloseActionSheet();
    loadResources();
  };

  onShow(() => loadResources());
</script>

<style scoped>
  page {
    background-color: #ffffff;
    /* 纯白背景 */
  }

  .studios-page {
    background-color: #ffffff;
  }

  /* 导航栏 - 粗黑边框分割 */
  .nav {
    display: flex;
    align-items: center;
    padding: 20rpx 32rpx;
    background-color: #ffffff;
    border-bottom: 6rpx solid #1a1a1a;
  }

  .nav_search {
    flex: 1;
    display: flex;
    align-items: center;
    padding: 20rpx 24rpx;
    background-color: #ffffff;
    border-top: var(--border-thin) solid var(--border-top-light);
    border-left: var(--border-thin) solid var(--border-top-light);
    border-right: var(--border-thick) solid var(--border-bottom-dark);
    border-bottom: var(--border-thick) solid var(--border-bottom-dark);
    border-radius: 8rpx;
    margin-right: 32rpx;
    box-sizing: border-box;
  }

  .search-text {
    font-size: 26rpx;
    color: #5a5a5a;
    margin-left: 16rpx;
    font-weight: 500;
  }

  .nav_tag {
    display: flex;
    background-color: #ffffff;
    border-top: var(--border-thin) solid var(--border-top-light);
    border-left: var(--border-thin) solid var(--border-top-light);
    border-right: var(--border-thick) solid var(--border-bottom-dark);
    border-bottom: var(--border-thick) solid var(--border-bottom-dark);
    border-radius: 8rpx;
    padding: 8rpx;
    box-sizing: border-box;
  }

  .nav_text {
    font-size: 26rpx;
    padding: 16rpx 32rpx;
    border-radius: 6rpx;
    color: #1a1a1a;
    font-weight: 600;
    transition: none;
  }

  .nav_text.active {
    background-color: #2e7d32;
    /* 绿色激活态 */
    color: #ffffff;
    font-weight: 700;
  }

  .content-container {
    flex: 1;
    display: flex;
    flex-direction: column;
  }

  .category-tabs {
    flex: 1;
    display: flex;
    flex-direction: column;
  }

  .tab-content-scroll {
    flex: 1;
    height: 100%;
  }

  /* 资源网格  */
  .resource-grid {
    display: flex;
    flex-wrap: wrap;
    padding: 32rpx;
    gap: 24rpx;
  }

  .resource-item {
    width: calc(50% - 12rpx);
    background-color: #ffffff;
    border-top: var(--border-thin) solid var(--border-top-light);
    border-left: var(--border-thin) solid var(--border-top-light);
    border-right: var(--border-thick) solid var(--border-bottom-dark);
    border-bottom: var(--border-thick) solid var(--border-bottom-dark);
    border-radius: 8rpx;
    overflow: hidden;
    box-sizing: border-box;
    transition: none;
  }

  .resource-item:active {
    transform: scale(0.98);
    background-color: #f5f5f5;
  }

  /* 图片区域 - 纯色替代渐变，尺寸保留 */
  .resource-image {
    position: relative;
    width: 100%;
    height: 240rpx;
    overflow: hidden;
    background-color: #2e7d32;
    /* 绿色基底 */
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .image-placeholder {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: #2e7d32 !important;
    /* 统一绿色，覆盖原渐变 */
    color: #ffffff;
    font-weight: 700;
  }

  /* 覆盖所有占位符渐变，统一为绿色或黑色纹理 */
  .image-placeholder.q,
  .image-placeholder.w,
  .image-placeholder.e,
  .image-placeholder.r,
  .image-placeholder.t,
  .image-placeholder.y,
  .image-placeholder.u,
  .image-placeholder.i,
  .image-placeholder.o,
  .image-placeholder.p,
  .image-placeholder.a,
  .image-placeholder.s,
  .image-placeholder.d,
  .image-placeholder.f {
    background: #2e7d32 !important;
  }

  .image-placeholder::after {
    content: "📁";
    font-size: 48rpx;
    opacity: 0.3;
    color: #ffffff;
  }

  /* 资源标记 - 绿色为主 */
  .resource-badge {
    position: absolute;
    top: 16rpx;
    right: 16rpx;
    background-color: #1a1a1a;
    color: #ffffff;
    font-size: 20rpx;
    padding: 6rpx 12rpx;
    border-radius: 4rpx;
    font-weight: 700;
    border: 2rpx solid #ffffff;
  }

  .library-badge {
    position: absolute;
    top: 16rpx;
    left: 16rpx;
    background-color: #2e7d32;
    color: #ffffff;
    font-size: 20rpx;
    padding: 6rpx 12rpx;
    border-radius: 4rpx;
    display: flex;
    align-items: center;
    gap: 4rpx;
    font-weight: 700;
    border: 2rpx solid #ffffff;
  }

  /* 资源信息区域 */
  .resource-info {
    padding: 24rpx;
  }

  .resource-title {
    font-size: 26rpx;
    font-weight: 700;
    color: #1a1a1a;
    line-height: 1.4;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    margin-bottom: 16rpx;
  }

  .resource-meta {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .resource-author {
    font-size: 22rpx;
    color: #5a5a5a;
    font-weight: 500;
  }

  .resource-stats {
    display: flex;
    align-items: center;
    gap: 8rpx;
  }

  .stat-text {
    font-size: 20rpx;
    color: #5a5a5a;
    margin-right: 12rpx;
    font-weight: 500;
  }

  /* 空状态 */
  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 120rpx 0;
  }

  .empty-state .van-icon {
    margin-bottom: 32rpx;
    opacity: 0.5;
    color: #1a1a1a;
  }

  .empty-text {
    font-size: 30rpx;
    color: #1a1a1a;
    margin-bottom: 16rpx;
    font-weight: 700;
  }

  .empty-subtext {
    font-size: 24rpx;
    color: #5a5a5a;
    font-weight: 500;
  }
</style>