import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EstadoReporte, Reporte, Rol } from '../../generated/prisma/client';
import type { JwtPayload } from '../auth/strategies/jwt.strategy';
import { NotificationsService } from '../notifications/notifications.service';
import { PrismaService } from '../prisma/prisma.service';
import { UploadService } from '../upload/upload.service';
import { CreateReportDto } from './dto/create-report.dto';
import { UpdateReportStatusDto } from './dto/update-report-status.dto';

@Injectable()
export class ReportsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly uploadService: UploadService,
    private readonly notificationsService: NotificationsService,
  ) {}

  /**
   * Crea un nuevo reporte y notifica a todos los usuarios RESPONSABLE
   * que tengan un pushToken registrado.
   * Si el reporte proviene de la cola offline, registra sincronizadoEn.
   */
  async create(
    dto: CreateReportDto,
    foto: Express.Multer.File | undefined,
    usuario: JwtPayload,
    baseUrl: string,
  ): Promise<Reporte> {
    const fotoUrl = foto
      ? this.uploadService.buildPublicUrl(foto.filename, baseUrl)
      : undefined;

    const { esOffline, ...reportData } = dto;

    const reporte = await this.prisma.reporte.create({
      data: {
        ...reportData,
        fotoUrl,
        reportanteId: usuario.sub,
        ...(esOffline && { sincronizadoEn: new Date() }),
      },
    });

    // Notificar en segundo plano — no bloquea la respuesta al cliente
    this.notifyResponsables(reporte.id, dto.tipoProblema).catch(() => null);

    return reporte;
  }

  private async notifyResponsables(reporteId: string, tipoProblema: string): Promise<void> {
    const responsables = await this.prisma.usuario.findMany({
      where: { rol: Rol.RESPONSABLE, pushToken: { not: null } },
      select: { pushToken: true },
    });

    const tokens = responsables
      .map((u) => u.pushToken)
      .filter((t): t is string => t !== null);

    if (tokens.length === 0) return;

    await this.notificationsService.sendPushNotifications(
      tokens,
      'Nuevo reporte en la vía',
      `Tipo: ${tipoProblema.replace(/_/g, ' ')}. Revisá el mapa.`,
      { reporteId },
    );
  }

  async findAll(estado?: EstadoReporte, userRol?: Rol): Promise<Reporte[]> {
    const isReportante = userRol === Rol.REPORTANTE;

    // REPORTANTE solo puede ver PENDIENTE y EN_PROCESO
    if (isReportante) {
      const permitidos = [EstadoReporte.PENDIENTE, EstadoReporte.EN_PROCESO] as EstadoReporte[];
      const estadoFinal = estado && permitidos.includes(estado) ? estado : undefined;
      return this.prisma.reporte.findMany({
        where: { estado: estadoFinal ?? { in: permitidos } },
        include: { reportante: { omit: { password: true } } },
        orderBy: { fechaCreacion: 'desc' },
      });
    }

    return this.prisma.reporte.findMany({
      where: estado ? { estado } : undefined,
      include: { reportante: { omit: { password: true } } },
      orderBy: { fechaCreacion: 'desc' },
    });
  }

  async getStats(): Promise<{
    total: number;
    pendiente: number;
    enProceso: number;
    solucionado: number;
  }> {
    const [total, pendiente, enProceso, solucionado] = await Promise.all([
      this.prisma.reporte.count(),
      this.prisma.reporte.count({ where: { estado: EstadoReporte.PENDIENTE } }),
      this.prisma.reporte.count({ where: { estado: EstadoReporte.EN_PROCESO } }),
      this.prisma.reporte.count({ where: { estado: EstadoReporte.SOLUCIONADO } }),
    ]);
    return { total, pendiente, enProceso, solucionado };
  }

  async findOne(id: string): Promise<Reporte> {
    const reporte = await this.prisma.reporte.findUnique({
      where: { id },
      include: { reportante: { omit: { password: true } } },
    });

    if (!reporte) throw new NotFoundException(`Reporte con id ${id} no encontrado`);

    return reporte;
  }

  async updateStatus(
    id: string,
    dto: UpdateReportStatusDto,
    fotoEvidencia: Express.Multer.File | undefined,
    usuario: JwtPayload,
    baseUrl: string,
  ): Promise<Reporte> {
    const reporte = await this.prisma.reporte.findUnique({ where: { id } });

    if (!reporte) throw new NotFoundException(`Reporte con id ${id} no encontrado`);

    if (usuario.rol !== Rol.RESPONSABLE) {
      throw new ForbiddenException('Solo los responsables pueden actualizar el estado de un reporte');
    }

    const fotoEvidenciaUrl = fotoEvidencia
      ? this.uploadService.buildPublicUrl(fotoEvidencia.filename, baseUrl)
      : undefined;

    return this.prisma.reporte.update({
      where: { id },
      data: {
        estado: dto.estado,
        ...(dto.comentarioResolucion && { comentarioResolucion: dto.comentarioResolucion }),
        ...(fotoEvidenciaUrl && { fotoEvidenciaUrl }),
      },
    });
  }

  async findMine(usuarioId: string): Promise<Reporte[]> {
    return this.prisma.reporte.findMany({
      where: { reportanteId: usuarioId },
      orderBy: { fechaCreacion: 'desc' },
    });
  }
}
