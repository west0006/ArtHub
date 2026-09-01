// lib/api/ai.ts
import request from '../request';

export const aiChat = (message: string, isSave = true): Promise<{ reply: string }> =>
    request.post('/ai/chat', { message, is_save: isSave }).then(res => res.data);

export const analyzeImage = (imageBase64: string, prompt?: string): Promise<{ reply: string }> =>
    request.post('/ai/analyze-image', { image: imageBase64, prompt }).then(res => res.data);