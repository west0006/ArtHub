import { Stack } from 'expo-router';
import { TamaguiProvider, View } from 'tamagui';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import tamaguiConfig from '../tamagui.config';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { ErrorBoundary } from '@/components/shared/ErrorBoundary';
import {AiFloat} from "@/components/shared/AiFloat";
// import { View } from 'react-native';

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            retry: 2,
            staleTime: 1000 * 60,
        },
    },
});

export default function RootLayout() {
    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <TamaguiProvider config={tamaguiConfig} defaultTheme="light">
                <ErrorBoundary>
                <QueryClientProvider client={queryClient}>
                    <View style={{ flex: 1 }}>
                    <Stack screenOptions={{ headerShown: false }}>
                        <Stack.Screen name="index" />
                        <Stack.Screen name="(auth)" />
                        <Stack.Screen name="(tabs)" />
                    </Stack>
                    </View>
                </QueryClientProvider>
                </ErrorBoundary>
            </TamaguiProvider>
        </GestureHandlerRootView>
    );
}