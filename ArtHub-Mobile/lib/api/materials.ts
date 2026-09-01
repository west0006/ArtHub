import request from '../request';
import type { MaterialData } from '@/types/api';

export const getMyMaterials = (): Promise<MaterialData[]> =>
    request.get<MaterialData[]>('/materials').then(res => res.data);

export const getMaterialById = (id: number): Promise<MaterialData> =>
    request.get<MaterialData>(`/materials/${id}`).then(res => res.data);

export const createMaterial = (data: { title: string; description?: string; tags?: string; fileUrl: string }): Promise<MaterialData> =>
    request.post<MaterialData>('/materials', data).then(res => res.data);

export const uploadMaterial = (formData: FormData): Promise<MaterialData> =>
    request.post<MaterialData>('/materials/upload', formData).then(res => res.data);

export const updateMaterial = (id: number, data: Partial<MaterialData>): Promise<MaterialData> =>
    request.put<MaterialData>(`/materials/${id}`, data).then(res => res.data);

export const deleteMaterial = (id: number): Promise<void> =>
    request.delete(`/materials/${id}`).then(res => res.data);