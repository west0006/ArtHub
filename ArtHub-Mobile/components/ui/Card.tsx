// components/ui/Card.tsx
import React from 'react';
import { YStack, styled } from 'tamagui';
import { colors } from '@/theme';

export const Card = styled(YStack, {
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 5,
    borderBottomWidth: 5,
    borderTopColor: colors.borderLight,
    borderLeftColor: colors.borderLight,
    borderRightColor: colors.borderDark,
    borderBottomColor: colors.borderDark,
    borderRadius: 12,
    padding: 16,
    backgroundColor: colors.surface,
    variants: {
        variant: {
            filled: {
                backgroundColor: colors.mainLight,
                borderColor: colors.main,
            },
            outlined: {},
        },
    },
} as any);