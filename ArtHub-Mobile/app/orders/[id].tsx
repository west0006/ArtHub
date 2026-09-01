import { useEffect, useState } from 'react';
import { useLocalSearchParams, router } from 'expo-router';
import { ScrollView, Alert } from 'react-native';
import { YStack, Text, XStack } from 'tamagui';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getOrderById, deleteOrder } from '@/lib/api/orders';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { StatusTag } from '@/components/ui/StatusTag';
import { Loading } from '@/components/ui/Loading';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatDate } from '@/lib/utils/formatDate';
import { formatCurrency } from '@/lib/utils/formatCurrency';

export default function OrderDetailPage() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const orderId = parseInt(id, 10);
    const queryClient = useQueryClient();

    const { data: order, isLoading, error } = useQuery({
        queryKey: ['order', orderId],
        queryFn: async () => {
            const res = await getOrderById(orderId);
            return res;
        },
        enabled: !!orderId,
    });

    const deleteMutation = useMutation({
        mutationFn: () => deleteOrder(orderId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['orders'] });
            router.back();
        },
    });

    const handleDelete = () => {
        Alert.alert('确认删除', '删除后无法恢复，确定删除该订单吗？', [
            { text: '取消', style: 'cancel' },
            { text: '删除', style: 'destructive', onPress: () => deleteMutation.mutate() },
        ]);
    };

    if (isLoading) return <Loading />;
    if (error || !order) return <EmptyState title="订单不存在" />;

    // 确保 status 为合法值
    const validStatus = order.status as 'pending' | 'progress' | 'completed';

    return (
        <ScrollView contentContainerStyle={{ padding: 16 }} style={{ backgroundColor: '#fff', flex: 1 }}>
            <YStack gap={16}>
                <XStack justifyContent="space-between" alignItems="center">
                    <Text fontSize={24} fontWeight="700">{order.title || order.title || '未命名'}</Text>
                    <StatusTag status={validStatus} />
                </XStack>

                <Card>
                    <YStack gap={12}>
                        <DetailRow label="客户" value={order.clientName || '未知'} />
                        <DetailRow label="金额" value={formatCurrency(order.totalAmount)} />
                        <DetailRow label="单价" value={formatCurrency(order.price)} />
                        <DetailRow label="数量" value={`${order.quantity || 1} 件`} />
                        <DetailRow label="开始日期" value={order.startDate ? formatDate(order.startDate, 'YYYY-MM-DD HH:mm') : '未设置'} />
                        <DetailRow label="截止日期" value={order.deadline ? formatDate(order.deadline, 'YYYY-MM-DD HH:mm') : '未设置'} />
                        {order.platform && <DetailRow label="来源平台" value={order.platform} />}
                    </YStack>
                </Card>

                {order.description ? (
                    <Card>
                        <Text fontWeight="600" marginBottom={8}>描述</Text>
                        <Text color="$gray11" lineHeight={20}>{order.description}</Text>
                    </Card>
                ) : null}

                {order.description ? (
                    <Card>
                        <Text fontWeight="600" marginBottom={8}>设定信息</Text>
                        <Text color="$gray11" lineHeight={20}>{order.description}</Text>
                    </Card>
                ) : null}

                <XStack gap={12} marginTop={8}>
                    <Button
                        title="编辑"
                        variant="primary"
                        onPress={() => router.push(`/orders/edit/${orderId}`)}
                        style={{ flex: 1 }}
                    />
                    <Button
                        title="删除"
                        variant="danger"
                        onPress={handleDelete}
                        style={{ flex: 1 }}
                    />
                </XStack>
            </YStack>
        </ScrollView>
    );
}

const DetailRow = ({ label, value }: { label: string; value: string }) => (
    <XStack justifyContent="space-between">
        <Text color="$gray10">{label}</Text>
        <Text fontWeight="500">{value}</Text>
    </XStack>
);