import {
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { multerOptions } from './upload.config';
import { UploadService } from './upload.service';

export interface UploadPhotoResponse {
  url: string;
  filename: string;
}

@UseGuards(JwtAuthGuard)
@Controller('upload')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  /**
   * POST /upload/photo
   *
   * Recibe un archivo en el campo "photo" (multipart/form-data).
   * Multer lo guarda en /uploads con un nombre único.
   * Devuelve la URL pública para almacenarla en el campo fotoUrl del Reporte.
   *
   * Ejemplo de respuesta:
   * {
   *   "url": "http://localhost:3000/uploads/1710000000000-123456.jpg",
   *   "filename": "1710000000000-123456.jpg"
   * }
   */
  @Post('photo')
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(FileInterceptor('photo', multerOptions))
  uploadPhoto(
    @UploadedFile() file: Express.Multer.File,
    @Req() req: Request,
  ): UploadPhotoResponse {
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const url = this.uploadService.buildPublicUrl(file.filename, baseUrl);

    return { url, filename: file.filename };
  }
}
