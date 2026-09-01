import { useCallback, useState } from 'react';
import { FlatList, RefreshControl } from 'react-native';
import { router } from 'expo-router';
import { YStack, Text, XStack, styled } from 'tamagui';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getOrders, deleteOrder, updateOrder } from '@/lib/api/orders';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { StatusTag } from '@/components/ui/StatusTag';
import { EmptyState } from '@/components/ui/EmptyState';
import { Loading } from '@/components/ui/Loading';
import { Ionicons } from '@expo/vector-icons';
import { formatDate } from '@/lib/utils/formatDate';
import { formatCurrency } from '@/lib/utils/formatCurrency';
import {OrderData} from "@/types/api"

const FilterBar = styled(XStack, {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
    backgroundColor: '$background',
    borderBottomWidth: 1,
    borderColor: '$color5',
});
type OrderStatus = 'pending' | 'progress' | 'completed';
export default function OrdersPage() {
    const queryClient = useQueryClient();
    const [filter, setFilter] = useState<string>('all');
    const [selectedIds, setSelectedIds] = useState<number[]>([]);

    const { data: orders, isLoading, refetch } = useQuery({
        queryKey: ['orders'],
        queryFn: async () => {
            const res = await getOrders();
            return res;
        },
    });

    const deleteMutation = useMutation({
        mutationFn: (id: number) => deleteOrder(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['orders'] });
            setSelectedIds([]);
        },
    });

    const statusMutation = useMutation({
        mutationFn: ({ id, status }: { id: number; status: OrderStatus }) =>
            updateOrder(id, { status } ),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['orders'] });
            setSelectedIds([]);
        },
    });

    const filteredOrders = (orders || []).filter((order) =>
        filter === 'all' ? true : order.status === filter
    );

    const handleDelete = (id: number) => {
        deleteMutation.mutate(id);
    };

    const handleBatchStatus = (status: OrderStatus) => {
        selectedIds.forEach((id) => statusMutation.mutate({ id, status }));
    };

    const toggleSelect = (id: number) => {
        setSelectedIds((prev) =>
            prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
        );
    };

    const renderItem = ({ item }: { item: any }) => (
        <Card
            pressStyle={{ backgroundColor: '$color2' }}
            onPress={() => router.push(`/orders/${item.id}`)}
            marginHorizontal={16}
            marginVertical={6}
        >
            <YStack gap={8}>
                <XStack justifyContent="space-between" alignItems="center">
                    <Text fontWeight="600" fontSize={16} numberOfLines={1} flex={1}>
                        {item.title || item.windowName || '未命名订单'}
                    </Text>
                    <StatusTag status={item.status} />
                </XStack>
                <XStack justifyContent="space-between">
                    <Text color="$gray10">{item.clientName || '未知客户'}</Text>
                    <Text fontWeight="600" color="$green9">
                        {formatCurrency(item.totalAmount)}
                    </Text>
                </XStack>
                <XStack justifyContent="space-between">
                    <Text fontSize={12} color="$gray9">
                        {item.startDate ? formatDate(item.startDate) : '-'} ~ {item.deadline ? formatDate(item.deadline) : '-'}
                    </Text>
                    <XStack gap={12}>
                        <Button
                            title="编辑"
                            variant="text"
                            size="small"
                            onPress={() => router.push(`/orders/edit/${item.id}`)}
                        />
                        <Button
                            title="删除"
                            variant="text"
                            size="small"
                            onPress={() => handleDelete(item.id)}
                        />
                    </XStack>
                </XStack>
            </YStack>
        </Card>
    );

    if (isLoading) return <Loading />;

    return (
        <YStack flex={1} backgroundColor="$background">
            <FilterBar>
                {['all', 'pending', 'progress', 'completed'].map((status) => (
                    <Button
                        key={status}
                        title={
                            status === 'all' ? '全部' :
                                status === 'pending' ? '待开始' :
                                    status === 'progress' ? '进行中' : '已完成'
                        }
                        variant={filter === status ? 'primary' : 'secondary'}
                        size="small"
                        onPress={() => setFilter(status)}
                    />
                ))}
            </FilterBar>

            {selectedIds.length > 0 && (
                <XStack
                    padding={12}
                    gap={8}
                    backgroundColor="$color2"
                    borderBottomWidth={1}
                    borderColor="$color5"
                >
                    <Button
                        title="标记进行中"
                        variant="secondary"
                        size="small"
                        onPress={() => handleBatchStatus('progress')}
                    />
                    <Button
                        title="标记已完成"
                        variant="secondary"
                        size="small"
                        onPress={() => handleBatchStatus('completed')}
                    />
                    <Button
                        title="批量删除"
                        variant="danger"
                        size="small"
                        onPress={() => selectedIds.forEach((id) => deleteMutation.mutate(id))}
                    />
                    <Button
                        title="取消"
                        variant="text"
                        size="small"
                        onPress={() => setSelectedIds([])}
                    />
                </XStack>
            )}

            <FlatList
                data={filteredOrders}
                renderItem={renderItem}
                keyExtractor={(item) => item.id.toString()}
                contentContainerStyle={{ paddingVertical: 8, flexGrow: 1 }}
                refreshControl={
                    <RefreshControl refreshing={isLoading} onRefresh={refetch} />
                }
                ListEmptyComponent={
                    <EmptyState
                        icon={<Ionicons name="receipt-outline" size={48} color="#999" />}
                        title="暂无订单"
                        description="点击右上角按钮创建第一个订单"
                    />
                }
            />
        </YStack>
    );
}