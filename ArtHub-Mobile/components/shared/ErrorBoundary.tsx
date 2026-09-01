import React from 'react';
import { View, Text } from 'react-native';
import { Button } from '@/components/ui/Button';

interface Props {
    children: React.ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error('ErrorBoundary caught:', error, errorInfo);
    }

    handleReset = () => {
        this.setState({ hasError: false, error: null });
    };

    render() {
        if (this.state.hasError) {
            return (
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
                    <Text style={{ fontSize: 18, fontWeight: '600', marginBottom: 12 }}>页面出错了</Text>
                    <Text style={{ color: '#666', marginBottom: 24, textAlign: 'center' }}>
                        抱歉，遇到了意外错误。请尝试刷新页面。
                    </Text>
                    <Button title="重试" variant="primary" onPress={this.handleReset} />
                </View>
            );
        }

        return this.props.children;
    }
}