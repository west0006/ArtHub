'use client';

import { useState, useEffect, useCallback } from 'react';
import { getMyMaterials, deleteMaterial, createMaterial, uploadMaterial } from '@/lib/api/materials';
import type { MaterialData } from '@/lib/api/materials';

export function useMaterials() {
  const [materials, setMaterials] = useState<MaterialData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMaterials = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getMyMaterials();
      setMaterials(res.data);
    } catch (err: any) {
      setError(err.response?.data?.message || '加载素材失败');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMaterials();
  }, [fetchMaterials]);

  const addMaterial = async (data: { title: string; description?: string; tags?: string; fileUrl: string }) => {
    await createMaterial(data);
    await fetchMaterials();
  };

  const uploadNewMaterial = async (formData: FormData) => {
    await uploadMaterial(formData);
    await fetchMaterials();
  };

  const removeMaterial = async (id: number) => {
    await deleteMaterial(id);
    await fetchMaterials();
  };

  return { materials, loading, error, fetchMaterials, addMaterial, uploadNewMaterial, removeMaterial };
}