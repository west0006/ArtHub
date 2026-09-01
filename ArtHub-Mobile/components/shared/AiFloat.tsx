// components/shared/AiFloat.tsx
import React, { useEffect, useState, useRef } from 'react';
import { TouchableOpacity, View, Text as RNText } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, usePathname } from 'expo-router';
import { aiChat } from '@/lib/api/ai';
import { getOrders } from '@/lib/api/orders';
import { colors } from '@/theme';

interface BubbleState {
    visible: boolean;
    text: string;
}

const BUBBLE_DISPLAY_TIME = 8000;
const AI_REQUEST_INTERVAL = 40000;
const LOCAL_REFRESH_INTERVAL = 30000;

export const AiFloat: React.FC = () => {
    const pathname = usePathname();
    const [bubble, setBubble] = useState<BubbleState>({ visible: false, text: '' });
    const lastAiRequestTime = useRef(0);
    const isFetching = useRef(false);
    const bubbleTimer = useRef<NodeJS.Timeout | undefined>(undefined);
    const localTimer = useRef<NodeJS.Timeout | undefined>(undefined);

    const showBubble = (text: string) => {
        if (bubbleTimer.current) clearTimeout(bubbleTimer.current);
        setBubble({ visible: true, text });
        bubbleTimer.current = setTimeout(() => {
            setBubble(prev => ({ ...prev, visible: false }));
        }, BUBBLE_DISPLAY_TIME);
    };

    const buildPrompt = async (route: string): Promise<string | null> => {
        try {
            const orders = await getOrders();
            const now = new Date();
            const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

            if (route.startsWith('/calendar') || route.startsWith('/home')) {
                const unfinished = orders.filter(o => o.status !== 'completed');
                const nearestDeadline = unfinished
                    .filter(o => o.deadline)
                    .sort((a, b) => new Date(a.deadline!).getTime() - new Date(b.deadline!).getTime())[0];
                const deadlineInfo = nearestDeadline
                    ? `最近截止：${nearestDeadline.title}，距${Math.ceil((new Date(nearestDeadline.deadline!).getTime() - today.getTime()) / 86400000)}天`
                    : '无即将截止订单';
                return `用户正在看排期日历，当前有${unfinished.length}个未完成订单。${deadlineInfo}。请生成20字以内的鼓励或提醒。`;
            }
            if (route.startsWith('/orders')) {
                return `用户在订单页面，请给出一句关于订单管理的建议（20字以内）。`;
            }
            if (route.startsWith('/materials')) {
                return `用户在素材库页面，请给出一句关于素材管理的建议（20字以内）。`;
            }
            if (route.startsWith('/dashboard')) {
                return `用户在仪表盘，请给出一句鼓舞士气的话（20字以内）。`;
            }
        } catch (err) {
            console.warn('AiFloat AI request failed:', err);
        } finally {

        }
        return null;
    };

    const getLocalText = (route: string): string => {
        if (route.startsWith('/calendar') || route.startsWith('/home')) return '📅 看看今天有没有截止的订单吧';
        if (route.startsWith('/orders')) return '📋 这里管理你所有的稿单';
        if (route.startsWith('/materials')) return '🖼️ 素材库可以上传你的参考图';
        if (route.startsWith('/dashboard')) return '📊 收入总览，加油创作！';
        return '💬 有什么可以帮你的吗？';
    };

    const triggerAI = async (prompt: string) => {
        if (isFetching.current) return;
        if (Date.now() - lastAiRequestTime.current < AI_REQUEST_INTERVAL) return;
        isFetching.current = true;
        try {
            const res = await aiChat(prompt, false);
            if (res?.reply) {
                showBubble(res.reply);
                lastAiRequestTime.current = Date.now();
            }
        } catch (err) {
            console.warn('AiFloat AI request failed:', err);
        } finally {
            isFetching.current = false;
        }
    };

    useEffect(() => {
        const interval = setInterval(() => {
            const currentRoute = pathname;
            const localText = getLocalText(currentRoute);
            showBubble(localText);

            buildPrompt(currentRoute).then(prompt => {
                if (prompt) void triggerAI(prompt);
            });
        }, LOCAL_REFRESH_INTERVAL);
        localTimer.current = interval;
        return () => clearInterval(interval);
    }, [pathname]);

    useEffect(() => {
        const initialText = getLocalText(pathname);
        showBubble(initialText);
        buildPrompt(pathname).then(prompt => {
            if (prompt) void triggerAI(prompt);
        });
    }, []);

    const handlePress = () => {
        router.push('/ai');
    };

    return (
        <View style={{ position: 'absolute', bottom: 100, right: 20, zIndex: 999 }}>
            {bubble.visible && (
                <View
                    style={{
                        position: 'absolute',
                        bottom: 60,
                        right: 0,
                        backgroundColor: 'white',
                        borderRadius: 12,
                        padding: 12,
                        maxWidth: 200,
                        borderWidth: 2,
                        borderColor: colors.borderDark,
                        borderTopWidth: 1,
                        borderLeftWidth: 1,
                        borderRightWidth: 4,
                        borderBottomWidth: 4,
                        borderTopColor: colors.borderLight,
                        borderLeftColor: colors.borderLight,
                    }}
                >
                    <RNText style={{ color: colors.text, fontSize: 14 }}>{bubble.text}</RNText>
                    <View
                        style={{
                            position: 'absolute',
                            bottom: -10,
                            right: 20,
                            width: 0,
                            height: 0,
                            borderLeftWidth: 8,
                            borderRightWidth: 8,
                            borderTopWidth: 10,
                            borderLeftColor: 'transparent',
                            borderRightColor: 'transparent',
                            borderTopColor: colors.borderDark,
                        }}
                    />
                </View>
            )}
            <TouchableOpacity
                onPress={handlePress}
                style={{
                    width: 56,
                    height: 56,
                    borderRadius: 28,
                    backgroundColor: colors.main,
                    justifyContent: 'center',
                    alignItems: 'center',
                    borderWidth: 2,
                    borderColor: colors.borderDark,
                    borderTopWidth: 1,
                    borderLeftWidth: 1,
                    borderRightWidth: 4,
                    borderBottomWidth: 4,
                }}
            >
                <Ionicons name="chatbubble-ellipses" size={24} color="white" />
            </TouchableOpacity>
        </View>
    );
};