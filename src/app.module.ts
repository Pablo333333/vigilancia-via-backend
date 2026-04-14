import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ServeStaticModule } from '@nestjs/serve-static';
import * as path from 'path';
import { AuthModule } from './auth/auth.module';
import { ComunicadosModule } from './comunicados/comunicados.module';
import { PrismaModule } from './prisma/prisma.module';
import { ReportsModule } from './reports/reports.module';
import { UploadModule } from './upload/upload.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),

    // ServeStaticModule se mantiene para compatibilidad local si fuera necesario,
    // pero BACKEND_URL ahora se maneja vía ConfigService en otros lugares.
    ServeStaticModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const backendUrl = configService.get<string>('BACKEND_URL') || 'http://localhost:3000';
        // Las fotos ahora se cargan a Cloudinary, pero mantenemos la carpeta uploads local por si acaso.
        return [
          {
            rootPath: path.join(process.cwd(), 'uploads'),
            serveRoot: '/uploads',
            serveStaticOptions: {
              index: false,
              maxAge: '1d',
              setHeaders: (res) => {
                res.setHeader('Access-Control-Allow-Origin', '*');
              },
            },
          },
        ];
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
