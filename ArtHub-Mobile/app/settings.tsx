import { useEffect, useState } from 'react';
import { ScrollView, Alert } from 'react-native';
import { router } from 'expo-router';
import { YStack, Text, XStack, Avatar } from 'tamagui';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Loading } from '@/components/ui/Loading';
import { getUserProfile } from '@/lib/api/auth';
import { Storage } from '@/lib/storage';
import { Ionicons } from '@expo/vector-icons';

export default function SettingsPage() {
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [password, setPassword] = useState({ old: '', new: '', confirm: '' });
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const res = await getUserProfile();
                setUser(res);
            } catch (err) {
                Storage.clearAll();
                router.replace('/(auth)/login');
            } finally {
                setLoading(false);
            }
        };
        fetchUser();
    }, []);

    const handleLogout = () => {
        Alert.alert('退出登录', '确定退出当前账号？', [
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

    const handleChangePassword = () => {
        if (!password.old || !password.new || !password.confirm) {
            setError('请填写所有密码字段');
            return;
        }
        if (password.new !== password.confirm) {
            setError('两次新密码不一致');
            return;
        }
        if (password.new.length < 6) {
            setError('新密码至少6位');
            return;
        }
        setError('');
        Alert.alert('提示', '密码修改功能正在开发中，敬请期待');
    };

    if (loading) return <Loading />;

    return (
        <ScrollView style={{ backgroundColor: '#f5f5f5', flex: 1 }} contentContainerStyle={{ padding: 16 }}>
            <YStack gap={16}>
                <Text fontSize={24} fontWeight="700">设置</Text>

                <Card>
                    <YStack gap={12}>
                        <MenuItem icon="person-outline" label="昵称" value={user?.nickname || '未设置'} />
                        <MenuItem icon="mail-outline" label="邮箱" value={user?.email || '未设置'} />
                        <MenuItem
                            icon="shield-outline"
                            label="角色"
                            value={user?.role === 0 ? '普通用户' : user?.role === 1 ? '画师' : '管理员'}
                        />
                    </YStack>
                </Card>

                <Card>
                    <Text fontWeight="600" marginBottom={12}>修改密码</Text>
                    <YStack gap={12}>
                        <Input
                            label="当前密码"
                            placeholder="输入当前密码"
                            value={password.old}
                            onChangeText={(v) => setPassword({ ...password, old: v })}
                            secureTextEntry
                        />
                        <Input
                            label="新密码"
                            placeholder="至少6位"
                            value={password.new}
                            onChangeText={(v) => setPassword({ ...password, new: v })}
                            secureTextEntry
                        />
                        <Input
                            label="确认新密码"
                            placeholder="再次输入"
                            value={password.confirm}
                            onChangeText={(v) => setPassword({ ...password, confirm: v })}
                            secureTextEntry
                        />
                        {error ? <Text color="$red9" fontSize={12}>{error}</Text> : null}
                        <Button title="保存密码" variant="primary" onPress={handleChangePassword} />
                    </YStack>
                </Card>

                <Button title="退出登录" variant="danger" onPress={handleLogout} />
            </YStack>
        </ScrollView>
    );
}

const MenuItem = ({ icon, label, value }: { icon: string; label: string; value: string }) => (
    <XStack justifyContent="space-between" alignItems="center" paddingVertical={8}>
        <XStack gap={12} alignItems="center">
            <Ionicons name={icon as any} size={18} color="#333" />
            <Text fontSize={16}>{label}</Text>
        </XStack>
        <Text color="$gray10">{value}</Text>
    </XStack>
);