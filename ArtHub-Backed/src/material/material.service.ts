import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { OssService } from '../oss/oss.service';

@Injectable()
export class MaterialService {
  constructor(
    private prisma: PrismaService,
    @Inject(OssService) private ossService: OssService,
  ) {}

  async findByUser(userId: number) {
    return this.prisma.material.findMany({
      where: { userId },
      orderBy: { createTime: 'desc' },
    });
  }

  async findById(id: number, userId: number) {
    const material = await this.prisma.material.findFirst({
      where: { id, userId },
    });
    if (!material) throw new NotFoundException('Material not found');
    return material;
  }

  async create(data: Prisma.MaterialCreateInput) {
    if (Array.isArray(data.tags)) {
      (data as any).tags = data.tags.join(',');
    }
    return this.prisma.material.create({ data });
  }

  async update(id: number, userId: number, data: Prisma.MaterialUpdateInput) {
    await this.findById(id, userId);
    if (Array.isArray(data.tags)) {
      (data as any).tags = data.tags.join(',');
    }
    return this.prisma.material.update({ where: { id }, data });
  }

  async delete(id: number, userId: number) {
    const material = await this.findById(id, userId);
    if (material.fileUrl) {
      // 解析出 OSS 路径
      const ossPath = this.extractOssPath(material.fileUrl);
      if (ossPath) {
        await this.ossService.delete(ossPath);
      }
    }
    return this.prisma.material.delete({ where: { id } });
  }

  private extractOssPath(url: string): string | null {
    try {
      const urlObj = new URL(url);
      // 如果自定义域名，路径即 OSS 路径
      return urlObj.pathname.substring(1); // 去掉开头的 '/'
    } catch {
      return null;
    }
  }
  async search(params: {
    userId?: number;
    keyword?: string;
    tag?: string;
    copyright?: string;
  }) {
    const where: Prisma.MaterialWhereInput = {};

    if (params.userId) {
      where.userId = params.userId;
    }

    if (params.keyword) {
      where.OR = [
        { title: { contains: params.keyword } },
        { description: { contains: params.keyword } },
        { tags: { contains: params.keyword } },
      ];
    }

    if (params.tag) {
      where.tags = { contains: params.tag };
    }

    if (params.copyright) {
      where.copyright = params.copyright;
    }

    return this.prisma.material.findMany({
      where,
      orderBy: { createTime: 'desc' },
      take: 50,
    });
  }
}
