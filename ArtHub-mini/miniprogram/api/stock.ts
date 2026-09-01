import request from '../utils/request';

export interface StockImage {
  id: string;
  title: string;
  thumbnailUrl: string;
  previewUrl: string;
  fullUrl: string;
  author: string;
  width: number;
  height: number;
  source: 'unsplash' | 'pexels';
  sourceUrl: string;
  license: string;
}

export const searchStock = (source: 'unsplash' | 'pexels', query: string, page = 1, perPage = 20) =>
  request({
    url: `/stock/search?source=${source}&query=${query}&page=${page}&perPage=${perPage}`,
    method: 'GET',
    showLoading: false,
  });