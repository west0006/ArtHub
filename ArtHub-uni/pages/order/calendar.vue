<template>
  <view class="page-container calendar-page">
    <view class="bottom-safe-area" style="height: 40rpx;"></view>
    <!-- 顶部状态信息 -->
    <view class="status-bar">
      <view class="status-item">
        <text class="status-label">当前状态：</text>
        <view class="status-value free-status" v-if="currentStatus === 'free'">空闲</view>
        <view class="status-value busy-status" v-else-if="currentStatus === 'dead'">超时</view>
        <view class="status-value busy-status" v-else>忙碌</view>
      </view>
      <view class="status-item">
        <text class="status-label">当前截稿日：</text>
        <view class="status-value deadline" v-if="deadlineDays && deadlineDays > 0">{{ deadlineDays }}天后</view>
        <view class="status-value deadline" v-else-if="!deadlineDays && deadToday">今天</view>
        <view class="status-value deadline" v-else-if="nearestOrder && deadlineDays && deadlineDays < 0">
          超时{{ -deadlineDays }}天</view>
        <view class="status-value next-order" v-else>无</view>
      </view>
      <view class="status-item">
        <text class="status-label">最近订单：</text>
        <view class="status-value next-order" v-if="nearestOrder !== null && nearestOrderStartDays > 0">
          {{ nearestOrderStartDays }}天后开始
        </view>
        <view class="status-value next-order" v-else-if="nearestOrder !== null && nearestOrderStartDays < 1">进行中</view>
        <view class="status-value next-order" v-else>无</view>
      </view>
      <view class="status-item">
        <text class="status-label">未完成稿件：</text>
        <view class="status-value order-name" v-if="orderCount > 0">{{ orderCount }}</view>
        <view class="status-value order-name" v-else>无</view>
      </view>
    </view>

    <!-- 月份容器 -->
    <scroll-view class="calendar-scroll" scroll-y>
      <view class="months-container">
        <view class="month-card" v-for="(item, index) in monthsData" :key="index">
          <!-- 月份标题 -->
          <view class="month-header">
            <text class="month-title">{{ item.year }}年{{ item.month }}月</text>
          </view>
          <!-- 星期标题 -->
          <view class="weekdays">
            <view class="weekday" v-for="day in weekDays" :key="day">
              <text class="weekday-text">{{ day }}</text>
            </view>
          </view>
          <!-- 日期网格 -->
          <view class="days-grid">
            <view class="day" :class="getDayClass(theDay)" v-for="(theDay, idx) in item.days" :key="idx" @tap="onDayTap"
              :data-time="theDay.date" :data-order-id="theDay.orderId">
              <text class="day-text" :class="{
                  'has-order-text': theDay.hasOrder,
                  'other-month': !theDay.isCurrentMonth,
                  'other-month-order': theDay.hasOrder && !theDay.isCurrentMonth
                }">{{ theDay.day }}</text>
              <view class="order-indicator" :class="{
                  'other-month': !theDay.isCurrentMonth,
                  'free': theDay.hasOrder && theDay.orderStatus
                }" v-if="theDay.hasOrder"></view>
            </view>
          </view>
        </view>
      </view>

      <CustomModal :show="showConfirmModal" :title="modalTitle" :cancelText="modalCancelText"
        :confirmText="modalConfirmText" @cancel="onConfirmModalCancel" @confirm="onConfirmModalConfirm"
        @close="onConfirmModalClose">
        <view style="color: var(--com-text);">{{ modalContent }}</view>
      </CustomModal>

      <ai-float />
      <view class="bottom-safe-area" style="height: 40rpx;"></view>
    </scroll-view>
  </view>
</template>

