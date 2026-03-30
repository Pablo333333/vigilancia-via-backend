import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ServeStaticModule } from '@nestjs/serve-static';
import * as path from 'path';
import { AuthModule } from './auth/auth.module';
import { ComunicadosModule } from './comunicados/comunicados.module';
import { PrismaModule } from './prisma/prisma.module';
import { ReportsModule } from './reports/reports.module';
import { UPLOADS_DIR, UPLOADS_SERVE_PATH } from './upload/upload.config';
import { UploadModule } from './upload/upload.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),

    // Sirve la carpeta /uploads como archivos estáticos bajo la ruta /uploads
    // Las fotos quedan accesibles en: http://localhost:3000/uploads/<filename>
    ServeStaticModule.forRoot({
      rootPath: path.join(process.cwd(), UPLOADS_DIR),
      serveRoot: UPLOADS_SERVE_PATH,
      serveStaticOptions: {
        // Deshabilita el listado del directorio por seguridad
        index: false,
        // Cache de 1 día en el cliente
        maxAge: '1d',
        // Permite acceso cross-origin (necesario para la app móvil)
        setHeaders: (res) => {
          res.setHeader('Access-Control-Allow-Origin', '*');
        },
      },
    }),

    PrismaModule,
    AuthModule,
    UsersModule,
    ReportsModule,
    ComunicadosModule,
    UploadModule,
  ],
})
export class AppModule {}
