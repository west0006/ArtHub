// components/ui/EmptyState.tsx
import React from 'react';
import { YStack, Text } from 'tamagui';
import { Button } from './Button';
import { colors } from '@/theme';

interface EmptyStateProps {
    icon?: React.ReactNode;
    title: string;
    description?: string;
    actionText?: string;
    onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
                                                          icon,
                                                          title,
                                                          description,
                                                          actionText,
                                                          onAction,
                                                      }) => (
    <YStack flex={1} justifyContent="center" alignItems="center" padding={24} gap={12}>
        {icon}
        <Text fontSize={18} fontWeight="600" color={colors.textSecondary}>{title}</Text>
        {description ? <Text textAlign="center" color={colors.low}>{description}</Text> : null}
        {actionText && onAction ? (
            <Button title={actionText} variant="primary" onPress={onAction} />
        ) : null}
    </YStack>
);