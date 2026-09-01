// components/ui/StatusTag.tsx
import React from 'react';
import { Text, styled } from 'tamagui';
import { colors } from '@/theme';

const Tag = styled(Text, {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
    fontSize: 12,
    fontWeight: '600',
    variants: {
        status: {
            pending: {
                backgroundColor: '#fef3c7',
                color: '#92400e',
                borderWidth: 1,
                borderColor: colors.borderDark,
            },
            progress: {
                backgroundColor: '#dbeafe',
                color: '#1e40af',
                borderWidth: 1,
                borderColor: colors.borderDark,
            },
            completed: {
                backgroundColor: '#d1fae5',
                color: '#065f46',
                borderWidth: 1,
                borderColor: colors.borderDark,
            },
        },
    },
});

export const StatusTag: React.FC<{ status: 'pending' | 'progress' | 'completed' }> = ({ status }) => {
    const labels = { pending: '待开始', progress: '进行中', completed: '已完成' };
    return <Tag status={status}>{labels[status]}</Tag>;
};