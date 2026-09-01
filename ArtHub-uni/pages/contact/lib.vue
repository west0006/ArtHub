<template>
  <view class="page-container" :class="{ 'dark-mode': isDarkMode }">
    <!-- 导航栏 -->
    <view class="nav-header">
      <view class="nav-actions">
        <view class="view-switch">
          <view class="view-btn" :class="{ active: currentView === 'grid' }" @tap="onViewChange" data-view="grid">
            <van-icon name="apps-o" size="28rpx" />
          </view>
          <view class="view-btn" :class="{ active: currentView === 'list' }" @tap="onViewChange" data-view="list">
            <van-icon name="bars" size="28rpx" />
          </view>
        </view>
        <view class="search-btn" @tap="onSearch">
          <van-icon name="search" size="32rpx" color="var(--main-text)" />
        </view>
      </view>
    </view>

    <!-- 标签页 -->
    <view class="tabs-section">
      <view class="custom-tabs">
        <view class="tab-item" :class="{ active: currentTab === 'materials' }" @tap="onTabChange" data-tab="materials">
          <van-icon name="photo-o" size="32rpx" />
          <text>素材</text>
          <view class="tab-badge" v-if="stats.materials > 0">{{ stats.materials }}</view>
        </view>
        <view class="tab-item" :class="{ active: currentTab === 'tutorials' }" @tap="onTabChange" data-tab="tutorials">
          <van-icon name="video-o" size="32rpx" />
          <text>教程</text>
          <view class="tab-badge" v-if="stats.tutorials > 0">{{ stats.tutorials }}</view>
        </view>
      </view>
    </view>

    <!-- 资源列表 -->
    <scroll-view class="content-scroll" scroll-y enhanced show-scrollbar="false">
      <view class="resources-container">
        <!-- 网格布局 -->
        <view class="resources-grid" v-if="currentView === 'grid'">
          <view class="resource-card" :class="{ selected: selectedResources.includes(item.id) }"
            v-for="item in currentResources" :key="item.id" @tap="onResourceTap" @longpress="onResourceLongPress"
            :data-item="item">
            <view class="card-image">
              <image class="resource-image" :src="item.imageUrl" mode="aspectFill" lazy-load />
              <view class="card-badges">
                <view class="type-badge" :class="item.resourceType">{{ item.resourceType === 'material' ? '素' : '教' }}
                </view>
                <view class="selected-badge" v-if="selectedResources.includes(item.id)">
                  <van-icon name="success" size="20rpx" color="#ffffff" />
                </view>
              </view>
              <view class="card-actions">
                <view class="action-btn" @tap.stop="onQuickAction" data-action="use" :data-id="item.id">
                  <van-icon name="plus" size="24rpx" color="#ffffff" />
                </view>
              </view>
            </view>
            <view class="card-content">
              <text class="resource-title">{{ item.title }}</text>
              <view class="resource-meta">
                <text class="resource-info">{{ item.fileSize }} • {{ item.type }}</text>
              </view>
            </view>
          </view>
        </view>

        <!-- 列表布局 -->
        <view class="resources-list" v-else>
          <view class="resource-item" :class="{ selected: selectedResources.includes(item.id) }"
            v-for="item in currentResources" :key="item.id" @tap="onResourceTap" @longpress="onResourceLongPress"
            :data-item="item">
            <view class="item-image">
              <image class="resource-image" :src="item.imageUrl" mode="aspectFill" lazy-load />
              <view class="type-badge" :class="item.resourceType">{{ item.resourceType === 'material' ? '素' : '教' }}
              </view>
              <view class="selected-overlay" v-if="selectedResources.includes(item.id)">
                <van-icon name="success" size="24rpx" color="#ffffff" />
              </view>
            </view>
            <view class="item-content">
              <view class="item-header">
                <text class="resource-title">{{ item.title }}</text>
                <view class="item-actions">
                  <van-icon name="ellipsis" size="32rpx" color="var(--low-color)" @tap.stop="onItemAction"
                    :data-item="item" />
                </view>
              </view>
              <text class="resource-desc" v-if="item.description">{{ item.description }}</text>
              <view class="item-meta">
                <text class="meta-text">{{ item.fileSize }}</text>
                <text class="meta-text">{{ item.type }}</text>
              </view>
              <view class="item-tags" v-if="item.tags && item.tags.length > 0">
                <view class="tag" v-for="tag in item.tags.slice(0, 3)" :key="tag">
                  <text>#{{ tag }}</text>
                </view>
                <text class="more-tags" v-if="item.tags.length > 3">+{{ item.tags.length - 3 }}</text>
              </view>
            </view>
          </view>
        </view>

        <!-- 空状态 -->
        <view class="empty-state" v-if="currentResources.length === 0">
          <van-icon name="photo-o" size="120rpx" color="var(--low-color)" />
          <text class="empty-text">{{ currentTab === 'materials' ? '暂无素材' : '暂无教程' }}</text>
          <text class="empty-subtext">去发现页面添加一些资源吧</text>
          <button class="discover-btn" @tap="goToDiscover">去发现</button>
        </view>
      </view>
      <view class="bottom-safe-area"></view>
    </scroll-view>

    <!-- 底部批量操作栏 -->
    <view class="fixed-bottom-actions" v-if="selectedResources.length > 0">
      <view class="batch-actions">
        <text class="selected-count">已选 {{ selectedResources.length }} 个</text>
        <view class="batch-btns">
          <view class="batch-btn" @tap="onBatchDelete">
            <van-icon name="delete-o" size="28rpx" />
            <text>删除</text>
          </view>
          <view class="batch-btn" @tap="onBatchDownload">
            <van-icon name="down" size="28rpx" />
            <text>下载</text>
          </view>
          <view class="batch-btn cancel-btn" @tap="clearSelection">
            <van-icon name="close" size="28rpx" />
            <text>取消</text>
          </view>
        </view>
      </view>
    </view>

    <van-action-sheet :show="showActionSheet" :actions="actionItems" @close="onCloseActionSheet"
      @select="onActionSelect" close-on-click-action />
  </view>
