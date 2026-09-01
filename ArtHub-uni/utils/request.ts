// utils/request.ts
const BASE_URL = 'http://localhost:3000';

interface RequestOptions {
  url : string;
  method ?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  data ?: any;
  header ?: Record<string, string>;
  showLoading ?: boolean;
}

let isRefreshing = false;
let failedQueue : Array<{ resolve : Function; reject : Function }> = [];

const processQueue = (error : any, token : string | null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

const refreshAccessToken = () : Promise<string> => {
  const refreshToken = uni.getStorageSync('refreshToken');
  if (!refreshToken) throw new Error('No refresh token');

  return new Promise((resolve, reject) => {
    uni.request({
      url: BASE_URL + '/auth/refresh',
      method: 'POST',
      data: { refreshToken },
      header: { 'Content-Type': 'application/json' },
      success(res : any) {
        if (res.statusCode === 200 && res.data.accessToken) {
          uni.setStorageSync('token', res.data.accessToken);
          uni.setStorageSync('refreshToken', res.data.refreshToken);
          resolve(res.data.accessToken);
        } else {
          reject(new Error('Refresh failed'));
        }
      },
      fail: reject,
    });
  });
};

const request = (options : RequestOptions) : Promise<any> => {
  const shouldLoading = options.showLoading !== false;

  return new Promise((resolve, reject) => {
    const executeRequest = (token : string) => {
      const header : Record<string, string> = {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.header,
      };

      uni.request({
        url: BASE_URL + options.url,
        method: options.method || 'GET',
        data: options.data,
        header,
        success(res : any) {
          if (res.statusCode == 200 || res.statusCode == 201) {
            resolve(res.data);
          } else if (res.statusCode === 401) {
            if (!isRefreshing) {
              isRefreshing = true;
              refreshAccessToken()
                .then(newToken => {
                  processQueue(null, newToken);
                  executeRequest(newToken);
                })
                .catch(err => {
                  processQueue(err, null);
                  uni.removeStorageSync('token');
                  uni.removeStorageSync('refreshToken');
                  uni.removeStorageSync('userInfo');
                  uni.showToast({ title: '登录已过期，请重新登录', icon: 'none' });
                  uni.reLaunch({ url: '/pages/auth/login' });
                  reject(new Error('未登录'));
                })
                .finally(() => {
                  isRefreshing = false;
                });
            } else {
              failedQueue.push({
                resolve: (newToken : string) => executeRequest(newToken),
                reject,
              });
            }
          } else {
            uni.showToast({ title: res.data.message || '请求失败', icon: 'none' });
            reject(res.data);
          }
        },
        fail(err) {
          uni.showToast({ title: '网络异常', icon: 'none' });
          reject(err);
        },
      });
    };

    if (shouldLoading) {
      uni.showLoading({ title: '加载中...', mask: true });
    }

    const token = uni.getStorageSync('token') || '';
    executeRequest(token);
  }).finally(() => {
    if (shouldLoading) {
      uni.hideLoading();
    }
  });
};

export default request;