'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { getOrders, updateOrder } from '@/lib/api/orders';
import type { OrderData } from '@/types/api';
import dayjs from 'dayjs';
import minMax from 'dayjs/plugin/minMax';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import React, { useRef } from 'react';
import { useDraggable } from '@neodrag/react';

// ============ 加载 dayjs 插件 ============
dayjs.extend(minMax);
dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);

// ============================================================
// 独立拖拽条组件
// ============================================================
interface DragBarProps {
  order: OrderData;
  dayWidth: number;
  minDate: dayjs.Dayjs;
  onDragEnd: (orderId: number, deltaX: number) => void;
}

const DragBar: React.FC<DragBarProps> = React.memo(
  ({ order, dayWidth, minDate, onDragEnd }) => {
    const dragRef = useRef<HTMLDivElement>(null);
    const router = useRouter();

    const startDiff = dayjs(order.startDate).diff(minDate, 'day');
    const duration = dayjs(order.deadline).diff(dayjs(order.startDate), 'day') + 1;
    const barWidth = duration * dayWidth - 4;

    // 使用 useDraggable，第一个参数为 ref
    useDraggable(dragRef as React.RefObject<HTMLDivElement>, {
      axis: 'x',
      onDragEnd: ({ offsetX }) => {
        onDragEnd(order.id, offsetX);
      },
    });

    return (
      <div
        ref={dragRef}
        className="absolute top-1 rounded h-6 flex items-center px-2 text-xs text-white cursor-grab active:cursor-grabbing select-none"
        style={{
          left: startDiff * dayWidth,
          width: barWidth,
          background:
            order.status === 'completed'
              ? 'var(--main-color)'
              : order.status === 'progress'
                ? 'var(--com-color-cold)'
                : 'var(--com-color-warm)',
        }}
        title={`${order.clientName || ''} - 拖动可调整日期`}
        onClick={() => router.push(`/orders/${order.id}`)}
      >
        {order.clientName || ''}
      </div>
    );
  }
);
DragBar.displayName = 'DragBar';