</template>

<script setup lang="ts">
  import { ref, reactive, } from 'vue';
  import { onShow } from '@dcloudio/uni-app';
  import { useStore } from '@/store';

  const store = useStore();

  const currentTab = ref<'materials' | 'tutorials'>('materials');
  const currentView = ref<'grid' | 'list'>('grid');
  const isDarkMode = ref(false);
  const selectedResources = ref<string[]>([]);
  const showActionSheet = ref(false);
  const actionItems = ref<any[]>([]);
  const selectedResource = ref<any>(null);

  const stats = reactive({
    materials: 0,
    tutorials: 0,
    totalSize: '0MB',
  });

  const currentResources = ref<any[]>([]);

  const loadResources = () => {
    const resources = store.materialLibrary.map((item : any) => ({
      ...item,
      isCollected: true,
    }));
    filterResources(resources);
    calculateStats(resources);
  };

  const filterResources = (resources : any[]) => {
    const type = currentTab.value === 'materials' ? 'material' : 'tutorial';
    currentResources.value = resources.filter(r => r.resourceType === type);
  };

  const calculateStats = (resources : any[]) => {
    stats.materials = resources.filter(r => r.resourceType === 'material').length;
    stats.tutorials = resources.filter(r => r.resourceType === 'tutorial').length;
    const totalSizeMB = resources.reduce((sum, r) => sum + (parseFloat(r.fileSize) || 0), 0);
    stats.totalSize = totalSizeMB >= 1000 ? `${(totalSizeMB / 1000).toFixed(1)}GB` : `${totalSizeMB.toFixed(1)}MB`;
  };

  const onTabChange = (e : any) => {
    currentTab.value = e.currentTarget.dataset.tab;
    loadResources();
    clearSelection();
  };
  const onViewChange = (e : any) => {
    currentView.value = e.currentTarget.dataset.view;
  };
  const onSearch = () => uni.navigateTo({ url: '/pages/resource/search' });

  const onResourceTap = (e : any) => {
    const item = e.currentTarget.dataset.item;
    if (selectedResources.value.length > 0) {
      toggleSelection(item.id);
      return;
    }
    uni.navigateTo({ url: `/pages/resource/detail?id=${item.id}&type=${item.resourceType === 'material' ? 1 : 2}` });
  };
  const onResourceLongPress = (e : any) => {
    const item = e.currentTarget.dataset.item;
    setActionSheet(item);
  };

  const toggleSelection = (id : string) => {
    const idx = selectedResources.value.indexOf(id);
    if (idx > -1) {
      selectedResources.value.splice(idx, 1);
    } else {
      selectedResources.value.push(id);
    }
  };
  const clearSelection = () => {
    selectedResources.value = [];
  };

  const setActionSheet = (item : any) => {
    const actions = [];
    actions.push({ name: '使用', value: 'use' });
    actions.push({ name: '下载', value: 'download' });
    actions.push({ name: '分享', value: 'share' });
    if (item.resourceType === 'material') {
      actions.push({ name: '从素材库移除', value: 'delete', color: '#E64340' });
    } else {
      actions.push({ name: '取消收藏', value: 'delete', color: '#E64340' });
    }
    actionItems.value = actions;
    selectedResource.value = item;
    showActionSheet.value = true;
  };

  const onCloseActionSheet = () => {
    showActionSheet.value = false;
    selectedResource.value = null;
    actionItems.value = [];
  };

  const onActionSelect = (e : any) => {
    const value = e.detail.value;
    const resource = selectedResource.value;
    if (!resource) return;
    switch (value) {
      case 'use': useResource(resource.id); break;
      case 'download': downloadResource(resource); break;
      case 'share': shareResource(resource); break;
      case 'delete': deleteResource(resource); break;
    }
    onCloseActionSheet();
  };

  const onItemAction = (e : any) => {
    const item = e.currentTarget.dataset.item;
    setActionSheet(item);
  };
  const onQuickAction = (e : any) => {
    const id = e.currentTarget.dataset.id;
    useResource(id);
  };

  const useResource = (id : string) => {
    uni.showToast({ title: '已添加到使用队列', icon: 'success' });
  };
  const downloadResource = (resource : any) => {
    uni.showLoading({ title: '下载中...' });
    setTimeout(() => {
      uni.hideLoading();
      uni.showToast({ title: '下载成功', icon: 'success' });
    }, 1000);
  };
  const shareResource = (resource : any) => {
    uni.showActionSheet({
      itemList: ['分享给好友', '复制链接'],
      success: (res) => {
        if (res.tapIndex === 0) {
          uni.showToast({ title: '已分享给好友', icon: 'success' });
        } else if (res.tapIndex === 1) {
          uni.setClipboardData({
            data: `https://example.com/resource/${resource.id}`,
            success: () => uni.showToast({ title: '链接已复制', icon: 'success' }),
          });
        }
      },
    });
  };
  const deleteResource = (resource : any) => {
    uni.showModal({
      title: '确认删除',
      content: `确定要${resource.resourceType === 'material' ? '从素材库移除' : '取消收藏'}这个资源吗？`,
      confirmColor: '#E64340',
      success: (res) => {
        if (res.confirm) {
          store.removeFromMaterialLibrary(resource.id);
          uni.showToast({ title: resource.resourceType === 'material' ? '已从素材库移除' : '已取消收藏', icon: 'success' });
          setTimeout(() => loadResources(), 500);
        }
      },
    });
  };
  const onBatchDelete = () => {
    if (selectedResources.value.length === 0) {
      uni.showToast({ title: '请先选择要删除的资源', icon: 'none' });
      return;
    }
    uni.showModal({
      title: '确认删除',
      content: `确定要删除选中的 ${selectedResources.value.length} 个资源吗？此操作不可恢复。`,
      confirmColor: '#E64340',
      success: (res) => {
        if (res.confirm) {
          selectedResources.value.forEach(id => store.removeFromMaterialLibrary(id));
          uni.showToast({ title: '删除成功', icon: 'success' });
          setTimeout(() => {
            loadResources();
            clearSelection();
          }, 500);
        }
      },
    });
  };
  const onBatchDownload = () => {
    uni.showLoading({ title: '准备下载...' });
    setTimeout(() => {
      uni.hideLoading();
      uni.showToast({ title: `开始下载 ${selectedResources.value.length} 个文件`, icon: 'success' });
      clearSelection();
    }, 1000);
  };

  const goToDiscover = () => {
    store.updataactivetabbaarindex(1);
    uni.switchTab({ url: '/pages/resource/list' });
  };

  onShow(() => {
    loadResources();
    clearSelection();
  });
