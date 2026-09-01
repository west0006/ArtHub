import { useState } from 'react';
import { ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { router } from 'expo-router';
import { YStack, Text, XStack, Select } from 'tamagui';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createOrder } from '@/lib/api/orders';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { formatDate } from '@/lib/utils/formatDate';
import DateTimePicker from '@react-native-community/datetimepicker';

export default function NewOrderPage() {
    const queryClient = useQueryClient();
    const [form, setForm] = useState({
        title: '',
        clientName: '',
        price: '',
        quantity: '1',
        description: '',
        startDate: new Date(),
        deadline: new Date(),
        status: 'pending' as 'pending' | 'progress' | 'completed',
        showStartPicker: false,
        showDeadlinePicker: false,
    });
    const [error, setError] = useState('');

    const createMutation = useMutation({
        mutationFn: (data: any) => createOrder(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['orders'] });
            router.back();
        },
    });

    const handleSubmit = () => {
        if (!form.title.trim()) {
            setError('请输入订单标题');
            return;
        }
        const priceNum = parseFloat(form.price) || 0;
        const qty = parseInt(form.quantity) || 1;
        const payload = {
            title: form.title,
            clientName: form.clientName,
            price: priceNum,
            quantity: qty,
            totalAmount: priceNum * qty,
            description: form.description,
            startDate: formatDate(form.startDate, 'YYYY-MM-DD HH:mm'),
            deadline: formatDate(form.deadline, 'YYYY-MM-DD HH:mm'),
            status: form.status,
        };
        createMutation.mutate(payload);
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={{ flex: 1, backgroundColor: '#fff' }}
        >
            <ScrollView contentContainerStyle={{ padding: 16 }}>
                <YStack gap={16}>
                    <Text fontSize={24} fontWeight="700">新建订单</Text>

                    {error ? <Text color="$red9">{error}</Text> : null}

                    <Card>
                        <YStack gap={12}>
                            <Input label="订单标题 *" placeholder="例如：角色立绘" value={form.title} onChangeText={(v) => setForm({ ...form, title: v })} />
                            <Input label="客户名称" placeholder="客户称呼" value={form.clientName} onChangeText={(v) => setForm({ ...form, clientName: v })} />
                            <XStack gap={12}>
                                <YStack flex={1}>
                                    <Input label="单价 (¥)" placeholder="0.00" value={form.price} onChangeText={(v) => setForm({ ...form, price: v })} keyboardType="numeric" />
                                </YStack>
                                <YStack flex={1}>
                                    <Input label="数量" placeholder="1" value={form.quantity} onChangeText={(v) => setForm({ ...form, quantity: v })} keyboardType="numeric" />
                                </YStack>
                            </XStack>
                            <Input label="描述" placeholder="订单要求、风格等" value={form.description} onChangeText={(v) => setForm({ ...form, description: v })} multiline numberOfLines={3} />
                        </YStack>
                    </Card>

                    <Card>
                        <YStack gap={12}>
                            <Text fontWeight="600">日期时间</Text>
                            <DatePickerField
                                label="开始日期"
                                date={form.startDate}
                                onPress={() => setForm({ ...form, showStartPicker: true })}
                            />
                            {form.showStartPicker && (
                                <DateTimePicker
                                    value={form.startDate}
                                    mode="datetime"
                                    display="default"
                                    onChange={(event, selectedDate) => {
                                        setForm({ ...form, showStartPicker: false });
                                        if (selectedDate) setForm({ ...form, startDate: selectedDate });
                                    }}
                                />
                            )}
                            <DatePickerField
                                label="截止日期"
                                date={form.deadline}
                                onPress={() => setForm({ ...form, showDeadlinePicker: true })}
                            />
                            {form.showDeadlinePicker && (
                                <DateTimePicker
                                    value={form.deadline}
                                    mode="datetime"
                                    display="default"
                                    onChange={(event, selectedDate) => {
                                        setForm({ ...form, showDeadlinePicker: false });
                                        if (selectedDate) setForm({ ...form, deadline: selectedDate });
                                    }}
                                />
                            )}
                            <Text fontWeight="600" marginTop={8}>状态</Text>
                            <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as any })}>
                                <Select.Item value="pending" index={0}>待开始</Select.Item>
                                <Select.Item value="progress" index={1}>进行中</Select.Item>
                                <Select.Item value="completed" index={2}>已完成</Select.Item>
                            </Select>
                        </YStack>
                    </Card>

                    <XStack gap={12}>
                        <Button title="取消" variant="secondary" onPress={() => router.back()} style={{ flex: 1 }} />
                        <Button title="创建订单" variant="primary" onPress={handleSubmit} loading={createMutation.isPending} style={{ flex: 1 }} />
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