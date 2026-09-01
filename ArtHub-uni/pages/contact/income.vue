<template>
  <view class="page-container">
    <!-- 顶部统计卡片 -->
    <view class="income-header">
      <view class="total-income-card">
        <view class="total-amount">
          <text class="amount">¥{{ totalIncome }}</text>
          <text class="label">累计收入</text>
        </view>
        <view class="income-trend">
          <text class="trend-text">本月收入: ¥{{ monthIncome }}</text>
          <text class="trend-percent" :class="incomeTrend >= 0 ? 'up' : 'down'">
            <van-icon :name="incomeTrend >= 0 ? 'arrow-up' : 'arrow-down'" />
            {{ Math.abs(incomeTrend) }}%
          </text>
        </view>
      </view>
    </view>

    <!-- 筛选 -->
    <view class="filter-section">
      <view class="filter-tabs">
        <view class="filter-tab" :class="{ active: activeFilter === 'all' }" @tap="switchFilter" data-filter="all">全部
        </view>
        <view class="filter-tab" :class="{ active: activeFilter === 'month' }" @tap="switchFilter" data-filter="month">
          本月</view>
        <view class="filter-tab" :class="{ active: activeFilter === 'quarter' }" @tap="switchFilter"
          data-filter="quarter">本季度</view>
      </view>
      <view class="date-picker">
        <picker mode="date" fields="month" :value="selectedDate" @change="onDateChange">
          <view class="date-display">
            <van-icon name="calendar-o" size="32rpx" />
            <text>{{ selectedDate }} ›</text>
          </view>
        </picker>
      </view>
    </view>

    <!-- 收入图表 -->
    <view class="chart-section">
      <view class="section-header">
        <text class="section-title">收入趋势</text>
      </view>
      <view class="chart-container">
        <view class="mock-chart">
          <view class="chart-bars">
            <view class="chart-bar" v-for="item in chartData" :key="item.month"
              :style="{ height: (item.amount / maxChartValue * 200) + 'rpx' }">
              <text class="bar-amount">¥{{ item.amount }}</text>
              <text class="bar-label">{{ item.month }}</text>
            </view>
          </view>
        </view>
      </view>
    </view>

    <!-- 收入明细 -->
    <view class="income-details">
      <view class="section-header">
        <text class="section-title">收入明细</text>
        <text class="section-count">共{{ incomeList.length }}笔</text>
      </view>
      <view class="income-list">
        <view class="income-item" v-for="item in incomeList" :key="item.id" @tap="viewOrderDetail"
          :data-id="item.orderId">
          <view class="income-info">
            <view class="order-title">{{ item.title }}</view>
            <view class="order-meta">
              <text class="client">{{ item.client }}</text>
              <text class="date">{{ item.date }}</text>
            </view>
          </view>
          <view class="income-amount">
            <text class="amount">+¥{{ item.amount }}</text>
            <view class="status" :class="item.status">
              {{ item.status === 'completed' ? '已完成' : '进行中' }}
            </view>
          </view>
        </view>
        <view class="empty-state" v-if="incomeList.length === 0">
          <van-icon name="balance-list-o" size="120rpx" color="#cccccc" />
          <text class="empty-text">暂无收入记录</text>
          <text class="empty-subtext">完成订单后收入将显示在这里</text>
        </view>
      </view>
    </view>

    <!-- 统计摘要 -->
    <view class="summary-section">
      <view class="summary-cards">
        <view class="summary-card">
          <view class="summary-value">{{ completedOrders }}</view>
          <view class="summary-label">已完成订单</view>
        </view>
        <view class="summary-card">
          <view class="summary-value">{{ averageIncome }}</view>
          <view class="summary-label">平均单价</view>
        </view>
        <view class="summary-card">
          <view class="summary-value">{{ activeFilter === 'month' ? monthlyOrders : totalOrders }}</view>
          <view class="summary-label">{{ activeFilter === 'month' ? '本月订单' : '总订单数' }}</view>
        </view>
      </view>
    </view>

    <ai-float />
    <view class="bottom-safe-area"></view>
  </view>
</template>

