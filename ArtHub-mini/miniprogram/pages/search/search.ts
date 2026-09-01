// pages/search/search.ts
import { storeBindingsBehavior } from 'mobx-miniprogram-bindings'
import { store } from "../../store/store";

interface ResourceItem {
  id: string;
  title: string;
  author: string;
  type: string;
  views: number;
  likes: number;
  isNew: boolean;
  resourceType: 'material' | 'tutorial';
  imageUrl?: string;
  description?: string;
  tags?: string[];
  isInLibrary?: boolean;
}

Page({
  behaviors: [storeBindingsBehavior],
  storeBindings: {
    store,
    fields: {
      materialLibrary: "materialLibrary",
      mockMaterials: "mockMaterials",
      mockTutorials: "mockTutorials"
    },
    actions: {
      addToMaterialLibrary: "addToMaterialLibrary",
      removeFromMaterialLibrary: "removeFromMaterialLibrary",
      searchResources: "searchResources"
    }
  },

  data: {
    searchValue: '',
    searchResults: [] as ResourceItem[],
    searchHistory: [] as string[],
    showResults: false,
    currentFilter: 'all' as 'all' | 'material' | 'tutorial',
    isLoading: false,
    autoFocus: true,
    
    // 热门搜索数据
    hotSearch: [
      { keyword: 'UI设计', index: 1, trend: 'up' as const },
      { keyword: '插画素材', index: 2, trend: 'up' as const },
      { keyword: '海报模板', index: 3, trend: 'down' as const },
      { keyword: 'Procreate教程', index: 4, trend: 'up' as const },
      { keyword: '色彩搭配', index: 5, trend: 'stable' as const }
    ]
  },

  onLoad() {
    this.loadSearchHistory();
  },

  // 返回上一页
  onBack() {
    wx.navigateBack();
  },

  // 加载搜索历史
  loadSearchHistory() {
    const history = wx.getStorageSync('searchHistory') || [];
    this.setData({
      searchHistory: history
    });
  },

  // 保存搜索历史
  saveSearchHistory(keyword: string) {
    let history = this.data.searchHistory;

    // 移除已存在的关键词
    history = history.filter(item => item !== keyword);

    // 添加到开头
    history.unshift(keyword);

    // 只保留最近10条
    history = history.slice(0, 10);

    this.setData({
      searchHistory: history
    });

    wx.setStorageSync('searchHistory', history);
  },

  // 输入搜索内容
  onSearchInput(e: any) {
    this.setData({
      searchValue: e.detail.value
    });
  },

  // 确认搜索（键盘搜索按钮）
  onSearchConfirm() {
    this.onSearch();
  },

  // 执行搜索
  onSearch() {
    const keyword = this.data.searchValue.trim();

    if (!keyword) {
      wx.showToast({
        title: '请输入搜索关键词',
        icon: 'none'
      });
      return;
    }

    this.setData({
      isLoading: true,
      showResults: true
    });

    // 保存搜索历史
    this.saveSearchHistory(keyword);

    // 执行搜索
    const results = store.searchResources(keyword, this.data.currentFilter === 'all' ? undefined : this.data.currentFilter);

    // 标记是否在素材库中
    const markedResults = results.map((item: any) => ({
      ...item,
      isInLibrary: store.materialLibrary.some((libItem: any) => libItem.id === item.id)
    }));

    this.setData({
      searchResults: markedResults,
      isLoading: false
    });
  },

  // 清除搜索
  onClearSearch() {
    this.setData({
      searchValue: '',
      searchResults: [],
      showResults: false
    });
  },

  // 点击历史记录
  onHistoryTap(e: any) {
    const keyword = e.currentTarget.dataset.keyword;
    this.setData({
      searchValue: keyword
    });
    this.onSearch();
  },

  // 点击热门搜索
  onHotSearchTap(e: any) {
    const keyword = e.currentTarget.dataset.keyword;
    this.setData({
      searchValue: keyword
    });
    this.onSearch();
  },

  // 清除历史记录
  onClearHistory() {
    wx.showModal({
      title: '确认清除',
      content: '确定要清除所有搜索历史吗？',
      success: (res) => {
        if (res.confirm) {
          this.setData({
            searchHistory: []
          });
          wx.setStorageSync('searchHistory', []);
        }
      }
    });
  },

  // 切换筛选
  onFilterChange(e: any) {
    const filter = e.currentTarget.dataset.filter;
    this.setData({
      currentFilter: filter
    });

    // 如果当前有搜索内容，重新搜索
    if (this.data.searchValue) {
      this.onSearch();
    }
  },

  // 资源点击
  onResultTap(e: any) {
    const item = e.currentTarget.dataset.item;

    wx.navigateTo({
      url: `/pages/cDetail/cDetail?id=${item.id}&type=${item.resourceType === 'material' ? 1 : 2}`
    });
  },

  // 添加到素材库
  onAddToLibrary(e: any) {
    const item = e.currentTarget.dataset.item;

    if (item.resourceType !== 'material') {
      wx.showToast({
        title: '只有素材可以添加到素材库',
        icon: 'none'
      });
      return;
    }

    wx.showLoading({ title: '添加中...' });

    setTimeout(() => {
      store.addToMaterialLibrary(item);

      // 更新搜索结果中的标记状态
      const updatedResults = this.data.searchResults.map(result =>
        result.id === item.id ? { ...result, isInLibrary: true } : result
      );

      this.setData({
        searchResults: updatedResults
      });

      wx.hideLoading();
      wx.showToast({
        title: '已添加到素材库',
        icon: 'success'
      });
    }, 1000);
    
    e.stopPropagation();
  },

  // 从素材库移除
  onRemoveFromLibrary(e: any) {
    const item = e.currentTarget.dataset.item;

    wx.showLoading({ title: '移除中...' });

    setTimeout(() => {
      store.removeFromMaterialLibrary(item.id);

      // 更新搜索结果中的标记状态
      const updatedResults = this.data.searchResults.map(result =>
        result.id === item.id ? { ...result, isInLibrary: false } : result
      );

      this.setData({
        searchResults: updatedResults
      });

      wx.hideLoading();
      wx.showToast({
        title: '已从素材库移除',
        icon: 'success'
      });
    }, 1000);
    
    e.stopPropagation();
  },

  // 计算过滤后的结果
  get filteredResults() {
    const { searchResults, currentFilter } = this.data;
    
    if (currentFilter === 'all') {
      return searchResults;
    }
    
    return searchResults.filter(item => item.resourceType === currentFilter);
  }
});