<script setup lang="ts">
  import { ref, reactive, } from 'vue';
  import { onShow, onLoad, onPullDownRefresh } from '@dcloudio/uni-app';
  import { useStore } from '@/store';
  import CustomModal from '@/components/custom-modal/index.vue';
  import AiFloat from '@/components/ai-float/index.vue';

  const store = useStore();

  // 类型定义
  interface CalendarDay {
    day : number;
    isCurrentMonth : boolean;
    isPrevMonth : boolean;
    isNextMonth : boolean;
    date : string;
    hasOrder : boolean;
    orderStatus : boolean | null;
    orderCount : number;
    orderId : number | null;
  }

  interface MonthData {
    year : number;
    month : number;
    monthName : string;
    days : CalendarDay[];
  }

  const weekDays = ['日', '一', '二', '三', '四', '五', '六'];

  const currentDate = ref(new Date());
  const monthsData = ref<MonthData[]>([]);
  const selectedDate = ref<Date | null>(null);
  const today = ref(new Date());
  const currentStatus = ref('');
  const deadlineDays = ref(0);
  const deadToday = ref(false);
  const dead = ref(false);
  const nearestOrder = ref<any>(null);
  const nearestOrderStartDays = ref(0);
  const orderCount = ref(0);

  // 弹窗
  const showConfirmModal = ref(false);
  const modalTitle = ref('');
  const modalContent = ref('');
  const modalConfirmText = ref('确定');
  const modalCancelText = ref('取消');
  const pendingOrderId = ref<number | null>(null);
  const pendingDate = ref('');

  const formatDate = (date : Date) : string => {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // 生成单个月份数据
  const generateMonthData = (date : Date) : MonthData => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const firstDayOfWeek = firstDay.getDay();
    const prevMonthDays = firstDayOfWeek;
    const nextMonthDays = 42 - daysInMonth - prevMonthDays;
    const days : CalendarDay[] = [];

    // 上个月
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = prevMonthLastDay - prevMonthDays + 1; i <= prevMonthLastDay; i++) {
      const dateObj = new Date(year, month - 1, i);
      const time = formatDate(dateObj);
      const orderInfo = store.getOrderInfoByDate(time);
      days.push({
        day: i,
        isCurrentMonth: false,
        isPrevMonth: true,
        isNextMonth: false,
        date: time,
        hasOrder: orderInfo.hasOrder,
        orderCount: orderInfo.hasOrder ? 1 : 0,
        orderId: orderInfo.orderId,
        orderStatus: orderInfo.hasOrder ? store.getOrderStatus(time) : null,
      });
    }

    // 当月
    for (let i = 1; i <= daysInMonth; i++) {
      const dateObj = new Date(year, month, i);
      const time = formatDate(dateObj);
      const orderInfo = store.getOrderInfoByDate(time);
      days.push({
        day: i,
        isCurrentMonth: true,
        isPrevMonth: false,
        isNextMonth: false,
        date: time,
        hasOrder: orderInfo.hasOrder,
        orderCount: orderInfo.hasOrder ? 1 : 0,
        orderId: orderInfo.orderId,
        orderStatus: orderInfo.hasOrder ? store.getOrderStatus(time) : null,
      });
    }

    // 下个月
    for (let i = 1; i <= nextMonthDays; i++) {
      const dateObj = new Date(year, month + 1, i);
      const time = formatDate(dateObj);
      const orderInfo = store.getOrderInfoByDate(time);
      days.push({
        day: i,
        isCurrentMonth: false,
        isPrevMonth: false,
        isNextMonth: true,
        date: time,
        hasOrder: orderInfo.hasOrder,
        orderCount: orderInfo.hasOrder ? 1 : 0,
        orderId: orderInfo.orderId,
        orderStatus: orderInfo.hasOrder ? store.getOrderStatus(time) : null,
      });
    }

    return {
      year,
      month: month + 1,
      monthName: getMonthName(month),
      days,
    };
  };

  const getMonthName = (month : number) : string => {
    const monthNames = [
      '一月', '二月', '三月', '四月', '五月', '六月',
      '七月', '八月', '九月', '十月', '十一月', '十二月'
    ];
    return monthNames[month];
  };

  // 生成三个月数据
  const generateMonthsData = () => {
    const arr : MonthData[] = [];
    for (let i = 0; i <= 2; i++) {
      const monthDate = new Date(currentDate.value);
      monthDate.setMonth(monthDate.getMonth() + i);
      arr.push(generateMonthData(monthDate));
    }
    monthsData.value = arr;
  };

  // 日期类名计算
  const getDayClass = (dayItem : CalendarDay) : string => {
    let cls = 'day ';
    cls += dayItem.isCurrentMonth ? 'current-month ' : 'other-month ';
    cls += isToday(dayItem.date) ? 'today ' : '';
    cls += isSelected(dayItem.date) ? 'selected ' : '';
    return cls.trim();
  };

  const isToday = (time : string) : boolean => {
    const date = new Date(time);
    return date.toDateString() === today.value.toDateString();
  };

  const isSelected = (time : string) : boolean => {
    if (!selectedDate.value) return false;
    const date = new Date(time);
    return date.toDateString() === selectedDate.value.toDateString();
  };

  // 查找最近的订单
  const findNearestOrder = () => {
    const todayDate = new Date();
    let nearest : any = null;
    let minDays = Infinity;
    let count = 0;
    if (store.order && store.order.length > 0) {
      store.order.forEach((order : any) => {
        if (!order.startDate || !order.deadline) return;
        const deadline = new Date(order.deadline);
        if (order.status === 'completed') return;
        count++;
        const days = Math.ceil((deadline.getTime() - todayDate.getTime()) / (1000 * 3600 * 24));
        if (days < minDays) {
          minDays = days;
          nearest = order;
        }
      });
    }

    let startDays = Infinity;
    if (nearest) {
      const startDate = new Date(nearest.startDate);
      startDays = Math.ceil((startDate.getTime() - todayDate.getTime()) / (1000 * 3600 * 24));
    }

    deadToday.value = minDays === 0;
    dead.value = nearest && minDays < 0;
    nearestOrder.value = nearest;
    nearestOrderStartDays.value = startDays === Infinity ? 0 : startDays;
    deadlineDays.value = minDays === Infinity ? 0 : minDays;
    orderCount.value = count;
  };

  // 计算状态信息
  const calculateStatusInfo = () => {
    const todayStr = formatDate(new Date());
    const hasOrderToday = store.hasOrderOnDate(todayStr);
    const todayOrderStatus = store.getOrderStatus(todayStr);

    if (hasOrderToday && !todayOrderStatus) {
      currentStatus.value = 'busy';
    } else if (dead.value && nearestOrder.value) {
      currentStatus.value = 'dead';
    } else {
      currentStatus.value = 'free';
    }
  };

  const updateSnapshot = () => {
    store.updatePageSnapshot('pages/order/calendar', {
      currentStatus: currentStatus.value,
      deadlineDays: deadlineDays.value,
      dead: dead.value,
      deadToday: deadToday.value,
      nearestOrder: nearestOrder.value,
      nearestOrderStartDays: nearestOrderStartDays.value,
      orderCount: orderCount.value,
    });
  };

  // 日期点击
  const onDayTap = (e : any) => {
    const time = e.currentTarget.dataset.time;
    const orderId = e.currentTarget.dataset.orderId;
    const selected = new Date(time);
    selectedDate.value = selected;

    if (orderId) {
      pendingOrderId.value = orderId;
      modalTitle.value = '当日有单';
      modalContent.value = `查看或修改该日期的订单详情？`;
      modalConfirmText.value = '查看';
      modalCancelText.value = '修改';
      showConfirmModal.value = true;
    } else {
      const dateString = formatDate(selected);
      pendingDate.value = dateString;
      modalTitle.value = '当日空闲';
      modalContent.value = `是否在 ${dateString} 创建新排单？`;
      modalConfirmText.value = '创建';
      modalCancelText.value = '取消';
      showConfirmModal.value = true;
    }
  };

  const onConfirmModalConfirm = () => {
    if (pendingOrderId.value) {
      uni.navigateTo({ url: `/pages/order/detail?id=${pendingOrderId.value}` });
      pendingOrderId.value = null;
    } else if (pendingDate.value) {
      const encodedDate = encodeURIComponent(pendingDate.value);
      uni.navigateTo({ url: `/pages/order/add?selectedDate=${encodedDate}` });
      pendingDate.value = '';
    }
  };

  const onConfirmModalCancel = () => {
    if (pendingOrderId.value) {
      uni.navigateTo({ url: `/pages/order/edit?id=${pendingOrderId.value}` });
    }
    pendingOrderId.value = null;
    pendingDate.value = '';
  };

  const onConfirmModalClose = () => {
    showConfirmModal.value = false;
    pendingOrderId.value = null;
    pendingDate.value = '';
  };

  // 导航控制
  const onPrevYear = () => {
    const newDate = new Date(currentDate.value);
    newDate.setFullYear(newDate.getFullYear() - 1);
    currentDate.value = newDate;
    generateMonthsData();
  };

  const onPrevMonth = () => {
    const newDate = new Date(currentDate.value);
    newDate.setMonth(newDate.getMonth() - 1);
    currentDate.value = newDate;
    generateMonthsData();
  };

  const onNextMonth = () => {
    const newDate = new Date(currentDate.value);
    newDate.setMonth(newDate.getMonth() + 1);
    currentDate.value = newDate;
    generateMonthsData();
  };

  const onNextYear = () => {
    const newDate = new Date(currentDate.value);
    newDate.setFullYear(newDate.getFullYear() + 1);
    currentDate.value = newDate;
    generateMonthsData();
  };

  const onBackToToday = () => {
    const todayDate = new Date();
    currentDate.value = todayDate;
    selectedDate.value = todayDate;
    generateMonthsData();
    findNearestOrder();
  };

  onLoad(() => {
    calculateStatusInfo();
    onBackToToday();
    updateSnapshot();
  });

  onShow(() => {
    today.value = new Date();
    calculateStatusInfo();
    onBackToToday();
    updateSnapshot();
  });

  onPullDownRefresh(() => {
    calculateStatusInfo();
    findNearestOrder();
    updateSnapshot();
    uni.stopPullDownRefresh();
  });
