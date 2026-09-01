// app/(tabs)/calendar.tsx
import React, { useState, useMemo, useCallback } from 'react';
import {
    View,
    ScrollView,
    Dimensions,
    RefreshControl,
    TouchableOpacity,
    Alert,
} from 'react-native';
import { YStack, Text, XStack, styled } from 'tamagui';
import { useQuery } from '@tanstack/react-query';
import { getOrders } from '@/lib/api/orders';
import { Card } from '@/components/ui/Card';
import { StatusTag } from '@/components/ui/StatusTag';
import { Loading } from '@/components/ui/Loading';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/Button';
import { formatDate } from '@/lib/utils/formatDate';
import { Ionicons } from '@expo/vector-icons';
import dayjs from 'dayjs';
import minMax from 'dayjs/plugin/minMax';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import { router } from 'expo-router';
import { colors } from '@/theme';
import type { OrderData } from '@/types/api';

dayjs.extend(minMax);
dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);

const { width } = Dimensions.get('window');
const DAY_WIDTH = Math.floor((width - 32) / 7);

const DayCell = styled(View, {
    width: DAY_WIDTH,
    height: DAY_WIDTH * 0.85,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
    variants: {
        isToday: { true: { backgroundColor: colors.mainLight } },
        hasOrder: { true: { borderWidth: 2, borderColor: colors.main } },
        outsideMonth: { true: { opacity: 0.3 } },
    },
});

interface CalendarDay {
    day: number;
    date: string;
    hasOrder: boolean;
    orderId?: number;
    orderStatus?: string;
}

