// components/ui/Button.tsx
import React from 'react';
import { Button as TamaguiButton, styled, Text } from 'tamagui';
import { colors } from '@/theme';

const BaseButton = styled(TamaguiButton, {
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
    fontWeight: '600',
    fontSize: 16,
    borderStyle: 'solid',
    variants: {
        variant: {
            primary: {
                backgroundColor: colors.main,
                color: 'white',
                borderTopWidth: 1,
                borderLeftWidth: 1,
                borderRightWidth: 5,
                borderBottomWidth: 5,
                borderTopColor: colors.borderLight,
                borderLeftColor: colors.borderLight,
                borderRightColor: colors.borderDark,
                borderBottomColor: colors.borderDark,
                pressStyle: {
                    backgroundColor: colors.mainDeep,
                    borderTopWidth: 5,
                    borderLeftWidth: 5,
                    borderRightWidth: 1,
                    borderBottomWidth: 1,
                    borderTopColor: colors.borderDark,
                    borderLeftColor: colors.borderDark,
                    borderRightColor: colors.borderLight,
                    borderBottomColor: colors.borderLight,
                },
            },
            secondary: {
                backgroundColor: 'transparent',
                borderWidth: 2,
                borderColor: colors.borderDark,
                color: colors.text,
                pressStyle: {
                    backgroundColor: colors.mainLight,
                },
            },
            danger: {
                backgroundColor: colors.warn,
                color: 'white',
                borderTopWidth: 1,
                borderLeftWidth: 1,
                borderRightWidth: 5,
                borderBottomWidth: 5,
                borderTopColor: '#ffb3b3',
                borderLeftColor: '#ffb3b3',
                borderRightColor: colors.borderDark,
                borderBottomColor: colors.borderDark,
                pressStyle: {
                    backgroundColor: '#c0392b',
                    borderTopWidth: 5,
                    borderLeftWidth: 5,
                    borderRightWidth: 1,
                    borderBottomWidth: 1,
                },
            },
            text: {
                backgroundColor: 'transparent',
                color: colors.main,
                paddingHorizontal: 0,
                borderWidth: 0,
            },
        },
        size: {
            small: {
                paddingVertical: 8,
                paddingHorizontal: 16,
                fontSize: 14,
            },
            medium: {},
            large: {
                paddingVertical: 16,
                paddingHorizontal: 32,
                fontSize: 18,
            },
        },
        disabled: {
            true: {
                opacity: 0.5,
            },
        },
    },
} as any);

export const Button: React.FC<{
    title: string;
    variant?: 'primary' | 'secondary' | 'danger' | 'text';
    size?: 'small' | 'medium' | 'large';
    disabled?: boolean;
    loading?: boolean;
    onPress: () => void;
    style?: any;
}> = ({ title, variant = 'primary', size = 'medium', disabled, loading, onPress, style }) => {
    return (
        <BaseButton
            variant={variant as any}
            size={size}
            disabled={disabled || loading}
            onPress={onPress}
            style={style}
        >
            <Text fontWeight="600">{loading ? '处理中...' : title}</Text>
        </BaseButton>
    );
};