</script>

<style scoped>
  page {
    --primary-black: #1a1a1a;
    --border-heavy: #1a1a1a;
    --bg-page: #ffffff;
    --bg-surface: #ffffff;
    --text-primary: #1a1a1a;
    --text-secondary: #5a5a5a;
    --text-tertiary: #8a8a8a;
    --accent-green: #2e7d32;

    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    background-color: var(--bg-page);
    color: var(--text-primary);
  }

  .calendar-container {
    background-color: var(--bg-page);
  }

  /* 状态栏 —— 仅改颜色/边框/圆角，尺寸不动 */
  .status-bar {
    background: var(--bg-surface);
    margin: 0 var(--large-plate) var(--large-module);
    /* 原尺寸保留 */
    padding: var(--title-content);
    /* 原尺寸保留 */
    border-top: var(--border-thin) solid var(--border-top-light);
    border-left: var(--border-thin) solid var(--border-top-light);
    border-right: var(--border-thick) solid var(--border-bottom-dark);
    border-bottom: var(--border-thick) solid var(--border-bottom-dark);
    border-radius: 8rpx;
    /* 圆角 */
    box-shadow: none;
    display: flex;
    justify-content: space-between;
  }

  .status-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    flex: 1;
  }

  .status-label {
    font-size: 24rpx;
    /* 原28rpx调小，仅字体 */
    font-weight: 500;
    color: var(--text-secondary);
    margin-bottom: 8rpx;
    /* 原尺寸保留 */
    text-transform: uppercase;
    letter-spacing: 0.3px;
  }

  .status-value {
    font-size: 30rpx;
    /* 原34rpx调小 */
    font-weight: 700;
    color: var(--text-primary);
  }

  .busy-status,
  .deadline {
    font-weight: 800;
    border-bottom: 4rpx solid var(--accent-green);
    padding-bottom: 2rpx;
  }

  .free-status,
  .next-order {
    font-weight: 500;
    color: var(--text-primary);
  }

  /* 月份容器 —— 仅改背景/边框/圆角/颜色，间距尺寸不动 */
  .months-container {
    display: flex;
    flex-direction: column;
    padding: 0 var(--large-plate);
    /* 原尺寸保留 */
    gap: var(--large-module);
    /* 原尺寸保留 */
  }

  .month-card {
    background: var(--bg-surface);
    border-top: var(--border-thin) solid var(--border-top-light);
    border-left: var(--border-thin) solid var(--border-top-light);
    border-right: var(--border-thick) solid var(--border-bottom-dark);
    border-bottom: var(--border-thick) solid var(--border-bottom-dark);
    border-radius: 8rpx;
    overflow: hidden;
    box-shadow: none;
  }

  /* 月份标题 */
  .month-header {
    background: var(--accent-green);
    /* 绿色背景 */
    padding: var(--title-content);
    /* 原尺寸保留 */
    text-align: center;
    /* 保留原居中 */
    border-bottom: 4rpx solid var(--border-heavy);
  }

  .month-title {
    font-size: 32rpx;
    /* 原尺寸保留 */
    font-weight: 700;
    color: #ffffff;
  }

  /* 星期标题 */
  .weekdays {
    display: flex;
    padding: 20rpx 0;
    /* 原尺寸保留 */
    border-bottom: 4rpx solid var(--border-heavy);
  }

  .weekday {
    flex: 1;
    text-align: center;
  }

  .weekday-text {
    font-size: 26rpx;
    /* 原尺寸保留 */
    font-weight: 700;
    color: var(--text-primary);
    text-transform: uppercase;
  }

  /* 日期网格 —— 布局尺寸完全保留 */
  .days-grid {
    display: flex;
    flex-wrap: wrap;
    padding: var(--card-meta);
    /* 原尺寸保留 */
  }

  .day {
    width: calc(100% / 7);
    height: 80rpx;
    box-sizing: border-box;
    /* 保证边框不撑大宽度 */
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    border: 2rpx solid transparent;
    border-radius: 6rpx;
    transition: none;
    margin-bottom: 10rpx;
    position: relative;
    background-color: transparent;
  }

  .day:active {
    background-color: var(--primary-black);
  }

  .day:active .day-text {
    color: #ffffff;
  }

  .day.current-month {
    color: var(--text-primary);
  }

  .day.other-month {
    color: var(--text-tertiary);
  }

  /* 今日 —— 仅颜色/边框，尺寸不动 */
  .day.today {
    background: transparent !important;
    border: 4rpx solid var(--accent-green) !important;
  }

  .day.today .day-text {
    color: var(--accent-green) !important;
    font-weight: 800;
  }

  /* 选中日期 —— 仅颜色/边框，尺寸不动 */
  .day.selected {
    background: var(--accent-green) !important;
    border: 4rpx solid var(--accent-green) !important;
  }

  .day.selected .day-text {
    color: #ffffff !important;
    font-weight: 700;
  }

  .day-text {
    font-size: 26rpx;
    /* 原尺寸保留 */
    font-weight: 500;
    line-height: 1;
    /* 改善对齐，不改变盒模型 */
    color: inherit;
    z-index: 2;
  }

  .day-text.other-month {
    color: var(--text-tertiary);
  }

  /* 订单指示器 —— 仅颜色，尺寸/定位不变 */
  .order-indicator {
    position: absolute;
    bottom: 8rpx;
    width: 30rpx;
    height: 8rpx;
    background: var(--accent-green);
    border-radius: 8rpx;
    z-index: 1;
  }

  .order-indicator.free {
    background: var(--accent-green);
    opacity: 1;
  }

  .order-indicator.other-month {
    opacity: 0.2;
  }

  /* 图例 —— 仅颜色/边框/圆角，尺寸保留 */
  .legend {
    display: flex;
    justify-content: center;
    flex-wrap: wrap;
    gap: 32rpx;
    /* 原尺寸保留 */
    padding: var(--title-content);
    /* 原尺寸保留 */
    background: var(--bg-surface);
    margin: var(--large-module) var(--large-plate) 0;
    /* 原尺寸保留 */
    border: 6rpx solid var(--border-heavy);
    border-radius: 8rpx;
    box-shadow: none;
  }

  .legend-item {
    display: flex;
    align-items: center;
    gap: 12rpx;
    /* 原尺寸保留 */
    font-size: 24rpx;
    /* 调小字体，不影响布局 */
    color: var(--text-primary);
    font-weight: 500;
  }

  .legend-color {
    width: 24rpx;
    /* 原尺寸保留 */
    height: 24rpx;
    border: 3rpx solid var(--border-heavy);
    background: transparent;
    box-sizing: border-box;
  }

  .today-color {
    background: transparent;
    border: 3rpx solid var(--accent-green);
  }

  .selected-color {
    background: var(--accent-green);
    border: 3rpx solid var(--accent-green);
  }

  .order-color {
    background: var(--accent-green);
    border: none;
    width: 24rpx;
    height: 4rpx;
  }

  .current-color {
    background: var(--primary-black);
    border: none;
  }

  .legend-text {
    color: var(--text-primary);
    font-size: 24rpx;
    font-weight: 500;
  }

  .bottom-safe-area {
    height: 40rpx;
    /* 原尺寸保留 */
    background: transparent;
  }
</style>