export default function CalendarPage() {
    const [currentDate, setCurrentDate] = useState(dayjs());
    // 三个月数据：当前月、前一个月、后一个月，用于左右滑动
    const months = useMemo(() => {
        const base = currentDate.startOf('month');
        return [
            base.subtract(1, 'month'),
            base,
            base.add(1, 'month'),
        ];
    }, [currentDate]);

    const { data: orders, isLoading, refetch } = useQuery({
        queryKey: ['orders'],
        queryFn: async () => {
            const res = await getOrders();
            return res;
        },
    });

    const orderList = orders || [];

    // 计算状态栏信息
    const statusInfo = useMemo(() => {
        const now = dayjs();
        const todayStr = now.format('YYYY-MM-DD');
        // 未完成订单
        const unfinished = orderList.filter(o => o.status !== 'completed');
        const unfinishedCount = unfinished.length;

        // 最近截止的未完成订单
        let nearestDeadline: OrderData | null = null;
        let minDeadlineDiff = Infinity;
        let todayDeadline: OrderData | null = null;

        unfinished.forEach(order => {
            if (!order.deadline) return;
            const deadline = dayjs(order.deadline);
            const diff = deadline.diff(now, 'day');
            if (deadline.format('YYYY-MM-DD') === todayStr) {
                todayDeadline = order;
            }
            if (diff < minDeadlineDiff) {
                minDeadlineDiff = diff;
                nearestDeadline = order;
            }
        });

        // 最近开始的订单（未开始且未来最近的）
        let nearestStart: OrderData | null = null;
        let minStartDiff = Infinity;
        unfinished.forEach(order => {
            if (!order.startDate || order.status !== 'pending') return;
            const start = dayjs(order.startDate);
            const diff = start.diff(now, 'day');
            if (diff >= 0 && diff < minStartDiff) {
                minStartDiff = diff;
                nearestStart = order;
            }
        });

        // 当前状态
        let status: 'free' | 'busy' | 'dead' = 'free';
        if (unfinished.length === 0) status = 'free';
        else if (nearestDeadline && minDeadlineDiff < 0) status = 'dead';
        else {
            // 判断今天有无进行中或未开始但覆盖今天的订单
            const hasToday = orderList.some(order => {
                if (order.status === 'completed') return false;
                const start = order.startDate ? dayjs(order.startDate) : null;
                const end = order.deadline ? dayjs(order.deadline) : null;
                if (!start && !end) return false;
                const startDay = start ?? dayjs('1970-01-01');
                const endDay = end ?? dayjs('2099-12-31');
                return now.isSameOrAfter(startDay, 'day') && now.isSameOrBefore(endDay, 'day');
            });
            status = hasToday ? 'busy' : 'free';
        }

        return {
            status,
            unfinishedCount,
            nearestDeadlineDays: nearestDeadline ? minDeadlineDiff : null,
            todayDeadline: !!todayDeadline,
            nearestStartDays: nearestStart ? minStartDiff : null,
        };
    }, [orderList]);

    // 获取某一天的订单信息
    const getOrderOnDate = useCallback(
        (dateStr: string): { hasOrder: boolean; orderId?: number; orderStatus?: string } => {
            const order = orderList.find(o => {
                if (o.status === 'completed') return false;
                if (!o.startDate || !o.deadline) return false; // 必须两者都有
                const start = dayjs(o.startDate);
                const end = dayjs(o.deadline);
                const target = dayjs(dateStr);
                return target.isSameOrAfter(start, 'day') && target.isSameOrBefore(end, 'day');
            });
            return {
                hasOrder: !!order,
                orderId: order?.id,
                orderStatus: order?.status,
            };
        },
        [orderList]
    );

    // 生成月份日历数据
    const generateMonthData = useCallback(
        (date: dayjs.Dayjs): CalendarDay[][] => {
            const year = date.year();
            const month = date.month();
            const daysInMonth = date.daysInMonth();
            const firstDayOfWeek = date.startOf('month').day();

            const weeks: CalendarDay[][] = [];
            let currentWeek: CalendarDay[] = [];

            // 填充前面的空白天
            for (let i = 0; i < firstDayOfWeek; i++) {
                currentWeek.push({ day: 0, date: '', hasOrder: false });
            }

            for (let d = 1; d <= daysInMonth; d++) {
                const dateStr = dayjs(new Date(year, month, d)).format('YYYY-MM-DD');
                const orderInfo = getOrderOnDate(dateStr);
                currentWeek.push({
                    day: d,
                    date: dateStr,
                    hasOrder: orderInfo.hasOrder,
                    orderId: orderInfo.orderId,
                    orderStatus: orderInfo.orderStatus,
                });
                if (currentWeek.length === 7) {
                    weeks.push(currentWeek);
                    currentWeek = [];
                }
            }
            // 填充剩余天数
            if (currentWeek.length > 0) {
                while (currentWeek.length < 7) {
                    currentWeek.push({ day: 0, date: '', hasOrder: false });
                }
                weeks.push(currentWeek);
            }
            return weeks;
        },
        [getOrderOnDate]
    );

    const monthData = useMemo(() => months.map(m => generateMonthData(m)), [months, generateMonthData]);

    const today = dayjs();
    const todayStr = today.format('YYYY-MM-DD');

    // 处理日期点击
    const handleDayPress = (day: CalendarDay) => {
        if (!day.date) return;
        if (day.hasOrder && day.orderId) {
            router.push(`/orders/${day.orderId}`);
        } else {
            Alert.alert(
                '创建订单',
                `是否在 ${day.date} 创建新订单？`,
                [
                    { text: '取消', style: 'cancel' },
                    { text: '创建', onPress: () => router.push({ pathname: '/orders/new', params: { selectedDate: day.date } }) },
                ]
            );
        }
    };

    if (isLoading) return <Loading />;

    return (
        <YStack flex={1} backgroundColor={colors.background} paddingTop={8}>
            {/* 状态栏 */}
            <Card marginHorizontal={16} marginBottom={8} backgroundColor={colors.mainLight} padding={12}>
                <XStack justifyContent="space-between" flexWrap="wrap">
                    <StatusItem label="状态" value={statusInfo.status === 'free' ? '空闲' : statusInfo.status === 'busy' ? '忙碌' : '超时'} color={statusInfo.status === 'free' ? colors.main : statusInfo.status === 'dead' ? colors.warn : colors.text} />
                    <StatusItem label="截稿日" value={statusInfo.todayDeadline ? '今天截稿' : statusInfo.nearestDeadlineDays !== null ? `${statusInfo.nearestDeadlineDays}天后` : '无'} />
                    <StatusItem label="下个开始" value={statusInfo.nearestStartDays !== null ? `${statusInfo.nearestStartDays}天后` : '无'} />
                    <StatusItem label="未完成" value={`${statusInfo.unfinishedCount}单`} />
                </XStack>
            </Card>

            {/* 月份切换 */}
            <XStack justifyContent="space-between" alignItems="center" paddingHorizontal={16} marginBottom={8}>
                <Button title="‹ 上月" variant="text" size="small" onPress={() => setCurrentDate(currentDate.subtract(1, 'month'))} />
                <Text fontSize={20} fontWeight="700">{currentDate.format('YYYY 年 M 月')}</Text>
                <Button title="下月 ›" variant="text" size="small" onPress={() => setCurrentDate(currentDate.add(1, 'month'))} />
            </XStack>

            {/* 星期头 */}
            <XStack marginBottom={4} paddingHorizontal={16}>
                {['日', '一', '二', '三', '四', '五', '六'].map((d) => (
                    <View key={d} style={{ width: DAY_WIDTH, alignItems: 'center' }}>
                        <Text color={colors.textSecondary} fontSize={12}>{d}</Text>
                    </View>
                ))}
            </XStack>

            <ScrollView
                contentContainerStyle={{ paddingHorizontal: 16 }}
                refreshControl={<RefreshControl refreshing={isLoading} onRefresh={() => refetch()} />}
            >
                {/* 当月日历 */}
                {monthData[1].map((week, wi) => (
                    <XStack key={wi} marginBottom={4}>
                        {week.map((day, di) => {
                            const isToday = day.date === todayStr;
                            const isCurrentMonth = day.date !== ''; // 简化
                            return (
                                <TouchableOpacity key={di} onPress={() => handleDayPress(day)}>
                                    <DayCell isToday={isToday} hasOrder={day.hasOrder} outsideMonth={!isCurrentMonth}>
                                        {day.day > 0 && (
                                            <YStack alignItems="center" gap={2}>
                                                <Text fontWeight={isToday ? '700' : '500'} fontSize={14}>
                                                    {day.day}
                                                </Text>
                                                {day.hasOrder && (
                                                    <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: day.orderStatus === 'completed' ? colors.main : colors.warn }} />
                                                )}
                                            </YStack>
                                        )}
                                    </DayCell>
                                </TouchableOpacity>
                            );
                        })}
                    </XStack>
                ))}

                {/* 今日订单列表 */}
                <Text fontSize={18} fontWeight="600" marginTop={16} marginBottom={8}>今日订单</Text>
                {orderList.filter(o => {
                    if (!o.startDate || !o.deadline) return false;
                    const start = dayjs(o.startDate);
                    const end = dayjs(o.deadline);
                    return today.isSameOrAfter(start, 'day') && today.isSameOrBefore(end, 'day');
                }).length === 0 ? (
                    <EmptyState icon={<Ionicons name="calendar-outline" size={48} color="#999" />} title="今天没有排期的订单" />
                ) : (
                    orderList.filter(o => {
                        if (!o.startDate || !o.deadline) return false;
                        const start = dayjs(o.startDate);
                        const end = dayjs(o.deadline);
                        return today.isSameOrAfter(start, 'day') && today.isSameOrBefore(end, 'day');
                    }).map(order => (
                        <Card key={order.id} marginBottom={8} pressStyle={{ backgroundColor: colors.mainLight }} onPress={() => router.push(`/orders/${order.id}`)}>
                            <XStack justifyContent="space-between" alignItems="center">
                                <YStack flex={1} gap={4}>
                                    <Text fontWeight="600">{order.title || order.title}</Text>
                                    <Text fontSize={12} color={colors.textSecondary}>{order.clientName || '-'}</Text>
                                </YStack>
                                <StatusTag status={order.status} />
                            </XStack>
                        </Card>
                    ))
                )}
            </ScrollView>
        </YStack>
    );
}

// 辅助组件
const StatusItem = ({ label, value, color }: { label: string; value: string; color?: string }) => (
    <YStack alignItems="center" marginHorizontal={8} marginBottom={4}>
        <Text fontSize={12} color={colors.textSecondary}>{label}</Text>
        <Text fontSize={14} fontWeight="600" color={color || colors.text}>{value}</Text>
    </YStack>
);