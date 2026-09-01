// pages/studios/studios.ts
import { storeBindingsBehavior } from 'mobx-miniprogram-bindings'
import { store } from "../../store/store";
import { searchStock, StockImage } from '../../api/stock';

interface ResourceItem {
  id: string;
  title: string;
  author: string;
  type: string;
  resourceType: 'material' | 'tutorial';
  imageUrl: string;
  previewUrl?: string;
  fullUrl?: string;
  description?: string;
  tags?: string[];
  isInLibrary?: boolean;
  source?: string;
  sourceUrl?: string;
}

Page({
  behaviors: [storeBindingsBehavior],
  storeBindings: {
    store,
    fields: {
      materialLibrary: "materialLibrary",
    },
    actions: {
      importExternalMaterial: "importExternalMaterial",
      removeFromMaterialLibrary: "removeFromMaterialLibrary",
    }
  },

  data: {
    active: 0,
    currentTag: 1,
    type: [] as any[],
    type1: [
      { name: "推荐" }, { name: "UI/UX" }, { name: "平面" },
      { name: "插画" }, { name: "游戏" }, { name: "动漫" },
      { name: "建筑" }, { name: "服装" }, { name: "汽车" },
      { name: "动物" },
    ],
    type2: [
      { name: "速写" }, { name: "人体" }, { name: "动态" },
      { name: "色彩" }, { name: "设计" }, { name: "氛围感" },
      { name: "大场景" },
    ],
    resourceList: [] as ResourceItem[],
    stockPage: 1,
    showActionSheet: false,
    actions: [] as any[],
    selectedResource: null as ResourceItem | null,
    materialLibrary: [] as any[],
  },

  onLoad() {
    this.setData({ type: this.data.type1, currentTag: 1 });
    this.loadResources();
  },

  onShow() {
    this.loadResources();
  },

  onChange(e: any) {
    this.setData({ active: e.detail.index });
    this.loadResources();
  },

  tolearn1() {
    this.setData({ type: this.data.type1, currentTag: 1 });
    this.loadResources();
  },

  tolearn2() {
    this.setData({ type: this.data.type2, currentTag: 2 });
    this.loadResources();
  },

  loadResources() {
    if (this.data.currentTag === 1) {
      const category = this.data.type[this.data.active]?.name;
      const query = category === '推荐' ? 'art design' : category;
      this.fetchStockImages(query);
    } else {
      // 教程暂无数据，显示占位
      this.setData({ resourceList: [] });
    }
  },

  async fetchStockImages(query: string) {
    wx.showLoading({ title: '加载中...' });
    try {
      const [unsplashRes, pexelsRes] = await Promise.all([
        searchStock('unsplash', query, this.data.stockPage, 10).catch(() => ({ results: [] })),
        searchStock('pexels', query, this.data.stockPage, 10).catch(() => ({ results: [] })),
      ]);

      const combined: StockImage[] = [...(unsplashRes?.results || []), ...(pexelsRes?.results || [])];
      const markedResources: ResourceItem[] = combined.map((img) => ({
        id: img.id,
        title: img.title,
        author: img.author,
        type: img.source || '图库',
        resourceType: 'material' as const,
        imageUrl: img.previewUrl,
        previewUrl: img.previewUrl,
        fullUrl: img.fullUrl,
        description: `来源: ${img.source} · 作者: ${img.author}`,
        tags: [img.source],
        source: img.source,
        sourceUrl: img.sourceUrl,
        isInLibrary: this.checkIfInLibrary(img.id),
      }));

      this.setData({ resourceList: markedResources });
    } catch (err) {
      console.error('加载图库失败', err);
      this.setData({ resourceList: [] });
    } finally {
      wx.hideLoading();
    }
  },

  checkIfInLibrary(resourceId: string): boolean {
    // 通过 sourceUrl 判断是否已入库，因为导入后会存储 sourceUrl
    return store.materialLibrary.some(
      (item: any) => item.sourceUrl?.includes(resourceId)
    );
  },

  gotoSearch() {
    wx.navigateTo({ url: '/pages/search/search' });
  },

  onResourceTap(e: any) {
    const item = e.currentTarget.dataset.item;
    wx.navigateTo({
      url: `/pages/cDetail/cDetail?id=${item.id}&type=3&source=${item.source}&url=${encodeURIComponent(item.previewUrl)}`
    });
  },

  onResourceLongPress(e: any) {
    const item = e.currentTarget.dataset.item;
    const actions = [];

    if (item.resourceType === 'material') {
      if (item.isInLibrary) {
        actions.push(
          { name: '从素材库移除', value: 'removeFromLibrary' },
          { name: '添加到订单素材', value: 'addToOrder' }
        );
      } else {
        actions.push(
          { name: '导入到素材库', value: 'addToLibrary' },
          { name: '添加到订单素材', value: 'addToOrder' }
        );
      }
    } else {
      actions.push({ name: '查看教程详情', value: 'viewTutorial' });
    }

    this.setData({
      showActionSheet: true,
      selectedResource: item,
      actions,
    });
  },

  onCloseActionSheet() {
    this.setData({
      showActionSheet: false,
      selectedResource: null,
      actions: [],
    });
  },

  onSelectAction(e: any) {
    const { value } = e.detail;
    const { selectedResource } = this.data;
    if (!selectedResource) return;

    switch (value) {
      case 'addToLibrary':
        this.importToLibrary(selectedResource);
        break;
      case 'removeFromLibrary':
        this.removeFromLibrary(selectedResource);
        break;
      case 'addToOrder':
        this.addToOrderMaterial(selectedResource);
        break;
      case 'viewTutorial':
        this.viewTutorial(selectedResource);
        break;
    }

    this.onCloseActionSheet();
  },

  // 导入外部资源到素材库
  importToLibrary(resource: ResourceItem) {
    if (resource.resourceType !== 'material') {
      wx.showToast({ title: '只有素材可以导入', icon: 'none' });
      return;
    }

    wx.showLoading({ title: '导入中...' });
    // 调用 store 中的 importExternalMaterial，它会调用后端创建素材
    this.importExternalMaterial(resource)
      .then(() => {
        wx.hideLoading();
        wx.showToast({ title: '导入成功', icon: 'success' });
        // 刷新列表状态
        this.updateResourceInLibraryStatus(resource.id, true);
      })
      .catch(() => {
        wx.hideLoading();
        wx.showToast({ title: '导入失败', icon: 'none' });
      });
  },

  // 从素材库移除（需要找到数据库记录 ID）
  removeFromLibrary(resource: ResourceItem) {
    // 在 materialLibrary 中查找对应的素材（根据 sourceUrl）
    const material = store.materialLibrary.find(
      (item: any) => item.sourceUrl?.includes(resource.id)
    );
    if (!material) {
      wx.showToast({ title: '未找到对应素材', icon: 'none' });
      return;
    }

    wx.showLoading({ title: '移除中...' });
    this.removeFromMaterialLibrary(material.id)
      .then(() => {
        wx.hideLoading();
        wx.showToast({ title: '已移除', icon: 'success' });
        this.updateResourceInLibraryStatus(resource.id, false);
      })
      .catch(() => {
        wx.hideLoading();
        wx.showToast({ title: '操作失败', icon: 'none' });
      });
  },

  updateResourceInLibraryStatus(resourceId: string, isInLibrary: boolean) {
    const updatedList = this.data.resourceList.map(item =>
      item.id === resourceId ? { ...item, isInLibrary } : item
    );
    this.setData({ resourceList: updatedList });
  },

  addToOrderMaterial(resource: ResourceItem) {
    wx.showToast({ title: '功能开发中', icon: 'none' });
  },

  viewTutorial(resource: ResourceItem) {
    wx.navigateTo({
      url: `/pages/cDetail/cDetail?id=${resource.id}&type=2`
    });
  },

  onHide() {
    this.setData({ showActionSheet: false });
  },

  onShareAppMessage() {
    return {
      title: '发现优质设计素材和教程',
      path: '/pages/studios/studios'
    };
  }
});