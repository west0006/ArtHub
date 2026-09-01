// components/modal.ts
Component({

  /**
   * 组件的属性列表
   */
    properties: {
      show: { // 控制弹窗显示隐藏
        type: Boolean,
        value: false
      },
      title: {
        type: String,
        value: '提示'
      },
      cancelText: {
        type: String,
        value: '取消'
      },
      confirmText: {
        type: String,
        value: '确定'
      },
      maskBehavior: {
        type: String,
        value: 'close' 
      }
    },
    methods: {
      // 阻止遮罩层后面的页面滚动
      preventTouchMove() {},
      // 点击遮罩层，可选择关闭弹窗
      onMaskTap() {
        if (this.data.maskBehavior === 'close') {
          this.setData({ show: false });
          this.triggerEvent('close'); 
        }
      },
      onCancel() {
        this.setData({ show: false });
        this.triggerEvent('cancel');
      },
      onConfirm() {
        this.setData({ show: false });
        this.triggerEvent('confirm'); // 触发外部 confirm 事件
      }
    },

  /**
   * 组件的初始数据
   */
  data: {

  },

  /**
   * 组件的方法列表
   */

})