'use client';

import { useState } from 'react';
import request from '@/lib/request';

export default function ImportPage() {
  const [rawText, setRawText] = useState('');
  const [importing, setImporting] = useState(false);
  const [results, setResults] = useState<string[]>([]);
  const [preview, setPreview] = useState<string[]>([]);

  // 显示文本预览
  const handleTextChange = (value: string) => {
    setRawText(value);
    const lines = value.split('\n').filter(l => l.trim());
    setPreview(lines.slice(0, 5)); // 最多预览5行
  };

  const handleTextImport = async () => {
    if (!rawText.trim()) return;
    setImporting(true);
    setResults([]);
    try {
      const res = await request.post('/import/text', { rawText });
      setResults([`文本导入成功，订单 ID：${res.data.id}`]);
      setRawText('');
      setPreview([]);
    } catch (err: any) {
      setResults([`文本导入失败：${err.response?.data?.message || err.message}`]);
    } finally {
      setImporting(false);
    }
  };

  const handleJsonImport = async () => {
    const sampleData = {
      title: '导入示例',
      platform: 'manual',
      platformOrderId: Date.now().toString(),
      clientName: '示例客户',
      price: 200,
      totalAmount: 200,
      deadline: new Date().toISOString().slice(0, 10),
      status: 'pending',
    };
    setImporting(true);
    setResults([]);
    try {
      const res = await request.post('/import/json', sampleData);
      setResults([`JSON 导入成功，订单 ID：${res.data.id || res.data.order?.id}`]);
    } catch (err: any) {
      setResults([`JSON 导入失败：${err.response?.data?.message || err.message}`]);
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">导入订单</h1>

      <div className="bg-white rounded shadow p-6">
        <h2 className="text-lg font-medium mb-4">文本导入</h2>
        <textarea
          className="w-full border border-gray-300 rounded p-2 mb-2"
          rows={6}
          placeholder="粘贴订单文本，例如：\n【夏日头像】预算：500元 描述：二次元风格，截稿：2026-06-01"
          value={rawText}
          onChange={(e) => handleTextChange(e.target.value)}
        />
        {preview.length > 0 && (
          <div className="bg-gray-50 p-3 rounded mb-2 text-sm text-gray-600">
            <p className="font-medium mb-1">文本预览：</p>
            {preview.map((line, i) => (
              <p key={i} className="truncate">{line}</p>
            ))}
            {rawText.split('\n').filter(l => l.trim()).length > 5 && (
              <p className="text-gray-400 mt-1">... 共 {rawText.split('\n').filter(l => l.trim()).length} 行</p>
            )}
          </div>
        )}
        <button
          onClick={handleTextImport}
          disabled={importing || !rawText.trim()}
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:bg-gray-400"
        >
          {importing ? '导入中...' : '文本导入'}
        </button>
      </div>

      <div className="bg-white rounded shadow p-6">
        <h2 className="text-lg font-medium mb-2">JSON 导入</h2>
        <p className="text-sm text-gray-600 mb-4">使用预设示例数据快速验证导入流程</p>
        <button
          onClick={handleJsonImport}
          disabled={importing}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:bg-gray-400"
        >
          {importing ? '导入中...' : 'JSON 导入'}
        </button>
      </div>

      {results.length > 0 && (
        <div className="bg-gray-50 rounded p-4 text-sm space-y-1">
          {results.map((r, i) => (
            <p key={i} className={r.includes('成功') ? 'text-green-700' : 'text-red-600'}>{r}</p>
          ))}
        </div>
      )}
    </div>
  );
}