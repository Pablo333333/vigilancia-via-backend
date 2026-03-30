import { BadRequestException } from '@nestjs/common';
import type { Options as MulterOptions } from 'multer';
import * as multer from 'multer';
import * as path from 'path';

/** Carpeta destino relativa a la raíz del proyecto (process.cwd()) */
export const UPLOADS_DIR = 'uploads';

/** Ruta URL bajo la que se sirven los archivos estáticos */
export const UPLOADS_SERVE_PATH = '/uploads';

/** Tamaño máximo de archivo: 5 MB */
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;

/** Tipos MIME aceptados */
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, path.join(process.cwd(), UPLOADS_DIR));
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e6)}${ext}`;
    cb(null, uniqueName);
  },
});

function fileFilter(
  _req: Express.Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback,
): void {
  if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new BadRequestException(
        `Tipo de archivo no permitido: ${file.mimetype}. Solo se aceptan: JPEG, PNG, WebP.`,
      ),
    );
  }
}

export const multerOptions: MulterOptions = {
  storage,
  fileFilter,
  limits: { fileSize: MAX_FILE_SIZE_BYTES },
};
