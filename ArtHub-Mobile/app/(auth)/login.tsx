import { useState } from 'react';
import { router } from 'expo-router';
import { ScrollView, KeyboardAvoidingView } from 'react-native';
import { YStack, Text } from 'tamagui';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { emailLogin } from '@/lib/api/auth';
import { Storage } from '@/lib/storage';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleLogin = async () => {
        if (!email.trim() || !password.trim()) {
            setError('请填写邮箱和密码');
            return;
        }
        setLoading(true);
        setError('');
        try {
            const res = await emailLogin(email, password);
            const { accessToken, refreshToken, user } = res;
            Storage.set('accessToken', accessToken);
            Storage.set('refreshToken', refreshToken);
            Storage.set('user', JSON.stringify(user));
            router.replace('/(tabs)/dashboard');
        } catch (err: any) {
            const msg = err.response?.data?.message || '登录失败，请检查网络';
            setError(typeof msg === 'string' ? msg : '登录失败');
        } finally {
            setLoading(false);
        }
    };

    return (
        <ScrollView
            contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 24 }}
            keyboardShouldPersistTaps="handled"
        >
            <KeyboardAvoidingView behavior="padding">
                <Card>
                    <YStack gap={20}>
                        <Text fontSize={28} fontWeight="700" textAlign="center" color="$green9">
                            艺栈
                        </Text>
                        <Text fontSize={14} color="$gray10" textAlign="center">
                            灵感 · 订单 · 素材 · AI
                        </Text>

                        {error ? (
                            <Text color="$red9" fontSize={14} textAlign="center">
                                {error}
                            </Text>
                        ) : null}

                        <YStack gap={12}>
                            <Input
                                label="邮箱"
                                placeholder="请输入邮箱地址"
                                value={email}
                                onChangeText={setEmail}
                                keyboardType="email-address"
                            />
                            <Input
                                label="密码"
                                placeholder="请输入密码"
                                value={password}
                                onChangeText={setPassword}
                                secureTextEntry
                            />
                        </YStack>

                        <Button
                            title={loading ? '登录中...' : '登录'}
                            variant="primary"
                            onPress={handleLogin}
                            loading={loading}
                        />

                        <Text textAlign="center" fontSize={14} color="$gray10">
                            还没有账号？{' '}
                            <Text
                                color="$green9"
                                fontWeight="600"
                                onPress={() => router.push('/(auth)/register')}
                            >
                                立即注册
                            </Text>
                        </Text>
                    </YStack>
                </Card>
            </KeyboardAvoidingView>
        </ScrollView>
    );
}