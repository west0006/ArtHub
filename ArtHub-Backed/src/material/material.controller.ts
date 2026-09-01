import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Req,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Query,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FileInterceptor } from '@nestjs/platform-express';
import { MaterialService } from './material.service';
import { Prisma } from '@prisma/client';
import type { AuthenticatedRequest } from '../types/express';
import multer from 'multer';
import { OssService } from '../oss/oss.service';
import * as fs from 'node:fs';

@Controller('materials')
// @UseGuards(AuthGuard('jwt'))
export class MaterialController {
  constructor(
    private materialService: MaterialService,
    private ossService: OssService,
  ) {}

  @Get()
  async getAll(@Req() req: AuthenticatedRequest) {
    const userId = req.user?.userId;
    if (userId) {
      return this.materialService.findByUser(userId);
    }
    return []; // 需添加公开查询
  }

  @Get('search')
  async search(
    @Req() req: AuthenticatedRequest,
    @Query('keyword') keyword: string,
    @Query('tag') tag?: string,
    @Query('copyright') copyright?: string,
  ) {
    return this.materialService.search({
      userId: req.user?.userId,
      keyword,
      tag,
      copyright,
    });
  }

  @Get(':id')
  async getOne(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.materialService.findById(+id, req.user?.userId);
  }

  @Post()
  @UseGuards(AuthGuard('jwt'))
  async createMaterial(
    @Req() req: AuthenticatedRequest,
    @Body()
    body: {
      title: string;
      description?: string;
      tags?: string;
      fileUrl: string;
      copyright?: string;
      sourcePlatform?: string;
      sourceUrl?: string;
    },
  ) {
    return this.materialService.create({
      title: body.title,
      description: body.description || '',
      tags: body.tags || '',
      fileUrl: body.fileUrl,
      copyright: body.copyright || 'unknown',
      sourcePlatform: body.sourcePlatform || 'manual',
      sourceUrl: body.sourceUrl || '',
      user: { connect: { id: req.user.userId } },
    });
  }

  @Post('upload')
  @UseGuards(AuthGuard('jwt'))
  @UseInterceptors(
    FileInterceptor('file', {
      storage: multer.diskStorage({
        destination: './uploads',
        filename: (req, file, cb) =>
          cb(null, `${Date.now()}-${file.originalname}`),
      }),
    }),
  )
  async upload(
    @Req() req: AuthenticatedRequest,
    @UploadedFile() file: Express.Multer.File,
    @Body()
    body: {
      title?: string;
      description?: string;
      tags?: string;
      copyright?: string;
    },
  ) {
    const ossPath = this.ossService.generatePath(file.originalname);
    const fileUrl = await this.ossService.upload(file.path, ossPath);
    fs.unlink(file.path, () => {});

    const material = await this.materialService.create({
      title: body.title || file.originalname,
      description: body.description || '',
      tags: body.tags || '',
      fileUrl,
      copyright: body.copyright || 'unknown',
      user: { connect: { id: req.user.userId } },
    });
    return material;
  }

  @Put(':id')
  @UseGuards(AuthGuard('jwt'))
  async update(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() body: Prisma.MaterialUpdateInput,
  ) {
    return this.materialService.update(+id, req.user.userId, body);
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'))
  async delete(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.materialService.delete(+id, req.user.userId);
  }
}
