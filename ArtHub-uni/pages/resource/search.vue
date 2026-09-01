<template>
  <view class="page-container search-page">
    <!-- 搜索栏 -->
    <view class="search-bar">
      <view class="search-input-container">
        <view class="search-input-wrapper">
          <van-icon name="search" size="32rpx" color="#999999" />
          <input class="search-input" placeholder="搜索素材、教程..." :value="searchValue" @input="onSearchInput"
            @confirm="onSearchConfirm" :focus="autoFocus" />
          <van-icon v-if="searchValue" name="clear" size="32rpx" color="#999999" @tap="onClearSearch" />
        </view>
      </view>
    </view>

    <!-- 搜索历史 -->
    <view class="search-history" v-if="!searchValue && !showResults">
      <view class="section-header">
        <text class="section-title">搜索历史</text>
        <view class="clear-history" @tap="onClearHistory" v-if="searchHistory.length > 0">
          <van-icon name="delete-o" size="28rpx" color="#999999" />
          <text>清空</text>
        </view>
      </view>
      <view class="history-tags">
        <view class="history-tag" v-for="(kw, idx) in searchHistory" :key="idx" @tap="onHistoryTap" :data-keyword="kw">
          <van-icon name="clock-o" size="24rpx" color="#666666" />
          <text>{{ kw }}</text>
        </view>
      </view>
    </view>

    <!-- 热门搜索 -->
    <view class="hot-search" v-if="!searchValue && !showResults">
      <view class="section-header">
        <text class="section-title">热门搜索</text>
      </view>
      <view class="hot-tags">
        <view class="hot-tag" v-for="item in hotSearch" :key="item.keyword" @tap="onHotSearchTap"
          :data-keyword="item.keyword">
          <text class="hot-index" :class="{ 'top-three': item.index <= 3 }">{{ item.index }}</text>
          <text class="hot-keyword">{{ item.keyword }}</text>
          <view class="hot-trend" v-if="item.trend === 'up'">
            <van-icon name="arrow-up" size="20rpx" color="#E64340" />
          </view>
        </view>
      </view>
    </view>

    <!-- 搜索结果 -->
    <view class="search-results" v-if="showResults">
      <view class="results-header">
        <text class="results-title">
          搜索"{{ searchValue }}"
          <text class="results-count">({{ searchResults.length }}个结果)</text>
        </text>
        <view class="filter-tabs">
          <view class="filter-tab" :class="{ active: currentFilter === 'all' }" @tap="onFilterChange" data-filter="all">
            全部</view>
          <view class="filter-tab" :class="{ active: currentFilter === 'material' }" @tap="onFilterChange"
            data-filter="material">素材</view>
          <view class="filter-tab" :class="{ active: currentFilter === 'tutorial' }" @tap="onFilterChange"
            data-filter="tutorial">教程</view>
        </view>
      </view>
      <scroll-view class="results-scroll" scroll-y>
        <view class="results-list">
          <view class="result-item" v-for="item in filteredResults" :key="item.id" @tap="onResultTap" :data-item="item">
            <view class="result-image">
              <view class="image-placeholder" :class="item.resourceType">
                <van-icon :name="item.resourceType === 'material' ? 'photo-o' : 'video-o'" size="60rpx"
                  color="#ffffff" />
              </view>
              <view class="result-badge" v-if="item.isNew">NEW</view>
            </view>
            <view class="result-info">
              <text class="result-title">
                <text class="highlight-text">{{ searchValue }}</text>
                <text>{{ item.title.replace(searchValue, '') }}</text>
              </text>
              <view class="result-meta">
                <text class="result-author">{{ item.author }}</text>
                <text class="result-type">{{ item.type }}</text>
              </view>
              <view class="result-stats">
                <view class="stat-item">
                  <van-icon name="eye-o" size="20rpx" color="#999999" />
                  <text>{{ item.views }}</text>
                </view>
                <view class="stat-item">
                  <van-icon name="like-o" size="20rpx" color="#999999" />
                  <text>{{ item.likes }}</text>
                </view>
              </view>
            </view>
          </view>
          <view class="empty-results" v-if="filteredResults.length === 0">
            <van-icon name="search" size="120rpx" color="#cccccc" />
            <text class="empty-text">没有找到相关结果</text>
            <text class="empty-subtext">换个关键词试试吧</text>
          </view>
        </view>
      </scroll-view>
    </view>

    <view class="bottom-safe-area"></view>
  </view>
</template>

