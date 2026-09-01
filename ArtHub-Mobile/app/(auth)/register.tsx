import { useState } from 'react';
import { router } from 'expo-router';
import { ScrollView } from 'react-native';
import { YStack, Text } from 'tamagui';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { emailRegister } from '@/lib/api/auth';
import { Storage } from '@/lib/storage';

export default function RegisterPage() {
    const [nickname, setNickname] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleRegister = async () => {
        if (!email.trim() || !password.trim()) {
            setError('邮箱和密码不能为空');
            return;
        }
        if (password.length < 6) {
            setError('密码至少6位');
            return;
        }
        setLoading(true);
        setError('');
        try {
            const res = await emailRegister(email, password, nickname);
            const { accessToken, refreshToken, user } = res;
            Storage.set('accessToken', accessToken);
            Storage.set('refreshToken', refreshToken);
            Storage.set('user', JSON.stringify(user));
            router.replace('/(tabs)/dashboard');
        } catch (err: any) {
            const msg = err.response?.data?.message || '注册失败，请稍后重试';
            setError(typeof msg === 'string' ? msg : '注册失败');
        } finally {
            setLoading(false);
        }
    };

    return (
        <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 24 }}>
            <Card>
                <YStack gap={20}>
                    <Text fontSize={28} fontWeight="700" textAlign="center" color="$green9">
                        注册艺栈
                    </Text>
                    {error ? (
                        <Text color="$red9" fontSize={14} textAlign="center">{error}</Text>
                    ) : null}
                    <YStack gap={12}>
                        <Input label="昵称" placeholder="给自己取个名字" value={nickname} onChangeText={setNickname} />
                        <Input label="邮箱" placeholder="请输入邮箱" value={email} onChangeText={setEmail} keyboardType="email-address" />
                        <Input label="密码" placeholder="至少6位密码" value={password} onChangeText={setPassword} secureTextEntry />
                    </YStack>
                    <Button title={loading ? '注册中...' : '注册'} variant="primary" onPress={handleRegister} loading={loading} />
                    <Text textAlign="center" fontSize={14} color="$gray10">
                        已有账号？{' '}
                        <Text color="$green9" fontWeight="600" onPress={() => router.push('/(auth)/login')}>
                            立即登录
                        </Text>
                    </Text>
                </YStack>
            </Card>
        </ScrollView>
    );
}