<script setup lang="ts">
  import { ref, } from 'vue';
  import { onShow } from '@dcloudio/uni-app';
  import { useStore } from '@/store';
  import AiFloat from '@/components/ai-float/index.vue';

  const store = useStore();

  const totalIncome = ref(0);
  const monthIncome = ref(0);
  const incomeTrend = ref(0);
  const activeFilter = ref('all');
  const selectedDate = ref('');
  const chartData = ref<{ month : string; amount : number }[]>([]);
  const maxChartValue = ref(1000);
  const incomeList = ref<any[]>([]);
  const completedOrders = ref(0);
  const averageIncome = ref(0);
  const totalOrders = ref(0);
  const monthlyOrders = ref(0);

  const initData = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    selectedDate.value = `${year}-${month}`;
  };

  const formatDate = (dateString : string) : string => {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const calculateIncomeStats = () => {
    const orders = store.order;
    const completed = orders.filter(o => o.status === 'completed');
    totalIncome.value = completed.reduce((sum, o) => sum + (o.totalAmount || 0), 0);

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const monthOrders = completed.filter(o => {
      const d = new Date(o.createTime);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });
    monthIncome.value = monthOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);

    const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;
    const lastMonthIncome = completed
      .filter(o => {
        const d = new Date(o.createTime);
        return d.getMonth() === lastMonth && d.getFullYear() === lastMonthYear;
      })
      .reduce((sum, o) => sum + (o.totalAmount || 0), 0);
    incomeTrend.value = lastMonthIncome > 0 ? Math.round(((monthIncome.value - lastMonthIncome) / lastMonthIncome) * 100) : 0;

    completedOrders.value = completed.length;
    totalOrders.value = orders.length;
    monthlyOrders.value = monthOrders.length;
    averageIncome.value = completed.length > 0 ? Math.round(totalIncome.value / completed.length) : 0;
  };

  const generateChartData = () => {
    const completed = store.order.filter(o => o.status === 'completed');
    const now = new Date();
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthName = `${date.getMonth() + 1}月`;
      const monthIncome = completed
        .filter(o => {
          const d = new Date(o.createTime);
          return d.getFullYear() === date.getFullYear() && d.getMonth() === date.getMonth();
        })
        .reduce((sum, o) => sum + (o.totalAmount || 0), 0);
      months.push({ month: monthName, amount: monthIncome });
    }
    chartData.value = months;
    maxChartValue.value = Math.max(...months.map(m => m.amount), 1000);
  };

  const loadIncomeList = (filter ?: string) => {
    let orders = store.order.filter(o => o.status === 'completed' || o.status === 'progress');
    const now = new Date();
    if (filter === 'month') {
      orders = orders.filter(o => new Date(o.createTime).getMonth() === now.getMonth() && new Date(o.createTime).getFullYear() === now.getFullYear());
    } else if (filter === 'quarter') {
      const currentQuarter = Math.floor(now.getMonth() / 3);
      orders = orders.filter(o => Math.floor(new Date(o.createTime).getMonth() / 3) === currentQuarter && new Date(o.createTime).getFullYear() === now.getFullYear());
    }
    incomeList.value = orders
      .map(o => ({
        id: o.id.toString(),
        orderId: o.id,
        title: o.windowName || '未命名订单',
        client: o.clientName || '未知客户',
        amount: o.totalAmount || 0,
        date: formatDate(o.createTime),
        status: o.status === 'completed' ? 'completed' : 'progress',
      }))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  };

  const switchFilter = (e : any) => {
    activeFilter.value = e.currentTarget.dataset.filter;
    loadIncomeList(activeFilter.value === 'all' ? undefined : activeFilter.value);
  };

  const onDateChange = (e : any) => {
    selectedDate.value = e.detail.value;
    const [year, month] = selectedDate.value.split('-');
    const filtered = store.order.filter(o => {
      const d = new Date(o.createTime);
      return d.getFullYear() === parseInt(year) && d.getMonth() === parseInt(month) - 1;
    });
    incomeList.value = filtered
      .map(o => ({
        id: o.id.toString(),
        orderId: o.id,
        title: o.windowName || '未命名订单',
        client: o.clientName || '未知客户',
        amount: o.totalAmount || 0,
        date: formatDate(o.createTime),
        status: o.status === 'completed' ? 'completed' : 'progress',
      }))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  };

  const viewOrderDetail = (e : any) => {
    const id = e.currentTarget.dataset.id;
    uni.navigateTo({ url: `/pages/order/detail?id=${id}` });
  };

  const updateSnapshot = () => {
    store.updatePageSnapshot('pages/contact/income', {
      monthIncome: monthIncome.value,
      totalIncome: totalIncome.value,
      incomeTrend: incomeTrend.value,
      incomeList: incomeList.value,          // 原始数组（可序列化即可）
      averageIncome: averageIncome.value,
      completedOrders: completedOrders.value,
    });
  };

  onShow(() => {
    calculateIncomeStats();
    generateChartData();
    loadIncomeList(activeFilter.value === 'all' ? undefined : activeFilter.value);
    updateSnapshot();
  });
  initData();
