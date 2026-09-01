// pages/calendar/index.ts
import { storeBindingsBehavior } from 'mobx-miniprogram-bindings'
import { store } from "../../store/store";

// 定义类型
interface CalendarDay {
  day: number;
  isCurrentMonth: boolean;
  isPrevMonth: boolean;
  isNextMonth: boolean;
  date: string;
  hasOrder: boolean;//当日有无订单
  orderStatus: boolean | null;//有单日完成状态
  orderCount: number;
  orderId: number | null;
}

interface MonthData {
  year: number;
  month: number;
  monthName: string;
  days: CalendarDay[];
}

Page({
  behaviors: [storeBindingsBehavior],
  storeBindings: {
    store,
    fields: {
      orderList: "order",
      orderCount: "ordercount",
      orderPeriods: "orderPeriods" // 绑定计算属性
    },
    actions: {
      // 可以根据需要添加 actions
      getOrderInfoByDate: "getOrderInfoByDate",
      getOrderStatus: "getOrderStatus"
    }
  },
  data: {
    // 当前显示的基准日期
    currentDate: new Date(),
    // 三个月的日历数据
    monthsData: [] as MonthData[],
    // 选中的日期
    selectedDate: null as Date | null,
    // 今天日期
    today: new Date(),
    // 当前状态
    currentStatus: '',
    // 距离截稿日天数
    deadlineDays: 0,
    //如果今天截稿
    deadToday: false,
    //是否超时
    dead: false,
    // 距离下一单开稿天数
    nextOrderDays: 0,
    // 从 store 获取的数据
    orderList: [] as any[],
    orderCount: 0,
    orderPeriods: [] as any[],
    // 最近订单信息
    nearestOrder: null as any,
    //最近订单开稿日
    nearestOrderStartDays: 0,

    showConfirmModal: false,
    modalTitle: '',
    modalContent: '',
    modalConfirmText: '确定',
    modalCancelText: '取消',
    pendingOrderId: null as number | null,  // 用于 busy 状态暂存订单ID
    pendingDate: '',                         // 用于 free 状态暂存日期
  },

  onLoad() {
    this.calculateStatusInfo();
    this.onBackToToday();
  },

  onShow() {
    // console.log("1")
    this.setData({
      today: new Date()
    });
    this.calculateStatusInfo();
    this.onBackToToday();//调用findnearestorder
  },
  onPullDownRefresh() {
    this.calculateStatusInfo();
    this.findNearestOrder()
    wx.stopPullDownRefresh()
  },

  // 查找最近的订单
  findNearestOrder() {
    const today = new Date();
    // const time = this.formatDate(today)
    let nearest: any = null;
    let minDays = Infinity;
    let count=0;
    if (store.order && store.order.length > 0) {
      store.order.forEach((order: any) => {
        if (!order.startDate || !order.deadline) return;

        // const startDate = new Date(order.startDate);
        const deadline = new Date(order.deadline);

        if (order.status === "completed") return;
        count=count+1
        const days = Math.ceil((deadline.getTime() - today.getTime()) / (1000 * 3600 * 24));

        if (days < minDays) {
          minDays = days;
          nearest = order;
        }

      });
    }
    let startDays = Infinity;
    if (nearest) {
      const startDate = new Date(nearest.startDate);
      startDays = Math.ceil((startDate.getTime() - today.getTime()) / (1000 * 3600 * 24));
    }
    // console.log(minDays)
    if (minDays == -0) {
      this.setData({ deadToday: true })
    } else {
      this.setData({ deadToday: false })
    }
    if (nearest && minDays < 0) {
      this.setData({ dead: true })
    } else {
      this.setData({ dead: false })
    }
    this.setData({
      nearestOrder: nearest,
      nearestOrderStartDays: startDays === Infinity ? 0 : startDays,
      deadlineDays: minDays === Infinity ? 0 : minDays,
      orderCount:count
    });
    // console.log(this.data.nearestOrderStartDays, this.data.deadlineDays)
    // console.log(this.data.nearestOrder)
  },

  // 计算当前状态信息
  calculateStatusInfo() {
    const today = this.formatDate(new Date());

    // 使用 store 中的方法检查今天是否有订单
    const hasOrderToday = store.hasOrderOnDate(today);
    //订单日状态，未完成则false
    const todayOrderStatus = store.getOrderStatus(today);

    // console.log(!todayOrderStatus && hasOrderToday)
    if (hasOrderToday && !todayOrderStatus) {
      this.setData({ currentStatus: 'busy' });
    } else if (this.data.dead && this.data.nearestOrder) {
      this.setData({ currentStatus: 'dead' })
    } else {
      this.setData({ currentStatus: 'free' });
    }
  },

  // 生成三个月的数据
  generateMonthsData() {
    const { currentDate } = this.data;
    const monthsData: MonthData[] = [];

    for (let i = 0; i <= 2; i++) {
      const monthDate = new Date(currentDate);
      monthDate.setMonth(monthDate.getMonth() + i);

      const monthData = this.generateMonthData(monthDate);
      monthsData.push(monthData);
    }

    this.setData({ monthsData });
  },

  // 生成单个月份的数据
  generateMonthData(date: Date): MonthData {
    const year = date.getFullYear();
    const month = date.getMonth();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const firstDayOfWeek = firstDay.getDay();

    const prevMonthDays = firstDayOfWeek;
    const nextMonthDays = 42 - daysInMonth - prevMonthDays;

    const days: CalendarDay[] = [];

    // 添加上个月的日期
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = prevMonthLastDay - prevMonthDays + 1; i <= prevMonthLastDay; i++) {
      const dateObj = new Date(year, month - 1, i);
      const time = this.formatDate(dateObj)
      const orderInfo = this.getOrderInfoByDate(time);
      days.push({
        day: i,
        isCurrentMonth: false,
        isPrevMonth: true,
        isNextMonth: false,
        date: time,
        hasOrder: orderInfo.hasOrder,
        orderCount: orderInfo.orderCount,
        orderId: orderInfo.orderId,
        orderStatus: orderInfo.hasOrder ? store.getOrderStatus(time) : null
      });
    }

    // 添加当月的日期
    for (let i = 1; i <= daysInMonth; i++) {
      const dateObj = new Date(year, month, i);
      const time = this.formatDate(dateObj)
      const orderInfo = this.getOrderInfoByDate(time);
      // console.log(orderInfo)
      days.push({
        day: i,
        isCurrentMonth: true,
        isPrevMonth: false,
        isNextMonth: false,
        date: time,
        hasOrder: orderInfo.hasOrder,
        orderCount: orderInfo.orderCount,
        orderId: orderInfo.orderId,
        orderStatus: orderInfo.hasOrder ? store.getOrderStatus(time) : null
      });
    }

    // 添加下个月的日期
    for (let i = 1; i <= nextMonthDays; i++) {
      const dateObj = new Date(year, month + 1, i);
      const time = this.formatDate(dateObj)
      const orderInfo = this.getOrderInfoByDate(time);
      days.push({
        day: i,
        isCurrentMonth: false,
        isPrevMonth: false,
        isNextMonth: true,
        date: time,
        hasOrder: orderInfo.hasOrder,
        orderCount: orderInfo.orderCount,
        orderId: orderInfo.orderId,
        orderStatus: orderInfo.hasOrder ? store.getOrderStatus(time) : null
      });
    }

    return {
      year,
      month: month + 1,
      monthName: this.getMonthName(month),
      days
    };
  },


  // 格式化日期为 YYYY-MM-DD
  formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  },

  // 获取日期类名
  getDayClass(dayItem: CalendarDay): string {
    let classStr = 'day ';
    classStr += dayItem.isCurrentMonth ? 'current-month ' : 'other-month ';
    classStr += this.isToday(dayItem.date) ? 'today ' : '';
    classStr += this.isSelected(dayItem.date) ? 'selected ' : '';
    return classStr.trim();
  },

  // 获取月份名称
  getMonthName(month: number): string {
    const monthNames = [
      '一月', '二月', '三月', '四月', '五月', '六月',
      '七月', '八月', '九月', '十月', '十一月', '十二月'
    ];
    return monthNames[month];
  },

  // 判断是否为今天
  isToday(time: string): boolean {
    const date = new Date(time)
    const today = this.data.today;
    return date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear();
  },

  // 判断是否为选中日期
  isSelected(time: string): boolean {
    const date = new Date(time)
    const selectedDate = this.data.selectedDate;
    if (!selectedDate) return false;

    return date.getDate() === selectedDate.getDate() &&
      date.getMonth() === selectedDate.getMonth() &&
      date.getFullYear() === selectedDate.getFullYear();
  },

  // 日期点击事件
  onDayTap(e: any) {
    const { time, orderId } = e.currentTarget.dataset;
    const selectedDate = new Date(time);
    this.setData({ selectedDate });

    if (orderId) {
      // busy 状态：弹出查看详情确认框
      this.setData({
        modalTitle: '当日有单',
        modalContent: `查看或修改该日期的订单详情？`,
        modalConfirmText: '查看',
        modalCancelText: '修改',
        pendingOrderId: orderId,
        showConfirmModal: true
      });
    } else {
      // free 状态：弹出创建订单确认框
      const dateString = this.formatDate(selectedDate);
      this.setData({
        modalTitle: '当日空闲',
        modalContent: `是否在 ${dateString} 创建新排单？`,
        modalConfirmText: '创建',
        modalCancelText: '取消',
        pendingDate: dateString,
        showConfirmModal: true
      });
    }
  },
  onConfirmModalConfirm() {
    if (this.data.pendingOrderId) {
      // busy 确认：跳转详情页
      wx.navigateTo({
        url: `/pages/detail/detail?id=${this.data.pendingOrderId}`
      });
      // 清除暂存
      this.setData({ pendingOrderId: null });
    } else if (this.data.pendingDate) {
      // free 确认：跳转添加页
      const encodedDate = encodeURIComponent(this.data.pendingDate);
      wx.navigateTo({
        url: `/pages/add/add?selectedDate=${encodedDate}`
      });
      this.setData({ pendingDate: '' });
    }
  },
  onConfirmModalCancel() {
    if (this.data.pendingOrderId) {
      wx.navigateTo({
        url: `/pages/edit/edit?id=${this.data.pendingOrderId}`
      });
    }
    // 清除暂存数据
    this.setData({
      pendingOrderId: null,
      pendingDate: ''
    });
  },
  // 遮罩点击关闭
  onConfirmModalClose() {
    this.setData({
      showConfirmModal: false,
      pendingOrderId: null,
      pendingDate: ''
    });
  },

  // 导航控制方法
  onPrevYear() {
    const { currentDate } = this.data;
    const newDate = new Date(currentDate);
    newDate.setFullYear(newDate.getFullYear() - 1);
    this.setData({ currentDate: newDate });
    this.generateMonthsData();
  },

  onPrevMonth() {
    const { currentDate } = this.data;
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() - 1);
    this.setData({ currentDate: newDate });
    this.generateMonthsData();
  },

  onNextMonth() {
    const { currentDate } = this.data;
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + 1);
    this.setData({ currentDate: newDate });
    this.generateMonthsData();
  },

  onNextYear() {
    const { currentDate } = this.data;
    const newDate = new Date(currentDate);
    newDate.setFullYear(newDate.getFullYear() + 1);
    this.setData({ currentDate: newDate });
    this.generateMonthsData();
  },

  onBackToToday() {
    const today = new Date();
    this.setData({
      currentDate: today,
      selectedDate: today
    });
    this.generateMonthsData();
    this.findNearestOrder();
  },

});