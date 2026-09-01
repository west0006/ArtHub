'use client';

import React, { useRef, useState } from 'react';

interface UploadProps {
  accept?: string;
  multiple?: boolean;
  onUpload: (files: File[]) => Promise<void>;
  children?: React.ReactNode;
  className?: string;
  disabled?: boolean;
}

export const Upload: React.FC<UploadProps> = ({
  accept = 'image/*',
  multiple = false,
  onUpload,
  children,
  className = '',
  disabled = false,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    setUploading(true);
    try {
      await onUpload(files);
    } finally {
      setUploading(false);
      if (inputRef.current) {
        inputRef.current.value = '';
      }
    }
  };

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        onChange={handleChange}
        disabled={disabled}
        className="hidden"
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={disabled || uploading}
        className={`btn-quark btn-quark-primary ${className}`}
      >
        {uploading ? '上传中...' : children || '上传文件'}
      </button>
    </>
  );
};