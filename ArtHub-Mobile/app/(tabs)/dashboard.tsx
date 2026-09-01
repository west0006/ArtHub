// app/(tabs)/dashboard.tsx
import { useState } from 'react';
import { ScrollView, RefreshControl, View } from 'react-native';
import { useRouter } from 'expo-router';
import { YStack, Text, XStack, styled } from 'tamagui';
import { useQuery } from '@tanstack/react-query';
import { getOrders } from '@/lib/api/orders';
import { getDashboardSummary } from '@/lib/api/dashboard';
import { Card } from '@/components/ui/Card';
import { StatusTag } from '@/components/ui/StatusTag';
import { Loading } from '@/components/ui/Loading';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatCurrency } from '@/lib/utils/formatCurrency';
import { formatDate } from '@/lib/utils/formatDate';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/theme';
import type { DashboardSummary, OrderData } from '@/types/api';
import {AiFloat} from "@/components/shared/AiFloat";

const StatCard = styled(Card, {
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 12,
    flex: 1,
    borderRadius: 16,
});

export default function DashboardPage() {
    const router = useRouter();
    const [refreshing, setRefreshing] = useState(false);

    // 总览数据
    const { data: summary, isLoading: summaryLoading, refetch: refetchSummary } = useQuery({
        queryKey: ['dashboardSummary'],
        queryFn: async () => {
            const res = await getDashboardSummary();
            return res;
        },
    });

    // 订单列表用于最近订单
    const { data: orders, isLoading: ordersLoading, refetch: refetchOrders } = useQuery({
        queryKey: ['orders'],
        queryFn: async () => {
            const res = await getOrders();
            return res;
        },
    });

    const isLoading = summaryLoading || ordersLoading;

    const onRefresh = async () => {
        setRefreshing(true);
        await Promise.all([refetchSummary(), refetchOrders()]);
        setRefreshing(false);
    };

    if (isLoading) return <Loading />;

    const stats = summary as DashboardSummary | undefined;
    const sortedOrders = [...(orders || [])].sort((a, b) =>
        new Date(b.createTime || '').getTime() - new Date(a.createTime || '').getTime()
    );
    const recentOrders = sortedOrders.slice(0, 5);

    return (
        <View style={{ flex: 1 }}>
        <ScrollView
            style={{ backgroundColor: colors.background, flex: 1 }}
            contentContainerStyle={{ padding: 16 }}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
            <YStack gap={16}>
                <Text fontSize={24} fontWeight="700">仪表盘</Text>

                {/* 统计卡片 */}
                <XStack gap={12}>
                    <StatCard backgroundColor={colors.mainLight}>
                        <Text fontSize={28} fontWeight="700" color={colors.main}>{stats?.orderCount || 0}</Text>
                        <Text color={colors.textSecondary}>总订单</Text>
                    </StatCard>
                    <StatCard backgroundColor="#dbeafe">
                        <Text fontSize={28} fontWeight="700" color="#1d4ed8">{stats?.pendingOrders || 0}</Text>
                        <Text color={colors.textSecondary}>进行中</Text>
                    </StatCard>
                </XStack>
                <XStack gap={12}>
                    <StatCard backgroundColor="#fef3c7">
                        <Text fontSize={28} fontWeight="700" color="#92400e">{orders?.filter(o => o.status === 'pending').length ?? 0}</Text>
                        <Text color={colors.textSecondary}>待开始</Text>
                    </StatCard>
                    <StatCard backgroundColor="#d1fae5">
                        <Text fontSize={28} fontWeight="700" color="#065f46">{stats?.completedOrders || 0}</Text>
                        <Text color={colors.textSecondary}>已完成</Text>
                    </StatCard>
                </XStack>

                {/* 收入与素材 */}
                <XStack gap={12}>
                    <StatCard>
                        <Text fontSize={18} fontWeight="700" color={colors.main}>{formatCurrency(stats?.totalIncome)}</Text>
                        <Text color={colors.textSecondary}>累计收入</Text>
                    </StatCard>
                    <StatCard>
                        <Text fontSize={28} fontWeight="700">{stats?.materialCount || 0}</Text>
                        <Text color={colors.textSecondary}>素材总数</Text>
                    </StatCard>
                </XStack>

                {/* 最近订单 */}
                <Text fontSize={18} fontWeight="600">最近订单</Text>
                {recentOrders.length === 0 ? (
                    <EmptyState
                        icon={<Ionicons name="receipt-outline" size={48} color="#999" />}
                        title="暂无订单"
                    />
                ) : (
                    recentOrders.map((order) => (
                        <Card
                            key={order.id}
                            pressStyle={{ backgroundColor: colors.mainLight }}
                            onPress={() => router.push(`/orders/${order.id}`)}
                        >
                            <XStack justifyContent="space-between" alignItems="center">
                                <YStack flex={1} gap={4}>
                                    <Text fontWeight="600" numberOfLines={1}>{order.title || order.title || '未命名'}</Text>
                                    <Text fontSize={12} color={colors.textSecondary}>
                                        {order.clientName || '-'} · {formatCurrency(order.totalAmount)}
                                    </Text>
                                    <Text fontSize={12} color={colors.low}>
                                        {order.startDate ? formatDate(order.startDate) : '-'} ~ {order.deadline ? formatDate(order.deadline) : '-'}
                                    </Text>
                                </YStack>
                                <StatusTag status={order.status} />
                            </XStack>
                        </Card>
                    ))
                )}
            </YStack>
        </ScrollView>

        </View>
    );
}