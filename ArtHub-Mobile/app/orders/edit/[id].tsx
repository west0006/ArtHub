import { useEffect, useState } from 'react';
import { ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { YStack, Text, XStack, Select } from 'tamagui';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getOrderById, updateOrder } from '@/lib/api/orders';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Loading } from '@/components/ui/Loading';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatDate } from '@/lib/utils/formatDate';
import DateTimePicker from '@react-native-community/datetimepicker';

export default function EditOrderPage() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const orderId = parseInt(id, 10);
    const queryClient = useQueryClient();
    const [form, setForm] = useState<any>(null);
    const [showStartPicker, setShowStartPicker] = useState(false);
    const [showDeadlinePicker, setShowDeadlinePicker] = useState(false);
    const [error, setError] = useState('');

    const { data: order, isLoading } = useQuery({
        queryKey: ['order', orderId],
        queryFn: async () => {
            const res = await getOrderById(orderId);
            return res;
        },
        enabled: !!orderId,
    });

    useEffect(() => {
        if (order) {
            setForm({
                title: order.title || order.title || '',
                clientName: order.clientName || '',
                price: String(order.price || 0),
                quantity: String(order.quantity || 1),
                description: order.description || '',
                startDate: order.startDate ? new Date(order.startDate) : new Date(),
                deadline: order.deadline ? new Date(order.deadline) : new Date(),
                status: order.status || 'pending',
            });
        }
    }, [order]);

    const updateMutation = useMutation({
        mutationFn: (data: any) => updateOrder(orderId, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['orders'] });
            queryClient.invalidateQueries({ queryKey: ['order', orderId] });
            router.back();
        },
    });

    const handleSubmit = () => {
        if (!form || !form.title.trim()) {
            setError('标题不能为空');
            return;
        }
        const priceNum = parseFloat(form.price) || 0;
        const qty = parseInt(form.quantity) || 1;
        updateMutation.mutate({
            title: form.title,
            clientName: form.clientName,
            price: priceNum,
            quantity: qty,
            totalAmount: priceNum * qty,
            description: form.description,
            startDate: formatDate(form.startDate, 'YYYY-MM-DD HH:mm'),
            deadline: formatDate(form.deadline, 'YYYY-MM-DD HH:mm'),
            status: form.status,
        });
    };

    if (isLoading) return <Loading />;
    if (!order) return <EmptyState title="订单不存在" />;
    if (!form) return <Loading />;

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={{ flex: 1, backgroundColor: '#fff' }}
        >
            <ScrollView contentContainerStyle={{ padding: 16 }}>
                <YStack gap={16}>
                    <Text fontSize={24} fontWeight="700">编辑订单</Text>
                    {error ? <Text color="$red9">{error}</Text> : null}

                    <Card>
                        <YStack gap={12}>
                            <Input label="订单标题 *" value={form.title} onChangeText={(v) => setForm({ ...form, title: v })} />
                            <Input label="客户名称" value={form.clientName} onChangeText={(v) => setForm({ ...form, clientName: v })} />
                            <XStack gap={12}>
                                <YStack flex={1}>
                                    <Input label="单价 (¥)" value={form.price} onChangeText={(v) => setForm({ ...form, price: v })} keyboardType="numeric" />
                                </YStack>
                                <YStack flex={1}>
                                    <Input label="数量" value={form.quantity} onChangeText={(v) => setForm({ ...form, quantity: v })} keyboardType="numeric" />
                                </YStack>
                            </XStack>
                            <Input label="描述" value={form.description} onChangeText={(v) => setForm({ ...form, description: v })} multiline numberOfLines={3} />

                            <Text fontWeight="600" marginTop={8}>日期时间</Text>
                            <DatePickerField
                                label="开始日期"
                                date={form.startDate}
                                onPress={() => setShowStartPicker(true)}
                            />
                            {showStartPicker && (
                                <DateTimePicker
                                    value={form.startDate}
                                    mode="datetime"
                                    display="default"
                                    onChange={(e, date) => {
                                        setShowStartPicker(false);
                                        if (date) setForm({ ...form, startDate: date });
                                    }}
                                />
                            )}
                            <DatePickerField
                                label="截止日期"
                                date={form.deadline}
                                onPress={() => setShowDeadlinePicker(true)}
                            />
                            {showDeadlinePicker && (
                                <DateTimePicker
                                    value={form.deadline}
                                    mode="datetime"
                                    display="default"
                                    onChange={(e, date) => {
                                        setShowDeadlinePicker(false);
                                        if (date) setForm({ ...form, deadline: date });
                                    }}
                                />
                            )}

                            <Text fontWeight="600" marginTop={8}>状态</Text>
                            <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                                <Select.Item value="pending" index={0}>待开始</Select.Item>
                                <Select.Item value="progress" index={1}>进行中</Select.Item>
                                <Select.Item value="completed" index={2}>已完成</Select.Item>
                            </Select>
                        </YStack>
                    </Card>

                    <XStack gap={12}>
                        <Button title="取消" variant="secondary" onPress={() => router.back()} style={{ flex: 1 }} />
                        <Button title="保存修改" variant="primary" onPress={handleSubmit} loading={updateMutation.isPending} style={{ flex: 1 }} />
                    </XStack>
                </YStack>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const DatePickerField = ({ label, date, onPress }: { label: string; date: Date; onPress: () => void }) => (
    <XStack justifyContent="space-between" alignItems="center" paddingVertical={8}>
        <Text color="$gray10">{label}</Text>
        <Button title={formatDate(date, 'YYYY-MM-DD HH:mm')} variant="secondary" size="small" onPress={onPress} />
    </XStack>
);