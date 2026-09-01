import React from 'react';
import type { MaterialData } from '@/lib/api/materials';

interface MaterialCardProps {
  material: MaterialData;
  onDelete?: (id: number) => void;
}

export const MaterialCard: React.FC<MaterialCardProps> = ({ material, onDelete }) => {
  return (
    <div className="card-quark overflow-hidden" style={{ padding: 0 }}>
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
          <span className="text-xs text-[var(--low-color)]">
            {material.fileSize ? `${(material.fileSize / 1024 / 1024).toFixed(1)} MB` : '未知大小'}
          </span>
          {onDelete && (
            <button
              onClick={() => onDelete(material.id)}
              className="text-xs text-[var(--com-color-warn)] hover:underline"
            >
              删除
            </button>
          )}
        </div>
      </div>
    </div>
  );
};