</script>

<style scoped>
  /* 样式保持与原小程序一致，以下为关键样式示例 */
  /* 导航栏 - 固定顶部，粗黑下边框 */
  .nav-header {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    height: 88rpx;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 32rpx;
    background: #ffffff;
    z-index: 1000;
    border-bottom: 6rpx solid #1a1a1a;
    box-sizing: border-box;
  }

  .dark-mode .nav-header {
    background: #1a1a1a;
    border-bottom-color: #2e7d32;
  }

  .nav-back,
  .nav-actions {
    width: 64rpx;
    height: 64rpx;
    display: flex;
    align-items: center;
    justify-content: space-around;
    gap: 16rpx;
    color: #1a1a1a;
  }

  .dark-mode .nav-back,
  .dark-mode .nav-actions {
    color: #ffffff;
  }

  .nav-title {
    font-size: 36rpx;
    font-weight: 700;
    color: #1a1a1a;
  }

  .dark-mode .nav-title {
    color: #ffffff;
  }

  .search-btn {
    /* margin-left保留原样 */
  }

  /* 视图切换 - 粗边框容器 */
  .view-switch {
    display: flex;
    gap: 8rpx;
    background: #ffffff;
    border: 4rpx solid #1a1a1a;
    border-radius: 6rpx;
    padding: 4rpx;
    margin-left: 100rpx;
    box-sizing: border-box;
  }

  .dark-mode .view-switch {
    background: #1a1a1a;
    border-color: #2e7d32;
  }

  .view-switch .view-btn {
    width: 64rpx;
    height: 64rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 4rpx;
    color: #1a1a1a;
    font-weight: 500;
    transition: none;
  }

  .view-switch .view-btn.active {
    background: #2e7d32;
    color: #ffffff;
    box-shadow: none;
    border: 2rpx solid #1a1a1a;
    box-sizing: border-box;
  }

  .dark-mode .view-switch .view-btn.active {
    background: #2e7d32;
    color: #ffffff;
  }

  /* 统计卡片区 */
  .stats-section {
    margin-top: 88rpx;
    padding: 32rpx;
    background: #ffffff;
  }

  .dark-mode .stats-section {
    background: #1a1a1a;
  }

  .stats-cards {
    display: flex;
    gap: 24rpx;
  }

  .stat-card {
    flex: 1;
    display: flex;
    align-items: center;
    gap: 20rpx;
    padding: 32rpx 24rpx;
    background: #ffffff;
    border-radius: 8rpx;
    box-sizing: border-box;
    /* 立体边框 */
    border-top: 2rpx solid #cccccc;
    border-left: 2rpx solid #cccccc;
    border-right: 6rpx solid #1a1a1a;
    border-bottom: 6rpx solid #1a1a1a;
  }

  .dark-mode .stat-card {
    background: #2d2d2d;
    border-top-color: #5a5a5a;
    border-left-color: #5a5a5a;
    border-right-color: #000000;
    border-bottom-color: #000000;
  }

  .stat-value {
    font-size: 32rpx;
    font-weight: 700;
    color: #1a1a1a;
    margin-bottom: 4rpx;
  }

  .dark-mode .stat-value {
    color: #ffffff;
  }

  .stat-label {
    font-size: 24rpx;
    color: #5a5a5a;
    font-weight: 500;
  }

  /* 标签页 - 粗下划线 */
  .tabs-section {
    margin-top: 88rpx;
    background: #ffffff;
    padding: 0 32rpx;
    border-bottom: 4rpx solid #1a1a1a;
  }

  .dark-mode .tabs-section {
    background: #1a1a1a;
    border-bottom-color: #2e7d32;
  }

  .custom-tabs {
    display: flex;
    gap: 0;
  }

  .tab-item {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8rpx;
    padding: 24rpx 0;
    font-size: 28rpx;
    font-weight: 500;
    color: #5a5a5a;
    border-bottom: 4rpx solid transparent;
    transition: none;
    position: relative;
  }

  .tab-item.active {
    color: #2e7d32;
    font-weight: 700;
    border-bottom-color: #2e7d32;
  }

  .dark-mode .tab-item.active {
    color: #4caf50;
    border-bottom-color: #4caf50;
  }

  .tab-badge {
    background: #1a1a1a;
    color: #ffffff;
    font-size: 20rpx;
    font-weight: 700;
    padding: 2rpx 8rpx;
    border-radius: 4rpx;
    margin-left: 8rpx;
    border: 2rpx solid #ffffff;
  }

  /* 内容滚动区 */
  .content-scroll {
    height: calc(100vh - 88rpx - 100rpx);
    padding-bottom: 120rpx;
    background: #ffffff;
  }

  .dark-mode .content-scroll {
    background: #1a1a1a;
  }

  /* 网格布局 */
  .resources-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 24rpx;
    padding: 32rpx;
  }

  /* 网格卡片 - 立体边框 */
  .resource-card {
    background: #ffffff;
    border-radius: 8rpx;
    overflow: hidden;
    transition: none;
    box-sizing: border-box;
    /* 立体边框 */
    border-top: 2rpx solid #cccccc;
    border-left: 2rpx solid #cccccc;
    border-right: 5rpx solid #1a1a1a;
    border-bottom: 5rpx solid #1a1a1a;
  }

  .resource-card:active {
    transform: translateY(2rpx);
    border-top: 3rpx solid #1a1a1a;
    border-left: 3rpx solid #1a1a1a;
    border-right: 2rpx solid #cccccc;
    border-bottom: 2rpx solid #cccccc;
  }

  .resource-card.selected {
    border-color: #2e7d32;
    border-width: 6rpx;
  }

  .dark-mode .resource-card {
    background: #2d2d2d;
    border-top-color: #5a5a5a;
    border-left-color: #5a5a5a;
    border-right-color: #000000;
    border-bottom-color: #000000;
  }

  .card-image {
    position: relative;
    width: 100%;
    height: 200rpx;
    background: #f5f5f5;
    overflow: hidden;
    border-bottom: 3rpx solid #1a1a1a;
  }

  .dark-mode .card-image {
    background: #1a1a1a;
    border-bottom-color: #2e7d32;
  }

  .resource-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .card-badges {
    position: absolute;
    top: 12rpx;
    left: 12rpx;
    display: flex;
    gap: 8rpx;
    z-index: 2;
  }

  .type-badge {
    padding: 6rpx 12rpx;
    border-radius: 4rpx;
    font-size: 20rpx;
    font-weight: 700;
    color: #ffffff;
    border: 2rpx solid #1a1a1a;
  }

  .type-badge.material {
    background: #2e7d32;
  }

  .type-badge.tutorial {
    background: #1a1a1a;
  }

  .selected-badge {
    position: absolute;
    top: 12rpx;
    right: 12rpx;
    width: 32rpx;
    height: 32rpx;
    background: #2e7d32;
    border: 3rpx solid #1a1a1a;
    border-radius: 4rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 2;
  }

  .card-actions {
    position: absolute;
    top: 12rpx;
    right: 12rpx;
    z-index: 2;
  }

  .action-btn {
    width: 44rpx;
    height: 44rpx;
    background: #1a1a1a;
    border: 2rpx solid #ffffff;
    border-radius: 4rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    backdrop-filter: none;
  }

  .card-content {
    padding: 20rpx;
  }

  .resource-title {
    font-size: 28rpx;
    font-weight: 700;
    color: #1a1a1a;
    line-height: 1.4;
    margin-bottom: 8rpx;
    overflow: hidden;
    text-overflow: ellipsis;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
  }

  .dark-mode .resource-title {
    color: #ffffff;
  }

  .resource-meta {
    font-size: 22rpx;
    color: #5a5a5a;
    font-weight: 500;
  }

  /* 列表布局 */
  .resources-list {
    padding: 0 32rpx;
  }

  .resource-item {
    display: flex;
    gap: 24rpx;
    padding: 32rpx 0;
    border-bottom: 3rpx solid #1a1a1a;
    transition: none;
  }

  .resource-item:active {
    background: #f5f5f5;
  }

  .dark-mode .resource-item:active {
    background: #2d2d2d;
  }

  .resource-item.selected {
    background: #ffffff;
    margin: 0 -32rpx;
    padding: 32rpx;
    border-radius: 8rpx;
    border: 6rpx solid #2e7d32;
    box-sizing: border-box;
  }

  .dark-mode .resource-item.selected {
    background: #2d2d2d;
    border-color: #4caf50;
  }

  .item-image {
    position: relative;
    width: 120rpx;
    height: 90rpx;
    border-radius: 6rpx;
    overflow: hidden;
    background: #f5f5f5;
    flex-shrink: 0;
    border: 3rpx solid #1a1a1a;
    box-sizing: border-box;
  }

  .dark-mode .item-image {
    background: #1a1a1a;
    border-color: #2e7d32;
  }

  .selected-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(46, 125, 50, 0.3);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 2;
  }

  .item-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
  }

  .item-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 8rpx;
  }

  .item-actions {
    width: 48rpx;
    height: 48rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #1a1a1a;
  }

  .resource-desc {
    font-size: 24rpx;
    color: #5a5a5a;
    line-height: 1.4;
    margin-bottom: 12rpx;
    overflow: hidden;
    text-overflow: ellipsis;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
  }

  .item-meta {
    display: flex;
    gap: 16rpx;
    margin-bottom: 12rpx;
    font-size: 22rpx;
    color: #5a5a5a;
  }

  .item-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 12rpx;
    align-items: center;
  }

  .tag {
    background: #ffffff;
    border: 2rpx solid #1a1a1a;
    padding: 4rpx 12rpx;
    border-radius: 4rpx;
  }

  .dark-mode .tag {
    background: #2d2d2d;
    border-color: #2e7d32;
  }

  .tag text {
    font-size: 20rpx;
    color: #1a1a1a;
    font-weight: 500;
  }

  .more-tags {
    font-size: 20rpx;
    color: #5a5a5a;
  }

  /* 空状态 */
  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 120rpx 32rpx;
    text-align: center;
  }

  .empty-text {
    font-size: 32rpx;
    font-weight: 700;
    color: #1a1a1a;
    margin: 24rpx 0 12rpx;
  }

  .empty-subtext {
    font-size: 26rpx;
    color: #5a5a5a;
    margin-bottom: 32rpx;
  }

  .discover-btn {
    background: #2e7d32;
    color: #ffffff;
    border: 4rpx solid #1a1a1a;
    border-radius: 6rpx;
    padding: 20rpx 48rpx;
    font-size: 28rpx;
    font-weight: 700;
    box-sizing: border-box;
    /* 立体按压 */
    border-top-width: 2rpx;
    border-left-width: 2rpx;
    border-right-width: 5rpx;
    border-bottom-width: 5rpx;
  }

  .discover-btn:active {
    transform: translateY(2rpx);
    border-top-width: 4rpx;
    border-left-width: 4rpx;
    border-right-width: 2rpx;
    border-bottom-width: 2rpx;
  }

  /* 底部固定操作栏 */
  .fixed-bottom-actions {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    background: #ffffff;
    border-top: 6rpx solid #1a1a1a;
    padding: 20rpx 32rpx;
    z-index: 100;
    transition: none;
    box-sizing: border-box;
  }

  .dark-mode .fixed-bottom-actions {
    background: #1a1a1a;
    border-top-color: #2e7d32;
  }

  .batch-actions {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .selected-count {
    font-size: 28rpx;
    color: #1a1a1a;
    font-weight: 700;
  }

  .dark-mode .selected-count {
    color: #ffffff;
  }

  .batch-btns {
    display: flex;
    gap: 24rpx;
  }

  .batch-btn {
    display: flex;
    align-items: center;
    gap: 8rpx;
    padding: 12rpx 24rpx;
    background: #ffffff;
    border: 4rpx solid #1a1a1a;
    border-radius: 6rpx;
    font-size: 26rpx;
    font-weight: 700;
    color: #1a1a1a;
    box-sizing: border-box;
    /* 立体微调 */
    border-top-width: 2rpx;
    border-left-width: 2rpx;
    border-right-width: 4rpx;
    border-bottom-width: 4rpx;
  }

  .batch-btn:active {
    transform: translateY(2rpx);
    border-top-width: 3rpx;
    border-left-width: 3rpx;
    border-right-width: 2rpx;
    border-bottom-width: 2rpx;
  }

  .batch-btn.cancel-btn {
    background: #1a1a1a;
    color: #ffffff;
  }

  .dark-mode .batch-btn {
    background: #2d2d2d;
    border-color: #000000;
    color: #ffffff;
  }

  .dark-mode .batch-btn.cancel-btn {
    background: #000000;
  }

  /* 底部安全区 */
  .bottom-safe-area {
    height: env(safe-area-inset-bottom);
  }
</style>