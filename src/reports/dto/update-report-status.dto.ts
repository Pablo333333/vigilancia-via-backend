import { IsEnum, IsOptional, IsString } from 'class-validator';
import { EstadoReporte } from '../../../generated/prisma/client';

export class UpdateReportStatusDto {
  @IsEnum(EstadoReporte)
  estado: EstadoReporte;

  @IsOptional()
  @IsString()
  comentarioResolucion?: string;
}
