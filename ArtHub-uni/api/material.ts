import request from '@/utils/request';

const BASE_URL = 'http://localhost:3000';

export const createMaterial = (data : {
  title : string;
  description ?: string;
  tags ?: string;
  fileUrl : string;
}) => request({
  url: '/materials',
  method: 'POST',
  data,
  showLoading: false,
});

export const getMyMaterials = () => request({ url: '/materials', method: 'GET' });

export const uploadMaterial = (filePath : string, title ?: string) => {
  return new Promise((resolve, reject) => {
    uni.uploadFile({
      url: BASE_URL + '/materials/upload',
      filePath,
      name: 'file',
      formData: { title: title || '' },
      header: {
        Authorization: `Bearer ${uni.getStorageSync('token')}`,
      },
      success(res) {
        if (res.statusCode === 200) {
          resolve(JSON.parse(res.data));
        } else {
          reject(res);
        }
      },
      fail: reject,
    });
  });
};

export const deleteMaterial = (id : number) => request({ url: `/materials/${id}`, method: 'DELETE' });