</script>

<style>
  .income-header {
    padding: var(--large-plate);
    background: #2e7d32;
    /* 纯绿背景替代渐变 */
    border-bottom: 6rpx solid #1a1a1a;
    /* 粗黑下边框 */
  }

  .total-income-card {
    background: #ffffff;
    border-radius: 8rpx;
    padding: var(--large-plate);
    box-shadow: none;
    box-sizing: border-box;
    /* 立体粗边框 */
    border-top: 2rpx solid #cccccc;
    border-left: 2rpx solid #cccccc;
    border-right: 6rpx solid #1a1a1a;
    border-bottom: 6rpx solid #1a1a1a;
  }

  .total-amount {
    text-align: center;
    margin-bottom: var(--large-module);
  }

  .amount {
    display: block;
    font-size: 64rpx;
    font-weight: 700;
    color: #2e7d32;
    /* 绿色金额 */
    line-height: 1.2;
  }

  .label {
    font-size: 28rpx;
    color: #5a5a5a;
    font-weight: 500;
  }

  .income-trend {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-top: var(--title-content);
    border-top: 3rpx solid #1a1a1a;
    /* 粗分割线 */
  }

  .trend-text {
    font-size: 28rpx;
    color: #1a1a1a;
    font-weight: 500;
  }

  .trend-percent {
    display: flex;
    align-items: center;
    font-size: 24rpx;
    font-weight: 700;
  }

  .trend-percent.up {
    color: #2e7d32;
    /* 涨幅用绿色替代红色 */
  }

  .trend-percent.down {
    color: #1a1a1a;
    /* 跌幅用黑色 */
  }

  /* 筛选区域 */
  .filter-section {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: var(--large-module) var(--large-plate);
    background: #ffffff;
    border-bottom: 4rpx solid #1a1a1a;
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
    padding: 12rpx 24rpx;
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

  .date-picker .date-display {
    display: flex;
    align-items: center;
    padding: 12rpx 20rpx;
    background: #ffffff;
    border: 4rpx solid #1a1a1a;
    border-radius: 6rpx;
    font-size: 26rpx;
    color: #1a1a1a;
    font-weight: 500;
    box-sizing: border-box;
  }

  /* 图表区域 */
  .chart-section {
    padding: var(--large-plate);
    background: #ffffff;
    margin-top: var(--large-module);
    border: 6rpx solid #1a1a1a;
    border-radius: 8rpx;
    margin: var(--large-module) var(--large-plate);
    box-sizing: border-box;
    /* 立体边框强化 */
    border-top-width: 2rpx;
    border-top-color: #cccccc;
    border-left-width: 2rpx;
    border-left-color: #cccccc;
    border-right-width: 6rpx;
    border-bottom-width: 6rpx;
  }

  .chart-container {
    margin-top: var(--title-content);
  }

  .mock-chart {
    height: 300rpx;
    background: #f5f5f5;
    border: 3rpx solid #1a1a1a;
    border-radius: 6rpx;
    padding: var(--large-module);
    box-sizing: border-box;
  }

  .chart-bars {
    display: flex;
    align-items: flex-end;
    justify-content: space-around;
    height: 200rpx;
    margin-bottom: 40rpx;
  }

  .chart-bar {
    background: #2e7d32;
    border: 3rpx solid #1a1a1a;
    border-radius: 4rpx 4rpx 0 0;
    width: 40rpx;
    position: relative;
    transition: none;
    box-sizing: border-box;
  }

  .bar-amount {
    position: absolute;
    top: -50rpx;
    left: 50%;
    transform: translateX(-50%);
    font-size: 20rpx;
    color: #1a1a1a;
    white-space: nowrap;
    font-weight: 700;
  }

  .bar-label {
    position: absolute;
    bottom: -40rpx;
    left: 50%;
    transform: translateX(-50%);
    font-size: 22rpx;
    color: #5a5a5a;
    font-weight: 500;
  }

  /* 收入明细 */
  .income-details {
    padding: var(--large-plate);
    background: #ffffff;
    margin-top: var(--large-module);
    border: 6rpx solid #1a1a1a;
    border-radius: 8rpx;
    margin: var(--large-module) var(--large-plate);
    box-sizing: border-box;
    border-top-width: 2rpx;
    border-top-color: #cccccc;
    border-left-width: 2rpx;
    border-left-color: #cccccc;
    border-right-width: 6rpx;
    border-bottom-width: 6rpx;
  }

  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: var(--title-content);
  }

  .section-title {
    font-size: 32rpx;
    font-weight: 700;
    color: #1a1a1a;
    border-left: 8rpx solid #2e7d32;
    padding-left: 16rpx;
  }

  .section-count {
    font-size: 26rpx;
    color: #5a5a5a;
    font-weight: 500;
  }

  .income-list {
    background: #ffffff;
  }

  .income-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: var(--large-module) 0;
    border-bottom: 3rpx solid #1a1a1a;
  }

  .income-item:last-child {
    border-bottom: none;
  }

  .income-info {
    flex: 1;
  }

  .order-title {
    font-size: 30rpx;
    font-weight: 700;
    color: #1a1a1a;
    margin-bottom: var(--card-meta);
  }

  .order-meta {
    display: flex;
    gap: var(--large-module);
  }

  .client,
  .date {
    font-size: 24rpx;
    color: #5a5a5a;
    font-weight: 500;
  }

  .income-amount {
    text-align: right;
  }

  .income-amount .amount {
    display: block;
    font-size: 32rpx;
    font-weight: 700;
    color: #2e7d32;
    margin-bottom: var(--card-meta);
  }

  .status {
    font-size: 22rpx;
    padding: 4rpx 12rpx;
    border-radius: 4rpx;
    background: #ffffff;
    border: 2rpx solid #1a1a1a;
    color: #1a1a1a;
    font-weight: 700;
  }

  .status.completed {
    background: #2e7d32;
    color: #ffffff;
    border-color: #1a1a1a;
  }

  /* 空状态 */
  .empty-state {
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

  /* 统计摘要 */
  .summary-section {
    padding: var(--large-plate);
    background: #ffffff;
    margin-top: var(--large-module);
    border: 6rpx solid #1a1a1a;
    border-radius: 8rpx;
    margin: var(--large-module) var(--large-plate);
    box-sizing: border-box;
    border-top-width: 2rpx;
    border-top-color: #cccccc;
    border-left-width: 2rpx;
    border-left-color: #cccccc;
    border-right-width: 6rpx;
    border-bottom-width: 6rpx;
  }

  .summary-cards {
    display: flex;
    justify-content: space-between;
    gap: var(--large-module);
  }

  .summary-card {
    flex: 1;
    background: #ffffff;
    border: 4rpx solid #1a1a1a;
    border-radius: 6rpx;
    padding: var(--large-module);
    text-align: center;
    box-sizing: border-box;
    /* 立体微调 */
    border-top-width: 2rpx;
    border-top-color: #cccccc;
    border-left-width: 2rpx;
    border-left-color: #cccccc;
    border-right-width: 4rpx;
    border-bottom-width: 4rpx;
  }

  .summary-value {
    font-size: 32rpx;
    font-weight: 700;
    color: #2e7d32;
    margin-bottom: var(--card-meta);
  }

  .summary-label {
    font-size: 24rpx;
    color: #5a5a5a;
    font-weight: 500;
  }

  .bottom-safe-area {
    height: 40rpx;
    background: transparent;
  }
</style>