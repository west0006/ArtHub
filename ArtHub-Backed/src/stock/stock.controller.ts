import { Controller, Get, Query } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { ConfigService } from '@nestjs/config';

@Controller('stock')
export class StockController {
  constructor(
    private httpService: HttpService,
    private config: ConfigService,
  ) {}

  /**
   * 免费图库搜索代理（Unsplash / Pexels）
   * GET /stock/search?source=unsplash&query=cat&page=1&perPage=20
   */
  @Get('search')
  async search(
    @Query('source') source: 'unsplash' | 'pexels',
    @Query('query') query: string,
    @Query('page') page = 1,
    @Query('perPage') perPage = 20,
  ) {
    try {
      if (source === 'unsplash') {
        return await this.searchUnsplash(query, page, perPage);
      }
      if (source === 'pexels') {
        return await this.searchPexels(query, page, perPage);
      }
      return { results: [], total: 0 };
    } catch (error) {
      console.log(`Stock search failed for ${source}: ${error.message}`);
      return { results: [], total: 0 };
    }
  }

  private async searchUnsplash(query: string, page: number, perPage: number) {
    const accessKey = this.config.get('UNSPLASH_ACCESS_KEY');
    if (!accessKey) return { results: [], total: 0 };

    const { data } = await firstValueFrom(
      this.httpService.get('https://api.unsplash.com/search/photos', {
        params: { query, page, per_page: perPage },
        headers: { Authorization: `Client-ID ${accessKey}` },
      }),
    );

    return {
      total: data.total,
      results: data.results.map((img: any) => ({
        id: img.id,
        title: img.description || img.alt_description || 'Untitled',
        thumbnailUrl: img.urls.thumb,
        previewUrl: img.urls.small,
        fullUrl: img.urls.full,
        author: img.user?.name || 'Unknown',
        width: img.width,
        height: img.height,
        source: 'unsplash',
        sourceUrl: img.links?.html || '',
        license: 'Unsplash License (free)',
      })),
    };
  }

  private async searchPexels(query: string, page: number, perPage: number) {
    const apiKey = this.config.get('PEXELS_API_KEY');
    if (!apiKey) return { results: [], total: 0 };

    const { data } = await firstValueFrom(
      this.httpService.get('https://api.pexels.com/v1/search', {
        params: { query, page, per_page: perPage },
        headers: { Authorization: apiKey },
      }),
    );

    return {
      total: data.total_results,
      results: data.photos.map((img: any) => ({
        id: img.id,
        title: img.alt || 'Untitled',
        thumbnailUrl: img.src?.tiny || '',
        previewUrl: img.src?.medium || '',
        fullUrl: img.src?.original || '',
        author: img.photographer || 'Unknown',
        width: img.width,
        height: img.height,
        source: 'pexels',
        sourceUrl: img.url || '',
        license: 'Pexels License (free)',
      })),
    };
  }
}
