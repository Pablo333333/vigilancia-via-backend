import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { EstadoReporte, Rol } from '../../generated/prisma/client';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import type { JwtPayload } from '../auth/strategies/jwt.strategy';
import { multerOptions } from '../upload/upload.config';
import { CreateReportDto } from './dto/create-report.dto';
import { UpdateReportStatusDto } from './dto/update-report-status.dto';
import { ReportsService } from './reports.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  // POST /reports — Cualquier usuario autenticado puede crear reportes
  @Post()
  @Roles(Rol.REPORTANTE, Rol.RESPONSABLE, Rol.SUPERVISOR)
  @UseInterceptors(FileInterceptor('foto', multerOptions))
  create(
    @Body() dto: CreateReportDto,
    @UploadedFile() foto: Express.Multer.File | undefined,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.reportsService.create(dto, foto, user);
  }

  // GET /reports?estado=... — Todos los autenticados; REPORTANTE no ve SOLUCIONADO
  @Get()
  findAll(
    @Query('estado') estado?: EstadoReporte,
    @CurrentUser() user?: JwtPayload,
  ) {
    return this.reportsService.findAll(estado, user?.rol);
  }

  // GET /reports/mine — Solo REPORTANTE: sus propios reportes
  @Get('mine')
  @Roles(Rol.REPORTANTE)
  findMine(@CurrentUser() user: JwtPayload) {
    return this.reportsService.findMine(user.sub);
  }

  /**
   * GET /reports/stats
   *
   * Dashboard de estadísticas agregadas.
   * Restringido a RESPONSABLE y SUPERVISOR — devuelve 403 para REPORTANTE.
   */
  @Get('stats')
  @Roles(Rol.RESPONSABLE, Rol.SUPERVISOR)
  getStats() {
    return this.reportsService.getStats();
  }

  // GET /reports/:id
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.reportsService.findOne(id);
  }

  /**
   * PATCH /reports/:id/status
   *
   * Solo RESPONSABLE puede cambiar el estado de un reporte.
   * SUPERVISOR tiene perfil de solo lectura — 403 si intenta usar este endpoint.
   */
  @Patch(':id/status')
  @Roles(Rol.RESPONSABLE)
  @UseInterceptors(FileInterceptor('fotoEvidencia', multerOptions))
  updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateReportStatusDto,
    @UploadedFile() fotoEvidencia: Express.Multer.File | undefined,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.reportsService.updateStatus(id, dto, fotoEvidencia, user);
  }
}
