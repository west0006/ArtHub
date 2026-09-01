// pages/slib/slib.ts
import { storeBindingsBehavior } from 'mobx-miniprogram-bindings'
import { store } from "../../store/store";

interface ResourceItem {
  id: number | string;        // 数据库返回 number，图库返回 string
  title: string;
  author: string;
  type: string;
  resourceType: 'material' | 'tutorial';
  imageUrl: string;
  description: string;
  tags: string[];
  fileSize: string;
  authorAvatar: string;
  dimension?: string;
  copyright?: string;
  sourcePlatform?: string;
  createTime?: string;
}

interface StatsData {
  materials: number;
  tutorials: number;
  totalSize: string;
}

Page({
  behaviors: [storeBindingsBehavior],
  storeBindings: {
    store,
    fields: {
      activetabbarindex: "activetabbarindex",
      materialLibrary: "materialLibrary",
    },
    actions: {
      removeFromMaterialLibrary: "removeFromMaterialLibrary",
      addToMaterialLibrary: "addToMaterialLibrary",
      updataactivetabbaarindex: "updataactivetabbaarindex",
    }
  },

  data: {
    currentTab: 'materials' as 'materials' | 'tutorials',
    currentView: 'grid' as 'grid' | 'list',
    stats: {
      materials: 0,
      tutorials: 0,
      totalSize: '0MB'
    } as StatsData,

    Resources: [] as ResourceItem[],
    currentResources: [] as ResourceItem[],
    selectedResources: [] as number[],
    showActionSheet: false,
    actionItems: [] as any[],
    selectedResource: null as ResourceItem | null,
    searchValue: '',
    isDarkMode: false,

    // 从 store 获取的数据
    materialLibrary: [] as any[],
  },

  onLoad() {
    this.checkThemeMode();
    store.fetchMyMaterials().then(() => {
      this.loadResources();
    });
  },

  onShow() {
    store.fetchMyMaterials().then(() => {
      this.loadResources();
    });
    this.clearSelection();
  },

  checkThemeMode() {
    const systemInfo = wx.getSystemInfoSync();
    const isDarkMode = systemInfo.theme === 'dark';
    this.setData({ isDarkMode });
  },

  // 将 store 中的素材数据映射为页面需要的格式
  loadResources() {
    const materials: ResourceItem[] = store.materialLibrary.map((item: any) => ({
      id: item.id,
      title: item.title,
      author: '',
      type: item.type || '',
      resourceType: 'material' as const,
      imageUrl: item.fileUrl,
      description: item.description || '',
      tags: typeof item.tags === 'string'
        ? item.tags.split(',').filter(Boolean)
        : (Array.isArray(item.tags) ? item.tags : []),
      fileSize: item.fileSize ? `${item.fileSize}MB` : '未知',
      copyright: item.copyright || 'unknown',
      sourcePlatform: item.sourcePlatform || '',
      createTime: item.createTime,
      dimension: item.dimension || '',
      authorAvatar: '',
    }));
    this.setData({ Resources: materials }, () => {
      this.applyFilter();
    });
  },

  // 搜索输入
  onSearchInput(e: any) {
    this.setData({ searchValue: e.detail.value }, () => this.applyFilter());
  },

  // 统一过滤：分类 + 搜索
  applyFilter() {
    const { Resources, searchValue, currentTab } = this.data;
    let filtered = Resources;

    // 按素材/教程分类
    const resourceType = currentTab === 'materials' ? 'material' : 'tutorial';
    filtered = filtered.filter(r => r.resourceType === resourceType);

    // 按关键词搜索
    if (searchValue.trim()) {
      const kw = searchValue.trim().toLowerCase();
      filtered = filtered.filter(r =>
        r.title.toLowerCase().includes(kw) ||
        r.tags.some((t: string) => t.toLowerCase().includes(kw))
      );
    }

    this.setData({ currentResources: filtered }, () => this.calculateStats());
  },

  // 统计信息
  calculateStats() {
    const { Resources } = this.data;
    const materials = Resources.filter(r => r.resourceType === 'material').length;
    const tutorials = Resources.filter(r => r.resourceType === 'tutorial').length;
    const totalSizeMB = Resources.reduce((sum, r) => {
      const size = parseFloat(r.fileSize);
      return sum + (isNaN(size) ? 0 : size);
    }, 0);
    const totalSize = totalSizeMB >= 1000
      ? `${(totalSizeMB / 1000).toFixed(1)}GB`
      : `${totalSizeMB.toFixed(1)}MB`;

    this.setData({ stats: { materials, tutorials, totalSize } });
  },

  // 标签页切换
  onTabChange(e: any) {
    const tab = e.currentTarget.dataset.tab;
    this.setData({ currentTab: tab }, () => {
      this.applyFilter();
      this.clearSelection();
    });
  },

  // 视图切换
  onViewChange(e: any) {
    this.setData({ currentView: e.currentTarget.dataset.view });
  },

  // 返回上一页
  onBack() {
    wx.navigateBack();
  },

  // 搜索
  onSearch() {
    wx.navigateTo({ url: '/pages/search/search' });
  },

  // 资源点击
  onResourceTap(e: any) {
    const item = e.currentTarget.dataset.item as ResourceItem;
    if (this.data.selectedResources.length > 0) {
      this.toggleResourceSelection(item.id as number);
      return;
    }

    wx.navigateTo({
      url: `/pages/cDetail/cDetail?id=${item.id}&type=${item.resourceType === 'material' ? 1 : 2}`
    });
  },

  // 资源长按
  onResourceLongPress(e: any) {
    const item = e.currentTarget.dataset.item as ResourceItem;
    this.setData({
      showActionSheet: true,
      selectedResource: item,
      actionItems: this.getActionItems(item)
    });
  },

  getActionItems(item: ResourceItem): any[] {
    const baseActions = [
      { name: '使用', value: 'use' },
      { name: '下载', value: 'download' },
      { name: '分享', value: 'share' }
    ];
    if (item.resourceType === 'material') {
      baseActions.push({ name: '从素材库移除', value: 'delete', color: '#E64340' });
    } else {
      baseActions.push({ name: '取消收藏', value: 'delete', color: '#E64340' });
    }
    return baseActions;
  },

  onItemAction(e: any) {
    const item = e.currentTarget.dataset.item as ResourceItem;
    this.setData({
      showActionSheet: true,
      selectedResource: item,
      actionItems: this.getActionItems(item)
    });
    e.stopPropagation();
  },

  onQuickAction(e: any) {
    const action = e.currentTarget.dataset.action;
    const resourceId = e.currentTarget.dataset.id;
    if (action === 'use') this.useResource(resourceId);
    e.stopPropagation();
  },

  useResource(resourceId: number | string) {
    wx.showToast({ title: '已添加到使用队列', icon: 'success' });
  },

  onCloseActionSheet() {
    this.setData({
      showActionSheet: false,
      selectedResource: null,
      actionItems: []
    });
  },

  onActionSelect(e: any) {
    const { value } = e.detail;
    const { selectedResource } = this.data;
    if (!selectedResource) return;

    switch (value) {
      case 'use':
        this.useResource(selectedResource.id);
        break;
      case 'download':
        this.downloadResource(selectedResource);
        break;
      case 'share':
        this.shareResource(selectedResource);
        break;
      case 'delete':
        this.deleteResource(selectedResource);
        break;
    }
    this.onCloseActionSheet();
  },

  downloadResource(resource: ResourceItem) {
    wx.showLoading({ title: '下载中...' });
    setTimeout(() => {
      wx.hideLoading();
      wx.showToast({ title: '下载成功', icon: 'success' });
    }, 1000);
  },

  shareResource(resource: ResourceItem) {
    wx.showActionSheet({
      itemList: ['分享给好友', '复制链接'],
      success: (res) => {
        if (res.tapIndex === 0) {
          wx.showToast({ title: '已分享给好友', icon: 'success' });
        } else if (res.tapIndex === 1) {
          wx.setClipboardData({
            data: `https://example.com/resource/${resource.id}`,
            success: () => wx.showToast({ title: '链接已复制', icon: 'success' })
          });
        }
      }
    });
  },

  deleteResource(resource: ResourceItem) {
    wx.showModal({
      title: '确认删除',
      content: `确定要${resource.resourceType === 'material' ? '从素材库移除' : '取消收藏'}这个资源吗？`,
      confirmColor: '#E64340',
      success: (res) => {
        if (res.confirm) {
          // 确保 id 是数字
          const numericId = Number(resource.id);
          if (isNaN(numericId)) {
            wx.showToast({ title: '操作失败：无效ID', icon: 'none' });
            return;
          }
          store.removeFromMaterialLibrary(numericId);
          wx.showToast({
            title: resource.resourceType === 'material' ? '已从素材库移除' : '已取消收藏',
            icon: 'success'
          });
          setTimeout(() => {
            this.loadResources();
          }, 500);
        }
      }
    });
  },

  toggleResourceSelection(resourceId: number) {
    const { selectedResources } = this.data;
    const index = selectedResources.indexOf(resourceId);
    if (index > -1) {
      const newSelection = [...selectedResources];
      newSelection.splice(index, 1);
      this.setData({ selectedResources: newSelection });
    } else {
      this.setData({ selectedResources: [...selectedResources, resourceId] });
    }
  },

  clearSelection() {
    this.setData({ selectedResources: [] });
  },

  onBatchDelete() {
    const { selectedResources } = this.data;
    if (selectedResources.length === 0) {
      wx.showToast({ title: '请先选择要删除的资源', icon: 'none' });
      return;
    }
    wx.showModal({
      title: '确认删除',
      content: `确定要删除选中的 ${selectedResources.length} 个资源吗？此操作不可恢复。`,
      confirmColor: '#E64340',
      success: (res) => {
        if (res.confirm) this.batchConfirm();
      }
    });
  },

  onBatchDownload() {
    const { selectedResources } = this.data;
    if (selectedResources.length === 0) {
      wx.showToast({ title: '请先选择要下载的资源', icon: 'none' });
      return;
    }
    wx.showLoading({ title: '准备下载...' });
    setTimeout(() => {
      wx.hideLoading();
      wx.showToast({ title: `开始下载 ${selectedResources.length} 个文件`, icon: 'success' });
      this.clearSelection();
    }, 1000);
  },

  batchConfirm() {
    const { selectedResources } = this.data;
    // 批量删除：遍历调用 store 删除方法
    selectedResources.forEach(id => store.removeFromMaterialLibrary(id));
    wx.showToast({ title: '删除成功', icon: 'success' });
    setTimeout(() => {
      this.loadResources();
      this.clearSelection();
    }, 500);
  },

  goToDiscover() {
    store.updataactivetabbaarindex(1);
    wx.switchTab({ url: '/pages/studios/studios' });
  },

  onShareAppMessage() {
    return {
      title: '我的设计资源库',
      path: '/pages/slib/slib'
    };
  }
});