import React from 'react';
import { View, ActivityIndicator, Text } from 'react-native';
import {colors} from "@/theme";

export const Loading: React.FC<{ text?: string }> = ({ text = '加载中...' }) => (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={colors.main} />
        <Text style={{ marginTop: 12, color: '#666' }}>{text}</Text>
    </View>
);