<script setup lang="ts">
  import { ref, computed } from 'vue';
  import { useStore } from '@/store';
  import { onLoad } from '@dcloudio/uni-app';

  const store = useStore();

  const searchValue = ref('');
  const searchResults = ref<any[]>([]);
  const searchHistory = ref<string[]>([]);
  const showResults = ref(false);
  const currentFilter = ref<'all' | 'material' | 'tutorial'>('all');
  const autoFocus = ref(true);

  const hotSearch = ref([
    { keyword: 'UI设计', index: 1, trend: 'up' as const },
    { keyword: '插画素材', index: 2, trend: 'up' as const },
    { keyword: '海报模板', index: 3, trend: 'down' as const },
    { keyword: 'Procreate教程', index: 4, trend: 'up' as const },
    { keyword: '色彩搭配', index: 5, trend: 'stable' as const },
  ]);

  const loadSearchHistory = () => {
    searchHistory.value = uni.getStorageSync('searchHistory') || [];
  };
  const saveSearchHistory = (keyword : string) => {
    let history = searchHistory.value.filter(h => h !== keyword);
    history.unshift(keyword);
    history = history.slice(0, 10);
    searchHistory.value = history;
    uni.setStorageSync('searchHistory', history);
  };

  const onSearchInput = (e : any) => {
    searchValue.value = e.detail.value;
  };
  const onSearchConfirm = () => onSearch();
  const onSearch = () => {
    const keyword = searchValue.value.trim();
    if (!keyword) return uni.showToast({ title: '请输入搜索关键词', icon: 'none' });
    showResults.value = true;
    saveSearchHistory(keyword);
    const results = store.searchResources(keyword, currentFilter.value === 'all' ? undefined : currentFilter.value);
    searchResults.value = results.map((r : any) => ({
      ...r,
      isInLibrary: store.materialLibrary.some((lib : any) => lib.id === r.id),
    }));
  };
  const onClearSearch = () => {
    searchValue.value = '';
    searchResults.value = [];
    showResults.value = false;
  };
  const onHistoryTap = (e : any) => {
    searchValue.value = e.currentTarget.dataset.keyword;
    onSearch();
  };
  const onHotSearchTap = (e : any) => {
    searchValue.value = e.currentTarget.dataset.keyword;
    onSearch();
  };
  const onClearHistory = () => {
    uni.showModal({
      title: '确认清除',
      content: '确定要清除所有搜索历史吗？',
      success: (res) => {
        if (res.confirm) {
          searchHistory.value = [];
          uni.setStorageSync('searchHistory', []);
        }
      },
    });
  };
  const onFilterChange = (e : any) => {
    currentFilter.value = e.currentTarget.dataset.filter;
    if (searchValue.value) onSearch();
  };
  const onResultTap = (e : any) => {
    const item = e.currentTarget.dataset.item;
    uni.navigateTo({ url: `/pages/resource/detail?id=${item.id}&type=${item.resourceType === 'material' ? 1 : 2}` });
  };

  const filteredResults = computed(() => {
    if (currentFilter.value === 'all') return searchResults.value;
    return searchResults.value.filter((r : any) => r.resourceType === currentFilter.value);
  });

  onLoad(() => loadSearchHistory());
</script>

