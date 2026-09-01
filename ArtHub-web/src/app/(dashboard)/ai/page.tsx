'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { aiChat, analyzeImage } from '@/lib/api/ai';

interface Message {
  id: string;
  role: 'user' | 'ai';
  content: string;
  image?: string; // base64 图像
}

export default function AiPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // 加载历史（暂用 localStorage）
  useEffect(() => {
    const saved = localStorage.getItem('ai_messages');
    if (saved) {
      try {
        setMessages(JSON.parse(saved));
      } catch {}
    }
  }, []);

  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem('ai_messages', JSON.stringify(messages.slice(-50))); // 最多保留 50 条
    }
  }, [messages]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text && !imageFile) return;

    let imageBase64 = '';
    if (imageFile) {
      imageBase64 = await fileToBase64(imageFile);
    }

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text || (imageFile ? '这张图片有什么特点？' : ''),
      image: imageBase64,
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setImageFile(null);
    setImagePreview(null);
    setLoading(true);

    try {
      let reply = '';
      if (imageBase64) {
        // 图像分析优先
        const res = await analyzeImage(imageBase64, text);
        reply = res.data?.reply || '图像分析完成';
      } else {
        const res = await aiChat(text);
        reply = res.data?.reply || '抱歉，AI 暂时无法响应。';
      }
      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'ai',
        content: reply,
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (err) {
      const errorMsg: Message = {
        id: (Date.now() + 2).toString(),
        role: 'ai',
        content: '抱歉，AI 服务暂时不可用。',
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleClear = () => {
    if (confirm('确定清空所有对话？')) {
      setMessages([]);
      localStorage.removeItem('ai_messages');
    }
  };

  return (
    <div className="max-w-3xl mx-auto bg-white rounded shadow">
      <div className="flex items-center justify-between p-4 border-b">
        <h1 className="text-xl font-bold">AI 助手</h1>
        <button onClick={handleClear} className="text-sm text-gray-500 hover:text-red-500">清空对话</button>
      </div>

      <div className="h-[500px] overflow-y-auto p-4 space-y-4 bg-gray-50">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] rounded-lg px-4 py-2 ${
              msg.role === 'user' ? 'bg-green-500 text-white' : 'bg-white border shadow-sm text-gray-800'
            }`}>
              {msg.image && (
                <img src={msg.image} alt="用户上传" className="max-w-48 rounded mb-2" />
              )}
              <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-white border shadow-sm rounded-lg px-4 py-2 text-gray-400 text-sm">
              正在思考...
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* 输入区域 */}
      <div className="border-t p-4">
        {imagePreview && (
          <div className="mb-2 relative inline-block">
            <img src={imagePreview} alt="预览" className="h-20 rounded" />
            <button
              onClick={() => { setImageFile(null); setImagePreview(null); }}
              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center"
            >×</button>
          </div>
        )}
        <div className="flex gap-2 items-end">
          <label className="flex-shrink-0 p-2 border rounded cursor-pointer hover:bg-gray-50">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
            </svg>
            <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
          </label>
          <textarea
            className="flex-1 border border-gray-300 rounded p-2 text-sm resize-none"
            rows={2}
            placeholder="输入消息或上传图片进行分析..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
          />
          <button
            onClick={handleSend}
            disabled={loading || (!input.trim() && !imageFile)}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            发送
          </button>
        </div>
      </div>
    </div>
  );
}