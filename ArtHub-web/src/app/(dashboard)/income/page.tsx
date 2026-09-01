'use client';

import { useEffect, useState, useMemo } from 'react';
import { getOrders } from '@/lib/api/orders';
import ReactEChartsCore from 'echarts-for-react/lib/core';
import * as echarts from 'echarts/core';
import { BarChart, PieChart } from 'echarts/charts';
import { GridComponent, TooltipComponent, TitleComponent, LegendComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import { saveAs } from 'file-saver';
import * as ExcelJS from 'exceljs';

echarts.use([BarChart, PieChart, GridComponent, TooltipComponent, TitleComponent, LegendComponent, CanvasRenderer]);

export default function IncomePage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await getOrders();
        setOrders(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const stats = useMemo(() => {
    const completed = orders.filter((o) => o.status === 'completed');
    const totalIncome = completed.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
    const monthly: Record<string, number> = {};
    completed.forEach((o) => {
      if (o.createTime) {
        const key = new Date(o.createTime).toISOString().substring(0, 7);
        monthly[key] = (monthly[key] || 0) + (o.totalAmount || 0);
      }
    });
    const sortedMonthly = Object.entries(monthly).sort(([a], [b]) => a.localeCompare(b)).map(([month, amount]) => ({ month, amount }));
    const platformIncome: Record<string, number> = {};
    completed.forEach((o) => {
      const p = o.platform || '未知';
      platformIncome[p] = (platformIncome[p] || 0) + (o.totalAmount || 0);
    });
    const statusCount = {
      pending: orders.filter((o) => o.status === 'pending').length,
      progress: orders.filter((o) => o.status === 'progress').length,
      completed: completed.length,
    };
    return { totalIncome, completedCount: completed.length, avgPrice: completed.length ? (totalIncome / completed.length).toFixed(2) : '0', monthly: sortedMonthly, pieData: Object.entries(platformIncome).map(([name, value]) => ({ name, value })), statusCount };
  }, [orders]);

  const exportExcel = async () => {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('收入明细');
    sheet.columns = [
      { header: 'ID', key: 'id' }, { header: '标题', key: 'title' }, { header: '金额', key: 'amount' },
      { header: '状态', key: 'status' }, { header: '日期', key: 'date' },
    ];
    orders.forEach((order) => {
      sheet.addRow({
        id: order.id, title: order.title || order.windowName, amount: order.totalAmount,
        status: order.status === 'completed' ? '已完成' : order.status === 'progress' ? '进行中' : '待开始',
        date: order.createTime ? new Date(order.createTime).toLocaleDateString() : '',
      });
    });
    const buf = await workbook.xlsx.writeBuffer();
    saveAs(new Blob([buf]), '收入明细.xlsx');
  };

  if (loading) return <div className="flex justify-center items-center h-64"><p className="text-[var(--com-text)]">加载中...</p></div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-[var(--main-text)]">收入统计</h1>

      <div className="grid grid-cols-3 gap-4">
        <div className="card-quark text-center">
          <p className="text-sm text-[var(--com-text)]">总收入</p>
          <p className="text-2xl font-bold text-[var(--main-color)] mt-1">¥{stats.totalIncome.toLocaleString()}</p>
        </div>
        <div className="card-quark text-center">
          <p className="text-sm text-[var(--com-text)]">已完成订单</p>
          <p className="text-2xl font-bold mt-1">{stats.completedCount}</p>
        </div>
        <div className="card-quark text-center">
          <p className="text-sm text-[var(--com-text)]">平均单价</p>
          <p className="text-2xl font-bold mt-1">¥{stats.avgPrice}</p>
        </div>
      </div>

      <div className="card-quark">
        <h2 className="text-lg font-semibold mb-4 text-[var(--main-text)]">月度收入趋势</h2>
        {stats.monthly.length > 0 ? (
          <ReactEChartsCore echarts={echarts} option={{
            xAxis: { data: stats.monthly.map((m) => m.month), type: 'category' },
            yAxis: { type: 'value' },
            series: [{ data: stats.monthly.map((m) => m.amount), type: 'bar', color: 'var(--main-color)' }],
            tooltip: { trigger: 'axis' },
          }} style={{ height: 300 }} />
        ) : <p className="text-[var(--low-color)] text-center py-8">暂无数据</p>}
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="card-quark">
          <h2 className="text-lg font-semibold mb-4 text-[var(--main-text)]">订单状态分布</h2>
          <ReactEChartsCore echarts={echarts} option={{
            series: [{
              type: 'pie', radius: ['40%', '70%'],
              data: [
                { name: '待开始', value: stats.statusCount.pending, itemStyle: { color: 'var(--com-color-warm)' } },
                { name: '进行中', value: stats.statusCount.progress, itemStyle: { color: 'var(--com-color-cold)' } },
                { name: '已完成', value: stats.statusCount.completed, itemStyle: { color: 'var(--main-color)' } },
              ],
              label: { formatter: '{b}: {c}' }
            }],
            tooltip: { trigger: 'item' },
          }} style={{ height: 300 }} />
        </div>
        <div className="card-quark">
          <h2 className="text-lg font-semibold mb-4 text-[var(--main-text)]">平台收入占比</h2>
          {stats.pieData.length > 0 ? (
            <ReactEChartsCore echarts={echarts} option={{
              series: [{
                type: 'pie', radius: '70%',
                data: stats.pieData,
                label: { formatter: '{b}: ¥{c}' }
              }],
              tooltip: { trigger: 'item' },
            }} style={{ height: 300 }} />
          ) : <p className="text-[var(--low-color)] text-center py-8">暂无数据</p>}
        </div>
      </div>

      <div className="text-right">
        <button onClick={exportExcel} className="btn-quark btn-quark-primary">导出 Excel</button>
      </div>
    </div>
  );
}