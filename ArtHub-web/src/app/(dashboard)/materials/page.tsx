'use client';

import { useEffect, useState, useCallback } from 'react';
import { getMyMaterials, deleteMaterial } from '@/lib/api/materials';
import request from '@/lib/request';
import { uploadMaterial } from '@/lib/api/materials';

export default function MaterialsPage() {
  const [materials, setMaterials] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);

  const fetchMaterials = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await getMyMaterials();
      setMaterials(res.data);
    } catch (err: any) {
      setError('加载素材失败：' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchMaterials(); }, [fetchMaterials]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('title', file.name);
      await uploadMaterial(formData);
      fetchMaterials();
    } catch (err: any) {
      alert('上传失败：' + (err.response?.data?.message || err.message));
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('确定删除？')) return;
    try {
      await deleteMaterial(id);
      fetchMaterials();
    } catch (err: any) {
      alert('删除失败：' + (err.response?.data?.message || err.message));
    }
  };

  if (loading) return <div className="flex justify-center items-center h-64"><p className="text-[var(--com-text)]">加载中...</p></div>;
  if (error) return (
    <div className="flex flex-col items-center justify-center h-64 gap-4">
      <p className="text-red-500">{error}</p>
      <button onClick={fetchMaterials} className="btn-quark btn-quark-primary">重试</button>
    </div>
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-bold text-[var(--main-text)]">我的素材库</h2>
          <p className="text-sm text-[var(--com-text)]">共 {materials.length} 个素材</p>
        </div>
        <label className="btn-quark btn-quark-primary cursor-pointer">
          {uploading ? '上传中...' : '上传素材'}
          <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} disabled={uploading} />
        </label>
      </div>

      {materials.length === 0 ? (
        <div className="card-quark text-center py-12 text-[var(--low-color)]">
          <p className="mb-2">暂无素材</p>
          <p className="text-sm">点击右上角“上传素材”添加你的第一个素材</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {materials.map((material) => (
            <div key={material.id} className="card-quark overflow-hidden" style={{ padding: 0 }}>
              <img
                src={material.fileUrl || '/placeholder.png'}
                alt={material.title}
                className="w-full h-40 object-cover"
                onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder.png'; }}
              />
              <div className="p-3">
                <h3 className="font-medium truncate text-[var(--main-text)]">{material.title}</h3>
                <p className="text-xs text-[var(--com-text)] mt-1">
                  {material.tags ? material.tags.split(',').join(' · ') : '无标签'}
                </p>
                <div className="flex justify-between items-center mt-2">
                  <span className="text-xs text-[var(--low-color)]">{material.fileSize || '未知大小'}</span>
                  <button onClick={() => handleDelete(material.id)} className="text-[var(--com-color-warn)] text-sm hover:underline">删除</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}