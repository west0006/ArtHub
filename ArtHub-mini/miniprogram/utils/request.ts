const BASE_URL = 'http://localhost:3000';

interface RequestOptions {
  url: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  data?: any;
  header?: Record<string, string>;
  showLoading?: boolean;
}

// 并发刷新锁与队列
let isRefreshing = false;
let failedQueue: Array<{ resolve: Function; reject: Function }> = [];

const processQueue = (error: any, token: string | null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// 使用 refresh token 获取新 access token（内部调用，不显示 loading）
const refreshAccessToken = async (): Promise<string> => {
  const refreshToken = wx.getStorageSync('refreshToken');
  if (!refreshToken) throw new Error('No refresh token');

  return new Promise((resolve, reject) => {
    wx.request({
      url: BASE_URL + '/auth/refresh',
      method: 'POST',
      data: { refreshToken },
      header: { 'Content-Type': 'application/json' },
      success(res: any) {
        if (res.statusCode === 200 && res.data.accessToken) {
          wx.setStorageSync('token', res.data.accessToken);
          wx.setStorageSync('refreshToken', res.data.refreshToken);
          resolve(res.data.accessToken);
        } else {
          reject(new Error('Refresh failed'));
        }
      },
      fail: reject,
    });
  });
};

const request = (options: RequestOptions): Promise<any> => {
  // 是否需要在本次请求中显示 loading
  const shouldLoading = options.showLoading !== false;

  return new Promise((resolve, reject) => {
    const executeRequest = (token: string) => {
      const header: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.header,
      };

      wx.request({
        url: BASE_URL + options.url,
        method: options.method || 'GET',
        data: options.data,
        header,
        success(res: any) {
          if (res.statusCode == 200 || res.statusCode == 201) {
            resolve(res.data);
          
          } else if (res.statusCode === 401) {
            if (!isRefreshing) {
              isRefreshing = true;
              refreshAccessToken()
                .then((newToken) => {
                  processQueue(null, newToken);
                  // 刷新成功，用新 token 重试原请求
                  executeRequest(newToken);
                })
                .catch((err) => {
                  processQueue(err, null);
                  wx.removeStorageSync('token');
                  wx.removeStorageSync('refreshToken');
                  wx.removeStorageSync('userInfo');
                  wx.showToast({ title: '登录已过期，请重新登录', icon: 'none' });
                  wx.reLaunch({ url: '/pages/login/login' });
                  reject(new Error('未登录'));
                })
                .finally(() => {
                  isRefreshing = false;
                });
            } else {
              // 正在刷新，将当前请求加入等待队列
              failedQueue.push({
                resolve: (newToken: string) => executeRequest(newToken),
                reject,
              });
            }
          } else {
            wx.showToast({ title: res.data.message || '请求失败', icon: 'none' });
            reject(res.data);
          }
        },
        fail(err) {
          wx.showToast({ title: '网络异常', icon: 'none' });
          reject(err);
        },
      });
    };

    // 只有需要 loading 的请求才显示，且整个请求（包括重试）只显示一次
    if (shouldLoading) {
      wx.showLoading({ title: '加载中...', mask: true });
    }

    const token = wx.getStorageSync('token') || '';
    executeRequest(token);
  }).finally(() => {
    // 无论成功、失败还是 token 刷新清退，最终都要隐藏 loading
    if (shouldLoading) {
      wx.hideLoading();
    }
  });
};

export default request;