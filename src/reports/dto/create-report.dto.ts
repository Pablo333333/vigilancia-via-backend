import { Transform } from 'class-transformer';
import { IsBoolean, IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';
import { TipoProblema } from '../../../generated/prisma/client';

export class CreateReportDto {
  @IsEnum(TipoProblema)
  tipoProblema: TipoProblema;

  @IsOptional()
  @IsString()
  comentario?: string;

  /**
   * Latitud llega como string desde FormData multipart.
   * @Transform la convierte a number antes de la validación.
   */
  @Transform(({ value }) => (value != null ? parseFloat(value as string) : value))
  @IsNumber()
  latitud: number;

  /**
   * Longitud llega como string desde FormData multipart.
   * @Transform la convierte a number antes de la validación.
   */
  @Transform(({ value }) => (value != null ? parseFloat(value as string) : value))
  @IsNumber()
  longitud: number;

  /**
   * Indica que el reporte se creó offline y se está sincronizando ahora.
   * El servidor registrará la fecha de sincronización en sincronizadoEn.
   */
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  esOffline?: boolean;
}
