// pages/cDetail/cDetail.ts
import { storeBindingsBehavior } from 'mobx-miniprogram-bindings'
import { store } from "../../store/store";
import { getMaterialById } from '../../api/material'; // 新增导入

interface ResourceItem {
  id: string | number;       // 素材 id（数据库为数字，图库为字符串）
  title: string;
  author: string;
  type: string;              // 分类标签
  resourceType: 'material' | 'tutorial';
  imageUrl: string;
  description: string;
  tags: string[];
  fileSize: string;
  authorAvatar: string;
  dimension?: string;
  isFollowing?: boolean;
  isCollected: boolean;
  source?: string;           // 外部图库来源 'unsplash' / 'pexels'
  sourceUrl?: string;        // 原始链接
}

Page({
  behaviors: [storeBindingsBehavior],
  storeBindings: {
    store,
    fields: {
      materialLibrary: "materialLibrary",
    },
    actions: {
      addToMaterialLibrary: "addToMaterialLibrary",
      removeFromMaterialLibrary: "removeFromMaterialLibrary",
      importExternalMaterial: "importExternalMaterial",
    }
  },

  data: {
    resourceId: '' as string | number,
    resourceType: 1 as number,          // 1=个人素材, 2=教程, 3=外部图库
    source: '',                          // 图库来源（仅 resourceType=3 时有效）
    url: '',                             // 图片原始URL（仅 resourceType=3 时）
    materialData: null as ResourceItem | null,
    isDarkMode: false,
    relatedMaterials: [] as ResourceItem[],
    materialLibrary: [] as any[],
  },

  onLoad(options: any) {
    const { id, type, source, url } = options;
    this.setData({
      resourceId: id || '',
      resourceType: parseInt(type) || 1,
      source: source || '',
      url: decodeURIComponent(url || ''),
    }, () => {
      this.checkThemeMode();
      this.loadResourceDetail();
    });
  },

  onShow() {
    // 每次显示页面刷新详情状态（如收藏状态可能在其他页面变更）
    if (this.data.resourceId) {
      this.loadResourceDetail();
    }
  },

  checkThemeMode() {
    const systemInfo = wx.getSystemInfoSync();
    const isDarkMode = systemInfo.theme === 'dark';
    this.setData({ isDarkMode });
  },

  // 判断资源是否在个人素材库中
  checkIfInLibrary(resourceId: string | number): boolean {
    const lib = store.materialLibrary;
    if (this.data.resourceType === 3) {
      // 外部图库资源：通过 sourceUrl 中的原 ID 判断
      return lib.some((item: any) => item.sourceUrl?.includes(resourceId as string));
    }
    // 个人素材：通过 id 直接判断
    return lib.some((item: any) => item.id === Number(resourceId));
  },

  // 加载资源详情（处理三种类型）
  loadResourceDetail() {
    const { resourceId, resourceType, source, url } = this.data;

    if (resourceType === 3) {
      // 外部图库资源（Unsplash/Pexels）
      const idStr = resourceId as string;
      const fileName = url ? url.split('/').pop()?.split('?')[0] || '未命名' : '未命名';
      this.setData({
        materialData: {
          id: idStr,
          title: fileName,
          author: '',
          type: source || '图库',
          resourceType: 'material',
          imageUrl: url || '',
          description: `来源: ${source} · 作者未知`,
          tags: [source || '图库'],
          fileSize: '未知',
          authorAvatar: '',
          dimension: '',
          isCollected: this.checkIfInLibrary(idStr),
          source: source || '',
          sourceUrl: url,
        }
      }, () => {
        this.loadRelatedResources();
      });
      return;
    }

    if (resourceType === 1) {
      // 个人素材：从后端获取详情
      const numericId = Number(resourceId);
      if (isNaN(numericId)) {
        wx.showToast({ title: '素材ID无效', icon: 'none' });
        return;
      }
      getMaterialById(numericId).then((res: any) => {
        const material = res;
        this.setData({
          materialData: {
            id: material.id,
            title: material.title || '未命名素材',
            author: '',
            type: material.tags ? material.tags.split(',')[0] : '素材',
            resourceType: 'material',
            imageUrl: material.fileUrl || '',
            description: material.description || '',
            tags: typeof material.tags === 'string' ? material.tags.split(',').filter(Boolean) : (material.tags || []),
            fileSize: material.fileSize ? `${material.fileSize}MB` : '未知',
            authorAvatar: '',
            dimension: material.dimension || '',
            isCollected: true, // 已经在个人库中
            source: material.sourcePlatform || '',
            sourceUrl: material.sourceUrl || '',
          }
        }, () => {
          this.loadRelatedResources();
        });
      }).catch((err) => {
        console.error('获取素材详情失败', err);
        wx.showToast({ title: '加载失败', icon: 'none' });
        setTimeout(() => wx.navigateBack(), 1500);
      });
      return;
    }

    if (resourceType === 2) {
      // 教程（暂用 mock 数据）
      const tutorials = store.mockTutorials || [];
      const tutorial = tutorials.find((item: any) => item.id === resourceId);
      if (tutorial) {
        this.setData({
          materialData: {
            id: tutorial.id,
            title: tutorial.title,
            author: tutorial.author,
            type: tutorial.type,
            resourceType: 'tutorial',
            imageUrl: tutorial.imageUrl,
            description: tutorial.description,
            tags: tutorial.tags || [],
            fileSize: tutorial.fileSize,
            authorAvatar: tutorial.authorAvatar,
            dimension: tutorial.dimension,
            isCollected: false,
          }
        }, () => {
          this.loadRelatedResources();
        });
      } else {
        wx.showToast({ title: '教程不存在', icon: 'none' });
        setTimeout(() => wx.navigateBack(), 1500);
      }
      return;
    }
  },

  // 加载相关推荐（仅素材类型有）
  loadRelatedResources() {
    const { materialData, resourceType } = this.data;
    if (!materialData) return;

    if (resourceType === 1 || resourceType === 3) {
      // 基于素材类型或标签推荐（从个人素材库中搜索相似标签）
      const currentTags = materialData.tags || [];
      const allMaterials = store.materialLibrary || [];
      const related = allMaterials
        .filter((item: any) => {
          if (item.id === materialData.id) return false;
          const itemTags = typeof item.tags === 'string' ? item.tags.split(',') : (item.tags || []);
          return currentTags.some((t: string) => itemTags.includes(t));
        })
        .slice(0, 4)
        .map((item: any) => ({
          id: item.id,
          title: item.title,
          author: '',
          type: item.tags?.split(',')[0] || '素材',
          resourceType: 'material' as const,
          imageUrl: item.fileUrl,
          description: item.description || '',
          tags: typeof item.tags === 'string' ? item.tags.split(',') : (item.tags || []),
          fileSize: item.fileSize ? `${item.fileSize}MB` : '未知',
          authorAvatar: '',
          isCollected: true,
        }));
      this.setData({ relatedMaterials: related });
    } else if (resourceType === 2) {
      // 教程相关推荐（基于 mock 数据）
      const tutorials = store.mockTutorials || [];
      const related = tutorials
        .filter((item: any) => item.id !== materialData.id && item.type === materialData.type)
        .slice(0, 4);
      this.setData({ relatedMaterials: related });
    }
  },

  onImageError() {
    this.setData({
      'materialData.imageUrl': '../../images/t1.png'
    });
  },

  onBack() {
    wx.navigateBack();
  },

  onFollow() {
    const { materialData } = this.data;
    if (!materialData) return;
    const newStatus = !materialData.isFollowing;
    this.setData({ 'materialData.isFollowing': newStatus });
    wx.showToast({ title: newStatus ? '已关注' : '已取消关注', icon: 'success' });
  },

  // 添加到素材库 / 从库中移除
  onAddToLibrary() {
    const { materialData, resourceType } = this.data;
    if (!materialData) return;

    if (resourceType === 3) {
      // 外部图库资源：导入到个人素材库
      if (materialData.isCollected) {
        wx.showToast({ title: '该素材已导入', icon: 'none' });
        return;
      }
      wx.showLoading({ title: '导入中...' });
      this.importExternalMaterial({
        id: materialData.id,
        title: materialData.title,
        author: materialData.author,
        previewUrl: materialData.imageUrl,
        fullUrl: materialData.imageUrl,
        source: materialData.source || 'unknown',
        sourceUrl: materialData.sourceUrl || '',
        license: '',
      }).then(() => {
        wx.hideLoading();
        wx.showToast({ title: '导入成功', icon: 'success' });
        this.setData({ 'materialData.isCollected': true });
        this.loadRelatedResources();
      }).catch(() => {
        wx.hideLoading();
        wx.showToast({ title: '导入失败', icon: 'none' });
      });
      return;
    }

    if (resourceType === 1) {
      // 个人素材：从库中移除
      const numericId = Number(materialData.id);
      if (isNaN(numericId)) {
        wx.showToast({ title: '操作失败', icon: 'none' });
        return;
      }
      wx.showLoading({ title: '移除中...' });
      store.removeFromMaterialLibrary(numericId)
        .then(() => {
          wx.hideLoading();
          wx.showToast({ title: '已移除', icon: 'success' });
          wx.navigateBack(); // 返回上一页
        })
        .catch(() => {
          wx.hideLoading();
          wx.showToast({ title: '操作失败', icon: 'none' });
        });
      return;
    }

    // 教程资源暂不支持添加
    wx.showToast({ title: '教程暂不支持此操作', icon: 'none' });
  },

  onDownload() {
    const { materialData } = this.data;
    if (!materialData) return;
    wx.showLoading({ title: '下载中...' });
    setTimeout(() => {
      wx.hideLoading();
      wx.showToast({ title: '下载成功', icon: 'success' });
    }, 1000);
  },

  onRelatedTap(e: any) {
    const id = e.currentTarget.dataset.id;
    const item = this.data.relatedMaterials.find(m => m.id == id);
    if (item) {
      wx.redirectTo({
        url: `/pages/cDetail/cDetail?id=${item.id}&type=${item.resourceType === 'material' ? 1 : 2}`
      });
    }
  },

  onShareAppMessage() {
    return {
      title: this.data.materialData?.title || '设计资源',
      path: `/pages/cDetail/cDetail?id=${this.data.resourceId}&type=${this.data.resourceType}&source=${this.data.source || ''}&url=${encodeURIComponent(this.data.url || '')}`
    };
  }
});