import request from '@/lib/request';

export interface MaterialData {
  id: number;
  title: string;
  description?: string;
  tags?: string;
  fileUrl: string;
  thumbnailUrl?: string;
  fileSize?: number;
  dimension?: string;
  createTime: string;
}

export const getMyMaterials = () =>
  request.get<MaterialData[]>('/materials');

export const getMaterialById = (id: number) =>
  request.get<MaterialData>(`/materials/${id}`);

export const createMaterial = (data: { title: string; description?: string; tags?: string; fileUrl: string }) =>
  request.post<MaterialData>('/materials', data);

export const uploadMaterial = (formData: FormData) =>
  request.post<MaterialData>('/materials/upload', formData);

export const updateMaterial = (id: number, data: Partial<MaterialData>) =>
  request.put<MaterialData>(`/materials/${id}`, data);

export const deleteMaterial = (id: number) =>
  request.delete(`/materials/${id}`);