import { useEffect, useState } from 'react';
import { ScrollView, Alert } from 'react-native';
import { router } from 'expo-router';
import { YStack, Text, XStack, Avatar } from 'tamagui';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Loading } from '@/components/ui/Loading';
import { getUserProfile } from '@/lib/api/auth';
import { Storage } from '@/lib/storage';
import { Ionicons } from '@expo/vector-icons';

export default function ProfilePage() {
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const res = await getUserProfile();
                setUser(res);
            } catch (err) {
                // 如果获取失败，跳转到登录
                Storage.clearAll();
                router.replace('/(auth)/login');
            } finally {
                setLoading(false);
            }
        };
        fetchUser();
    }, []);

    const handleLogout = () => {
        Alert.alert('退出登录', '确定要退出当前账号吗？', [
            { text: '取消', style: 'cancel' },
            {
                text: '退出',
                style: 'destructive',
                onPress: () => {
                    Storage.clearAll();
                    router.replace('/(auth)/login');
                },
            },
        ]);
    };

    if (loading) return <Loading />;

    return (
        <ScrollView style={{ backgroundColor: '#f5f5f5', flex: 1 }} contentContainerStyle={{ padding: 16 }}>
            <YStack gap={16}>
                <Card>
                    <YStack alignItems="center" gap={12}>
                        <Avatar circular size="$8">
                            <Avatar.Image source={{ uri: user?.avatarUrl || undefined }} />
                            <Avatar.Fallback backgroundColor="$green5" />
                        </Avatar>
                        <YStack alignItems="center">
                            <Text fontSize={20} fontWeight="700">{user?.nickname || '未设置昵称'}</Text>
                            {user?.email ? <Text color="$gray10">{user.email}</Text> : null}
                        </YStack>
                    </YStack>
                </Card>

                <Card>
                    <YStack gap={12}>
                        <MenuItem icon="person-outline" label="编辑资料" onPress={() => {}} />
                        <MenuItem icon="settings-outline" label="设置" onPress={() => router.push('/settings')} />
                        <MenuItem icon="information-circle-outline" label="关于艺栈" onPress={() => Alert.alert('艺栈', '版本 1.0.0')} />
                    </YStack>
                </Card>

                <Button title="退出登录" variant="danger" onPress={handleLogout} />
            </YStack>
        </ScrollView>
    );
}

const MenuItem = ({ icon, label, onPress }: { icon: string; label: string; onPress: () => void }) => (
    <XStack
        justifyContent="space-between"
        alignItems="center"
        paddingVertical={12}
        onPress={onPress}
        pressStyle={{ opacity: 0.7 }}
    >
        <XStack gap={12} alignItems="center">
            <Ionicons name={icon as any} size={20} color="#333" />
            <Text fontSize={16}>{label}</Text>
        </XStack>
        <Ionicons name="chevron-forward" size={18} color="#ccc" />
    </XStack>
);