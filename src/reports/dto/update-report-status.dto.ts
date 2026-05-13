import { IsEnum, IsOptional, IsString } from 'class-validator';
import { EstadoReporte } from '@prisma/client';

export class UpdateReportStatusDto {
  @IsEnum(EstadoReporte)
  estado: EstadoReporte;

  @IsOptional()
  @IsString()
  comentarioResolucion?: string;
}
