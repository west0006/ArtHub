import { useState, useRef, useEffect, useCallback } from 'react';
import {
    View,
    FlatList,
    TextInput,
    KeyboardAvoidingView,
    Platform,
    TouchableOpacity,
    Alert,
} from 'react-native';
import { YStack, Text, XStack } from 'tamagui';
import { useMutation } from '@tanstack/react-query';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Loading } from '@/components/ui/Loading';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { aiChat, analyzeImage } from '@/lib/api/ai';

interface Message {
    id: string;
    role: 'user' | 'ai';
    content: string;
    imageUri?: string;
}

export default function AiPage() {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [imageUri, setImageUri] = useState<string | null>(null);
    const flatListRef = useRef<FlatList>(null);

    const chatMutation = useMutation({
        mutationFn: async (message: string) => {
            const res = await aiChat(message);
            return res.reply;
        },
    });

    const analyzeMutation = useMutation({
        mutationFn: async (params: { base64: string; prompt?: string }) => {
            const res = await analyzeImage(params.base64, params.prompt);
            return res.reply;
        },
    });

    const sendMessage = useCallback(async () => {
        const text = input.trim();
        if (!text && !imageUri) return;

        let base64 = '';
        if (imageUri) {
            base64 = await FileSystem.readAsStringAsync(imageUri, {
                encoding: 'base64',
            });
        }

        const userMsg: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: text || '请分析这张图片',
            imageUri: imageUri || undefined,
        };
        setMessages((prev) => [...prev, userMsg]);
        setInput('');
        setImageUri(null);

        try {
            let reply: string;
            if (base64) {
                reply = await analyzeMutation.mutateAsync({ base64, prompt: text });
            } else {
                reply = await chatMutation.mutateAsync(text);
            }
            const aiMsg: Message = {
                id: (Date.now() + 1).toString(),
                role: 'ai',
                content: reply,
            };
            setMessages((prev) => [...prev, aiMsg]);
        } catch (err) {
            const errorMsg: Message = {
                id: (Date.now() + 2).toString(),
                role: 'ai',
                content: '抱歉，AI 服务暂时不可用。',
            };
            setMessages((prev) => [...prev, errorMsg]);
        }
    }, [input, imageUri]);

    useEffect(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
    }, [messages]);

    const pickImage = async () => {
        const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permission.granted) {
            Alert.alert('需要相册权限');
            return;
        }
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            quality: 1,
        });
        if (!result.canceled && result.assets?.[0]) {
            setImageUri(result.assets[0].uri);
        }
    };

    const renderMessage = ({ item }: { item: Message }) => (
        <XStack
            justifyContent={item.role === 'user' ? 'flex-end' : 'flex-start'}
            paddingHorizontal={16}
            marginVertical={4}
        >
            <Card
                backgroundColor={item.role === 'user' ? '$green5' : '$color2'}
                maxWidth="80%"
                padding={12}
            >
                {item.imageUri && (
                    <View style={{ width: 200, height: 200, marginBottom: 8, borderRadius: 12, overflow: 'hidden' }}>
                        <Ionicons name="image-outline" size={80} color="#ccc" style={{ alignSelf: 'center', marginTop: 60 }} />
                    </View>
                )}
                <Text color={item.role === 'user' ? 'white' : '$gray12'}>{item.content}</Text>
            </Card>
        </XStack>
    );

    return (
        <KeyboardAvoidingView
            style={{ flex: 1, backgroundColor: '#fff' }}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            keyboardVerticalOffset={90}
        >
            <YStack flex={1}>
                <XStack justifyContent="space-between" alignItems="center" paddingHorizontal={16} paddingTop={8} paddingBottom={4}>
                    <Text fontSize={20} fontWeight="700">AI 助手</Text>
                    <TouchableOpacity onPress={() => setMessages([])}>
                        <Ionicons name="trash-outline" size={20} color="#999" />
                    </TouchableOpacity>
                </XStack>

                <FlatList
                    ref={flatListRef}
                    data={messages}
                    renderItem={renderMessage}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={{ paddingVertical: 8, flexGrow: 1 }}
                    ListEmptyComponent={
                        <YStack flex={1} justifyContent="center" alignItems="center" padding={24}>
                            <Ionicons name="chatbubble-ellipses-outline" size={48} color="#999" />
                            <Text marginTop={12} color="$gray10" textAlign="center">
                                我是您的 AI 创作助手，可以为您提供灵感建议、色彩分析和绘画指导
                            </Text>
                        </YStack>
                    }
                />

                {imageUri && (
                    <XStack paddingHorizontal={16} paddingBottom={8} alignItems="center" gap={8}>
                        <View style={{ width: 60, height: 60, borderRadius: 8, backgroundColor: '#f0f0f0', justifyContent: 'center', alignItems: 'center' }}>
                            <Ionicons name="image" size={24} color="#999" />
                        </View>
                        <Button title="移除" variant="text" size="small" onPress={() => setImageUri(null)} />
                    </XStack>
                )}

                <XStack paddingHorizontal={16} paddingVertical={8} borderTopWidth={1} borderColor="$color5" alignItems="center" gap={8}>
                    <TouchableOpacity onPress={pickImage}>
                        <Ionicons name="image-outline" size={24} color="#16a085" />
                    </TouchableOpacity>
                    <TextInput
                        style={{
                            flex: 1,
                            borderWidth: 1,
                            borderColor: '#e0e0e0',
                            borderRadius: 20,
                            paddingHorizontal: 16,
                            paddingVertical: 8,
                            fontSize: 15,
                            maxHeight: 100,
                        }}
                        placeholder="输入消息..."
                        value={input}
                        onChangeText={setInput}
                        multiline
                    />
                    <Button
                        title="发送"
                        variant="primary"
                        size="small"
                        onPress={sendMessage}
                        loading={chatMutation.isPending || analyzeMutation.isPending}
                        disabled={!input.trim() && !imageUri}
                    />
                </XStack>
            </YStack>
        </KeyboardAvoidingView>
    );
}