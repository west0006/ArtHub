// app/(tabs)/materials.tsx
import { useState, useCallback } from 'react';
import { FlatList, RefreshControl, Alert, Dimensions, Image, TouchableOpacity } from 'react-native';
import { YStack, Text, XStack } from 'tamagui';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getMyMaterials, deleteMaterial, uploadMaterial } from '@/lib/api/materials';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Loading } from '@/components/ui/Loading';
import { EmptyState } from '@/components/ui/EmptyState';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { colors } from '@/theme';
import type { MaterialData } from '@/types/api';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48) / 2;

export default function MaterialsPage() {
    const queryClient = useQueryClient();
    const [uploading, setUploading] = useState(false);
    const [previewIndex, setPreviewIndex] = useState(-1);

    const { data: materials, isLoading, refetch } = useQuery({
        queryKey: ['materials'],
        queryFn: async () => {
            const res = await getMyMaterials();
            return res;
        },
    });

    const deleteMutation = useMutation({
        mutationFn: (id: number) => deleteMaterial(id),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['materials'] }),
    });

    const handlePickImage = useCallback(async () => {
        const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permission.granted) {
            Alert.alert('需要相册权限');
            return;
        }
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            quality: 1,
        });
        if (!result.canceled && result.assets?.[0]) {
            setUploading(true);
            try {
                const asset = result.assets[0];
                const formData = new FormData();
                formData.append('file', {
                    uri: asset.uri,
                    name: asset.fileName || 'material.jpg',
                    type: asset.mimeType || 'image/jpeg',
                } as any);
                formData.append('title', asset.fileName || '素材');
                await uploadMaterial(formData);
                queryClient.invalidateQueries({ queryKey: ['materials'] });
            } catch (err) {
                Alert.alert('上传失败');
            } finally {
                setUploading(false);
            }
        }
    }, [queryClient]);

    const handleDelete = (id: number) => {
        Alert.alert('确认删除', '删除后无法恢复', [
            { text: '取消', style: 'cancel' },
            { text: '删除', style: 'destructive', onPress: () => {
                    deleteMutation.mutate(id);
                    setPreviewIndex(-1); // 关闭预览
            }},
        ]);
    };

    const handlePreview = (index: number) => {
        setPreviewIndex(index);
    };

    if (isLoading) return <Loading />;

    const materialList: MaterialData[] = materials || [];

    return (
        <YStack flex={1} backgroundColor={colors.background} padding={16} gap={16}>
            <XStack justifyContent="space-between" alignItems="center">
                <Text fontSize={24} fontWeight="700">我的素材</Text>
                <Button title="上传" variant="primary" size="small" onPress={handlePickImage} loading={uploading} />
            </XStack>

            <FlatList
                data={materialList}
                numColumns={2}
                keyExtractor={(item) => item.id.toString()}
                columnWrapperStyle={{ gap: 12, marginBottom: 12 }}
                renderItem={({ item, index }) => (
                    <Card padding={0} width={CARD_WIDTH} overflow="hidden">
                        <TouchableOpacity onPress={() => handlePreview(index)}>
                            <Image
                                source={{ uri: item.fileUrl }}
                                style={{
                                    width: CARD_WIDTH,
                                    height: CARD_WIDTH * 0.75,
                                    backgroundColor: colors.mainLight,
                                }}
                                resizeMode="cover"
                            />
                        </TouchableOpacity>
                        <YStack padding={12} gap={4}>
                            <Text fontWeight="600" numberOfLines={1}>{item.title}</Text>
                            {item.tags ? (
                                <Text fontSize={12} color={colors.textSecondary} numberOfLines={1}>
                                    {item.tags.split(',').join(' · ')}
                                </Text>
                            ) : null}
                            <Button title="删除" variant="text" size="small" onPress={() => handleDelete(item.id)} />
                        </YStack>
                    </Card>
                )}
                ListEmptyComponent={
                    <EmptyState
                        icon={<Ionicons name="image-outline" size={48} color="#999" />}
                        title="暂无素材"
                        description="点击右上角按钮上传素材"
                    />
                }
                contentContainerStyle={{ paddingBottom: 24 }}
            />

            {/* 图片预览 */}
            {previewIndex >= 0 && materialList[previewIndex] && (
                <TouchableOpacity
                    style={{
                        position: 'absolute',
                        top: 0, left: 0, right: 0, bottom: 0,
                        backgroundColor: 'rgba(0,0,0,0.9)',
                        justifyContent: 'center',
                        alignItems: 'center',
                    }}
                    onPress={() => setPreviewIndex(-1)}
                >
                    <Image
                        source={{ uri: materialList[previewIndex].fileUrl }}
                        style={{ width: '90%', height: '70%' }}
                        resizeMode="contain"
                    />
                </TouchableOpacity>
            )}
        </YStack>
    );
}