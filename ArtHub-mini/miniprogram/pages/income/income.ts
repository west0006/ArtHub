// pages/income/income.ts
import { store } from "../../store/store";

interface IncomeItem {
  id: string;
  orderId: number;
  title: string;
  client: string;
  amount: number;
  date: string;
  status: 'completed' | 'progress';
}

interface ChartData {
  month: string;
  amount: number;
}

Page({
  data: {
    // 总收入统计
    totalIncome: 0,
    monthIncome: 0,
    incomeTrend: 0,
    
    // 筛选条件
    activeFilter: 'all',
    selectedDate: '',
    
    // 图表数据
    chartData: [] as ChartData[],
    maxChartValue: 0,
    
    // 收入明细
    incomeList: [] as IncomeItem[],
    
    // 统计摘要
    completedOrders: 0,
    averageIncome: 0,
    totalOrders: 0,
    monthlyOrders: 0
  },

  onLoad() {
    this.initData();
    this.calculateIncomeStats();
    this.generateChartData();
    this.loadIncomeList();
  },

  onShow() {
    // 页面显示时刷新数据
    this.calculateIncomeStats();
    this.loadIncomeList();
  },

  // 初始化数据
  initData() {
    const now = new Date();
    const year = now.getFullYear();
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    this.setData({
      selectedDate: `${year}-${month}`
    });
  },

  // 计算收入统计
  calculateIncomeStats() {
    const orders = store.order;
    const completedOrders = orders.filter(order => order.status === 'completed');
    
    // 计算总收入
    const totalIncome = completedOrders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
    
    // 计算本月收入
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    const monthOrders = completedOrders.filter(order => {
      const orderDate = new Date(order.createTime);
      return orderDate.getMonth() === currentMonth && orderDate.getFullYear() === currentYear;
    });
    
    const monthIncome = monthOrders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
    
    // 计算上月收入（用于趋势计算）
    const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;
    
    const lastMonthOrders = completedOrders.filter(order => {
      const orderDate = new Date(order.createTime);
      return orderDate.getMonth() === lastMonth && orderDate.getFullYear() === lastMonthYear;
    });
    
    const lastMonthIncome = lastMonthOrders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
    
    // 计算趋势
    let incomeTrend = 0;
    if (lastMonthIncome > 0) {
      incomeTrend = Math.round(((monthIncome - lastMonthIncome) / lastMonthIncome) * 100);
    }
    
    // 计算平均单价
    const averageIncome = completedOrders.length > 0 ? Math.round(totalIncome / completedOrders.length) : 0;
    
    this.setData({
      totalIncome,
      monthIncome,
      incomeTrend,
      completedOrders: completedOrders.length,
      averageIncome,
      totalOrders: orders.length,
      monthlyOrders: monthOrders.length
    });
  },

  // 生成图表数据
  generateChartData() {
    const orders = store.order;
    const completedOrders = orders.filter(order => order.status === 'completed');
    
    // 生成最近6个月的数据
    const months: ChartData[] = [];
    const now = new Date();
    
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
      const monthName = `${date.getMonth() + 1}月`;
      
      const monthOrders = completedOrders.filter(order => {
        const orderDate = new Date(order.createTime);
        return orderDate.getFullYear() === date.getFullYear() && 
               orderDate.getMonth() === date.getMonth();
      });
      
      const monthIncome = monthOrders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
      
      months.push({
        month: monthName,
        amount: monthIncome
      });
    }
    
    // 计算最大值用于图表高度
    const maxAmount = Math.max(...months.map(item => item.amount), 1000); // 最小1000保证图表有高度
    
    this.setData({
      chartData: months,
      maxChartValue: maxAmount
    });
  },

  // 加载收入列表
  loadIncomeList() {
    const orders = store.order;
    const incomeList: IncomeItem[] = orders
      .filter(order => order.status === 'completed' || order.status === 'progress')
      .map(order => ({
        id: order.id.toString(),
        orderId: order.id,
        title: order.windowName || '未命名订单',
        client: order.clientName || '未知客户',
        amount: order.totalAmount || 0,
        date: this.formatDate(order.createTime),
        status: order.status === 'completed' ? 'completed' : 'progress'
      }))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    this.setData({ incomeList });
  },

  // 格式化日期
  formatDate(dateString: string): string {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  },

  // 切换筛选条件
  switchFilter(e: any) {
    const filter = e.currentTarget.dataset.filter;
    this.setData({ activeFilter: filter });
    
    // 根据筛选条件重新加载数据
    this.loadFilteredIncomeList(filter);
  },

  // 加载筛选后的收入列表
  loadFilteredIncomeList(filter: string) {
    const orders = store.order;
    const now = new Date();
    let filteredOrders = orders;
    
    if (filter === 'month') {
      filteredOrders = orders.filter(order => {
        const orderDate = new Date(order.createTime);
        return orderDate.getMonth() === now.getMonth() && 
               orderDate.getFullYear() === now.getFullYear();
      });
    } else if (filter === 'quarter') {
      const currentQuarter = Math.floor(now.getMonth() / 3);
      filteredOrders = orders.filter(order => {
        const orderDate = new Date(order.createTime);
        const orderQuarter = Math.floor(orderDate.getMonth() / 3);
        return orderQuarter === currentQuarter && 
               orderDate.getFullYear() === now.getFullYear();
      });
    }
    
    const incomeList: IncomeItem[] = filteredOrders
      .filter(order => order.status === 'completed' || order.status === 'progress')
      .map(order => ({
        id: order.id.toString(),
        orderId: order.id,
        title: order.windowName || '未命名订单',
        client: order.clientName || '未知客户',
        amount: order.totalAmount || 0,
        date: this.formatDate(order.createTime),
        status: order.status === 'completed' ? 'completed' : 'progress'
      }))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    this.setData({ incomeList });
  },

  // 日期选择变化
  onDateChange(e: any) {
    const selectedDate = e.detail.value;
    this.setData({ selectedDate });
    
    // 根据选择的日期重新加载数据
    this.loadIncomeByDate(selectedDate);
  },

  // 根据日期加载收入数据
  loadIncomeByDate(dateString: string) {
    const [year, month] = dateString.split('-');
    const orders = store.order;
    
    const filteredOrders = orders.filter(order => {
      const orderDate = new Date(order.createTime);
      return orderDate.getFullYear() === parseInt(year) && 
             orderDate.getMonth() === parseInt(month) - 1;
    });
    
    const incomeList: IncomeItem[] = filteredOrders
      .filter(order => order.status === 'completed' || order.status === 'progress')
      .map(order => ({
        id: order.id.toString(),
        orderId: order.id,
        title: order.windowName || '未命名订单',
        client: order.clientName || '未知客户',
        amount: order.totalAmount || 0,
        date: this.formatDate(order.createTime),
        status: order.status === 'completed' ? 'completed' : 'progress'
      }))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    this.setData({ incomeList });
  },

  // 查看订单详情
  viewOrderDetail(e: any) {
    const orderId = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/detail/detail?id=${orderId}`
    });
  }
});