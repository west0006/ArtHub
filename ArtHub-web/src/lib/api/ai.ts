import request from '@/lib/request';

export const aiChat = (message: string) => request.post('/ai/chat', { message });

export const analyzeImage = (imageBase64: string, prompt?: string) =>
  request.post('/ai/analyze-image', { image: imageBase64, prompt });