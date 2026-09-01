// lib/request
import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { Storage } from './storage';
import { router } from 'expo-router';

const BASE_URL = 'http://localhost:3000'; // 替换为实际后端地址

const apiClient = axios.create({
    baseURL: BASE_URL,
    timeout: 30000,
    headers: {
        'Content-Type': 'application/json',
    },
});

// 请求拦截器：自动附加 access token
apiClient.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
        const token = Storage.get('accessToken');
        if (token && config.headers) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// 响应拦截器：401 时尝试刷新 token
let isRefreshing = false;
let failedQueue: Array<{
    resolve: (token: string) => void;
    reject: (error: any) => void;
}> = [];

const processQueue = (error: any, token: string | null) => {
    failedQueue.forEach((promise) => {
        if (error) {
            promise.reject(error);
        } else {
            promise.resolve(token!);
        }
    });
    failedQueue = [];
};

apiClient.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
        const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

        // 如果不是 401 或者已经重试过，直接抛出
        if (error.response?.status !== 401 || originalRequest._retry) {
            return Promise.reject(error);
        }

        // 如果正在刷新，将请求加入队列
        if (isRefreshing) {
            return new Promise<string>((resolve, reject) => {
                failedQueue.push({
                    resolve: (token: string) => {
                        originalRequest.headers.Authorization = `Bearer ${token}`;
                        resolve(apiClient.request(originalRequest));
                    },
                    reject,
                });
            });
        }

        originalRequest._retry = true;
        isRefreshing = true;

        const refreshTokenValue = Storage.get('refreshToken');
        if (!refreshTokenValue) {
            isRefreshing = false;
            Storage.clearAll();
            router.replace('/(auth)/login');
            return Promise.reject(error);
        }

        try {
            const { data } = await axios.post(`${BASE_URL}/auth/refresh`, {
                refreshToken: refreshTokenValue,
            });

            const newAccessToken = data.accessToken;
            const newRefreshToken = data.refreshToken;

            Storage.set('accessToken', newAccessToken);
            Storage.set('refreshToken', newRefreshToken);

            originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
            processQueue(null, newAccessToken);

            return apiClient.request(originalRequest);
        } catch (refreshError) {
            processQueue(refreshError, null);
            isRefreshing = false;
            Storage.clearAll();
            router.replace('/(auth)/login');
            return Promise.reject(refreshError);
        } finally {
            isRefreshing = false;
        }
    }
);

export default apiClient;