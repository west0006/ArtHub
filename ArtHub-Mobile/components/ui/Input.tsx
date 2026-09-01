// components/ui/Input.tsx
import React from 'react';
import { Input as TamaguiInput, styled, Text, YStack } from 'tamagui';
import { colors } from '@/theme';

const StyledInput = styled(TamaguiInput, {
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 3,
    borderBottomWidth: 3,
    borderTopColor: colors.borderLight,
    borderLeftColor: colors.borderLight,
    borderRightColor: colors.borderDark,
    borderBottomColor: colors.borderDark,
    borderRadius: 8,
    backgroundColor: colors.surface,
    height: 48,
    paddingHorizontal: 16,
    fontSize: 16,
    color: colors.text,
    focusStyle: {
        borderBottomColor: colors.main,
        borderRightColor: colors.main,
    },
});

export const Input: React.FC<{
    placeholder?: string;
    value: string;
    onChangeText: (text: string) => void;
    secureTextEntry?: boolean;
    keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad';
    error?: string;
    label?: string;
    multiline?: boolean;
    numberOfLines?: number;
}> = ({ label, error, ...rest }) => {
    return (
        <YStack gap={4}>
            {label && <Text fontWeight="500" color={colors.textSecondary}>{label}</Text>}
            <StyledInput {...rest} />
            {error ? <Text color="$red9" fontSize={12}>{error}</Text> : null}
        </YStack>
    );
};