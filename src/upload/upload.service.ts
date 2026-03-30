import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { UPLOADS_DIR, UPLOADS_SERVE_PATH } from './upload.config';

@Injectable()
export class UploadService {
  private readonly logger = new Logger(UploadService.name);

  /**
   * Construye la URL pública de acceso al archivo subido.
   *
   * Ejemplo:
   *   filename: "1710000000000-123456.jpg"
   *   → baseUrl: "http://localhost:3000"
   *   → result:  "http://localhost:3000/uploads/1710000000000-123456.jpg"
   *
   * @param filename - Nombre del archivo ya guardado en disco por Multer.
   * @param baseUrl  - URL base del servidor (sin trailing slash).
   */
  buildPublicUrl(filename: string, baseUrl: string): string {
    return `${baseUrl}${UPLOADS_SERVE_PATH}/${filename}`;
  }

  /**
   * Elimina un archivo subido a partir de su nombre.
   * No lanza error si el archivo no existe (operación idempotente).
   */
  async deleteFile(filename: string): Promise<void> {
    const filePath = path.join(process.cwd(), UPLOADS_DIR, filename);
    try {
      await fs.promises.unlink(filePath);
      this.logger.log(`Archivo eliminado: ${filename}`);
    } catch (err: unknown) {
      const code = (err as NodeJS.ErrnoException).code;
      if (code !== 'ENOENT') {
        this.logger.error(`Error al eliminar ${filename}`, err);
        throw new InternalServerErrorException('Error al eliminar el archivo');
      }
    }
  }
}
