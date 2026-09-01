// custom-tab-bar/index.ts
import { storeBindingsBehavior } from 'mobx-miniprogram-bindings'
import { store } from "../store/store";
Component({
  behaviors: [storeBindingsBehavior],
  storeBindings: {
    store,
    fields: {
      active: 'activetabbarindex'
    },
    actions: {
      updataactive: 'updataactivetabbaarindex'
    }
  },
  options: {
    styleIsolation: 'shared'
  },
  /**
   * 组件的属性列表
   */
  properties: {

  },

  /**
   * 组件的初始数据
   */
  data: {
    "list": [
      {
        "pagePath": "/pages/studios/studios",
        "text": "首页",
        'icon': 'home-o',
        'size': '22px'
      },
      {
        "pagePath": "/pages/home/home",
        "text": "排期",
        'icon': 'apps-o',
        'size': '22px'
      },
      // {
      //   "pagePath": "/pages/add/add",
      //   "text": "新建",
      //   "icon": "add-o",
      //   "size": "40px"
      // },
      // {
      //   "pagePath": "/pages/AiTool/AiTool",
      //   "text": "AI",
      //   'icon': 'chat-o',
      //   'size': '22px'
      // },
      {
        "pagePath": "/pages/contact/contact",
        "text": "我的",
        'icon': 'contact',
        'size': '22px'
      },
    ]
  },

  /**
   * 组件的方法列表
   */
  methods: {
    onChange(event) {
      // event.detail 的值为当前选中项的索引
      this.updataactive(event.detail);
      wx.switchTab({
        url: this.data.list[event.detail].pagePath,
      })
    },
  },
  observers: {

  },
  lifetimes: {

  },
  pageLifetimes: {

  }
})