// ============================================================
// 主页面组件
// ============================================================
export default function CalendarPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<OrderData[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'month' | 'gantt'>('gantt');
  const [currentDate, setCurrentDate] = useState(dayjs());

  const fetchOrders = useCallback(async () => {
    try {
      const res = await getOrders();
      setOrders(res.data as OrderData[]);
    } catch (err) {
      console.error('获取订单失败', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const validOrders = useMemo(
    () =>
      orders
        .filter((o) => o.startDate && o.deadline)
        .sort(
          (a, b) =>
            dayjs(a.startDate).valueOf() - dayjs(b.startDate).valueOf()
        ),
    [orders]
  );

  const ganttData = useMemo(() => {
    if (validOrders.length === 0)
      return {
        minDate: dayjs(),
        maxDate: dayjs(),
        totalDays: 30,
        orders: [] as OrderData[],
      };
    const min = dayjs.min(validOrders.map((o) => dayjs(o.startDate)))!;
    const max = dayjs.max(validOrders.map((o) => dayjs(o.deadline)))!;
    const totalDays = max.diff(min, 'day') + 1;
    return { minDate: min, maxDate: max, totalDays, orders: validOrders };
  }, [validOrders]);

  const handleDragEnd = useCallback(
    async (orderId: number, deltaX: number) => {
      const order = validOrders.find((o) => o.id === orderId);
      if (!order) return;
      const dayWidth = 50;
      const daysShift = Math.round(deltaX / dayWidth);
      if (daysShift === 0) return;
      const newStart = dayjs(order.startDate)
        .add(daysShift, 'day')
        .format('YYYY-MM-DD');
      const newDeadline = dayjs(order.deadline)
        .add(daysShift, 'day')
        .format('YYYY-MM-DD');
      try {
        await updateOrder(orderId, {
          startDate: newStart,
          deadline: newDeadline,
        });
        await fetchOrders();
      } catch (err) {
        alert('调整排期失败，请稍后重试');
        console.error('调整排期失败', err);
      }
    },
    [validOrders, fetchOrders]
  );

  const monthView = useMemo(() => {
    const year = currentDate.year();
    const month = currentDate.month();
    const daysInMonth = currentDate.daysInMonth();
    const firstDayOfWeek = currentDate.startOf('month').day();
    const dates: (number | null)[] = [];
    for (let i = 0; i < firstDayOfWeek; i++) dates.push(null);
    for (let d = 1; d <= daysInMonth; d++) dates.push(d);

    const getOrdersOnDay = (day: number) => {
      return orders.filter((order) => {
        if (!order.startDate || !order.deadline) return false;
        const start = dayjs(order.startDate);
        const end = dayjs(order.deadline);
        const target = dayjs(new Date(year, month, day));
        return (
          target.isSameOrAfter(start, 'day') &&
          target.isSameOrBefore(end, 'day')
        );
      });
    };

    return (
      <div>
        <div className="flex justify-between items-center mb-4">
          <button
            onClick={() => setCurrentDate(currentDate.subtract(1, 'month'))}
            className="btn-quark text-sm"
          >
            ‹ 上个月
          </button>
          <h2 className="text-xl font-semibold">
            {currentDate.format('YYYY 年 M 月')}
          </h2>
          <button
            onClick={() => setCurrentDate(currentDate.add(1, 'month'))}
            className="btn-quark text-sm"
          >
            下个月 ›
          </button>
        </div>
        <div className="card-quark p-2" style={{ padding: 0 }}>
          <div className="grid grid-cols-7 gap-0 text-center">
            {['日', '一', '二', '三', '四', '五', '六'].map((d) => (
              <div
                key={d}
                className="font-semibold py-2 border-b border-[var(--border-top-light)] text-[var(--com-text)]"
              >
                {d}
              </div>
            ))}
            {dates.map((day, index) => {
              const isToday =
                day === new Date().getDate() &&
                month === new Date().getMonth() &&
                year === new Date().getFullYear();
              return (
                <div
                  key={index}
                  className={`min-h-[80px] border-r border-b border-[var(--border-top-light)] p-1 ${day ? 'hover:bg-[var(--extra-light)]' : 'bg-[var(--extra-light)]'}`}
                >
                  {day && (
                    <>
                      <div
                        className={`text-sm font-medium w-6 h-6 flex items-center justify-center mx-auto rounded-full ${isToday ? 'bg-[var(--main-color)] text-white' : ''}`}
                      >
                        {day}
                      </div>
                      <div className="mt-1 space-y-1">
                        {getOrdersOnDay(day).map((order) => (
                          <div
                            key={order.id}
                            className="text-xs bg-[var(--main-color-light)] text-[var(--main-color)] rounded px-1 py-0.5 truncate"
                            title={order.title}
                          >
                            {order.title || order.windowName}
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }, [currentDate, orders]);

  const ganttView = useMemo(() => {
    if (ganttData.orders.length === 0)
      return (
        <p className="text-[var(--low-color)] text-center py-12">
          暂无有排期的订单
        </p>
      );
     
    const dayWidth = 50;
    const rowHeight = 44;
    const headerHeight = 40;
    const labelWidth = 180;

    return (
      <div className="card-quark overflow-auto" style={{ padding: 0 }}>
        <div
          className="flex"
          style={{
            height: headerHeight,
            background: 'var(--main-color-light)',
            borderBottom: '1px solid var(--border-top-light)',
          }}
        >
          <div
            style={{
              width: labelWidth,
              padding: '0 8px',
              lineHeight: `${headerHeight}px`,
              fontWeight: 600,
              fontSize: 14,
              color: 'var(--main-text)',
            }}
          >
            订单名称
          </div>
          <div className="flex flex-1">
            {Array.from({ length: ganttData.totalDays }).map((_, i) => {
              const date = ganttData.minDate.add(i, 'day');
              return (
                <div
                  key={i}
                  style={{
                    width: dayWidth,
                    textAlign: 'center',
                    lineHeight: `${headerHeight}px`,
                    fontSize: 11,
                    color: 'var(--com-text)',
                    borderRight: '1px solid var(--border-top-light)',
                  }}
                >
                  {date.format('MM/DD')}
                </div>
              );
            })}
          </div>
        </div>
        {ganttData.orders.map((order) => (
          <div
            key={order.id}
            className="flex items-center border-b border-[var(--border-top-light)]"
            style={{ height: rowHeight }}
          >
            <div
              style={{
                width: labelWidth,
                padding: '0 8px',
                fontSize: 13,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
              title={order.title}
            >
              {order.title || order.windowName || '未命名'}
            </div>
            <div className="flex-1 relative">
              <DragBar
                order={order}
                dayWidth={dayWidth}
                minDate={ganttData.minDate}
                onDragEnd={handleDragEnd}
              />
            </div>
          </div>
        ))}
      </div>
    );
  }, [ganttData, handleDragEnd]);

  if (loading)
    return (
      <div className="flex justify-center items-center h-64">
        <p className="text-[var(--com-text)]">加载中...</p>
      </div>
    );

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-[var(--main-text)]">排期</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setView('month')}
            className={`btn-quark text-sm ${view === 'month' ? 'btn-quark-primary' : ''}`}
          >
            月视图
          </button>
          <button
            onClick={() => setView('gantt')}
            className={`btn-quark text-sm ${view === 'gantt' ? 'btn-quark-primary' : ''}`}
          >
            甘特图
          </button>
        </div>
      </div>
      {view === 'month' ? monthView : ganttView}
    </div>
  );
}