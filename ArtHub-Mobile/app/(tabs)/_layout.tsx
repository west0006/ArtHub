import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import {colors} from "@/theme";

export default function TabLayout() {
    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarActiveTintColor: colors.main,
                tabBarInactiveTintColor: '#999',
                tabBarStyle: {
                    borderTopWidth: 0,
                    backgroundColor: '#fff',
                    paddingBottom: 4,
                    height: 56,
                },
                tabBarLabelStyle: {
                    fontSize: 12,
                    fontWeight: '500',
                },
            }}
        >
            <Tabs.Screen
                name="dashboard"
                options={{
                    title: '仪表盘',
                    tabBarIcon: ({ color, size }) => <Ionicons name="grid-outline" size={size} color={color} />,
                }}
            />
            <Tabs.Screen
                name="orders"
                options={{
                    title: '订单',
                    tabBarIcon: ({ color, size }) => <Ionicons name="list-outline" size={size} color={color} />,
                }}
            />
            <Tabs.Screen
                name="calendar"
                options={{
                    title: '排期',
                    tabBarIcon: ({ color, size }) => <Ionicons name="calendar-outline" size={size} color={color} />,
                }}
            />
            <Tabs.Screen
                name="materials"
                options={{
                    title: '素材',
                    tabBarIcon: ({ color, size }) => <Ionicons name="images-outline" size={size} color={color} />,
                }}
            />
            <Tabs.Screen
                name="profile"
                options={{
                    title: '我的',
                    tabBarIcon: ({ color, size }) => <Ionicons name="person-outline" size={size} color={color} />,
                }}
            />
        </Tabs>
    );
}