<style>
  .search-page {
    background: #ffffff;
    /* 纯白背景 */
  }

  .search-bar {
    padding: 20rpx var(--large-plate);
    background: #ffffff;
    border-bottom: 6rpx solid #1a1a1a;
    /* 粗黑下边框替代细线 */
  }

  .search-input-container {
    display: flex;
    align-items: center;
    gap: var(--large-module);
  }

  .search-input-wrapper {
    flex: 1;
    display: flex;
    align-items: center;
    background: #ffffff;
    border: 4rpx solid #1a1a1a;
    /* 粗黑边框 */
    border-radius: 6rpx;
    /* 微圆角 */
    padding: 16rpx 24rpx;
    gap: 16rpx;
    box-sizing: border-box;
  }

  .search-input {
    flex: 1;
    font-size: 28rpx;
    color: #1a1a1a;
    font-weight: 500;
  }

  .search-input::placeholder {
    color: #8a8a8a;
  }

  /* 取消按钮文字 */
  .cancel-text {
    font-size: 28rpx;
    color: #2e7d32;
    font-weight: 700;
  }

  /* 搜索历史和热门搜索 */
  .search-history,
  .hot-search {
    padding: var(--large-plate);
  }

  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: var(--title-content);
  }

  .section-title {
    font-size: 30rpx;
    font-weight: 700;
    color: #1a1a1a;
    border-left: 8rpx solid #2e7d32;
    /* 绿色强调条 */
    padding-left: 16rpx;
  }

  .clear-history {
    display: flex;
    align-items: center;
    gap: 8rpx;
    font-size: 24rpx;
    color: #5a5a5a;
    font-weight: 500;
  }

  .history-tags,
  .hot-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 16rpx;
  }

  .history-tag,
  .hot-tag {
    display: flex;
    align-items: center;
    gap: 8rpx;
    padding: 12rpx 20rpx;
    background: #ffffff;
    border: 3rpx solid #1a1a1a;
    border-radius: 6rpx;
    font-size: 26rpx;
    color: #1a1a1a;
    font-weight: 500;
    box-sizing: border-box;
  }

  .hot-tag {
    width: calc(50% - 8rpx);
  }

  .hot-index {
    font-size: 20rpx;
    color: #5a5a5a;
    min-width: 24rpx;
    font-weight: 500;
  }

  .hot-index.top-three {
    color: #2e7d32;
    /* 绿色替代红色强调 */
    font-weight: 700;
  }

  .hot-keyword {
    flex: 1;
  }

  .hot-trend {
    display: flex;
    align-items: center;
  }

  /* 搜索结果 */
  .search-results {
    flex: 1;
    display: flex;
    flex-direction: column;
  }

  .results-header {
    padding: var(--large-module) var(--large-plate);
    background: #ffffff;
    border-bottom: 4rpx solid #1a1a1a;
  }

  .results-title {
    display: block;
    font-size: 28rpx;
    color: #1a1a1a;
    margin-bottom: var(--large-module);
    font-weight: 700;
  }

  .results-count {
    color: #5a5a5a;
    font-size: 24rpx;
    font-weight: 500;
  }

  .filter-tabs {
    display: flex;
    background: #ffffff;
    border: 4rpx solid #1a1a1a;
    border-radius: 6rpx;
    padding: 4rpx;
    box-sizing: border-box;
  }

  .filter-tab {
    flex: 1;
    text-align: center;
    padding: 12rpx;
    border-radius: 4rpx;
    font-size: 26rpx;
    color: #1a1a1a;
    font-weight: 500;
    transition: none;
  }

  .filter-tab.active {
    background: #2e7d32;
    color: #ffffff;
    font-weight: 700;
  }

  .results-scroll {
    flex: 1;
  }

  .results-list {
    padding: var(--large-module) var(--large-plate);
  }

  .result-item {
    display: flex;
    gap: var(--large-module);
    padding: var(--large-module) 0;
    border-bottom: 3rpx solid #1a1a1a;
  }

  .result-image {
    position: relative;
    width: 160rpx;
    height: 120rpx;
    border: 4rpx solid #1a1a1a;
    border-radius: 6rpx;
    overflow: hidden;
    flex-shrink: 0;
    box-sizing: border-box;
  }

  .image-placeholder {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 0;
    background: #2e7d32 !important;
    /* 统一绿色背景 */
  }

  /* 覆盖所有渐变占位符 */
  .image-placeholder.material,
  .image-placeholder.tutorial {
    background: #2e7d32 !important;
  }

  .result-badge {
    position: absolute;
    top: 8rpx;
    right: 8rpx;
    background: #1a1a1a;
    color: #ffffff;
    font-size: 20rpx;
    padding: 4rpx 8rpx;
    border-radius: 4rpx;
    font-weight: 700;
    border: 2rpx solid #ffffff;
  }

  .result-info {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
  }

  .result-title {
    font-size: 28rpx;
    color: #1a1a1a;
    line-height: 1.4;
    margin-bottom: 8rpx;
    font-weight: 700;
  }

  .highlight-text {
    color: #2e7d32;
    font-weight: 700;
  }

  .result-meta {
    display: flex;
    gap: var(--large-module);
    margin-bottom: 8rpx;
  }

  .result-author,
  .result-type {
    font-size: 22rpx;
    color: #5a5a5a;
    font-weight: 500;
  }

  .result-stats {
    display: flex;
    gap: var(--large-module);
  }

  .stat-item {
    display: flex;
    align-items: center;
    gap: 4rpx;
    font-size: 20rpx;
    color: #5a5a5a;
    font-weight: 500;
  }

  /* 空结果状态 */
  .empty-results {
    text-align: center;
    padding: var(--large-plate);
    color: #5a5a5a;
  }

  .empty-text {
    display: block;
    font-size: 28rpx;
    margin: var(--title-content) 0 var(--card-meta);
    font-weight: 700;
    color: #1a1a1a;
  }

  .empty-subtext {
    font-size: 24rpx;
    color: #8a8a8a;
  }

  .bottom-safe-area {
    height: 40rpx;
    background: transparent;
  }
</style>