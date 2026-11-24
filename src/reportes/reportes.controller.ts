import { Controller, Get, Header, Query, Req, UseGuards } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiProperty,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Matches } from 'class-validator';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { RolEnum } from '../usuarios/enums/rol.enum.js';
import { ReporteGestionService } from './application/reporte-gestion.service.js';

const PERIODO = /^(?!9999-12$)[1-9][0-9]{3}-(0[1-9]|1[0-2])$/;
class ConsultaReporteDto {
  @ApiProperty({
    pattern: PERIODO.source,
    example: '2026-11',
    description: 'Mes de gestión en formato AAAA-MM',
  })
  @Matches(PERIODO)
  periodo: string;
}

class AsistenciaDiariaDto {
  @ApiProperty({ format: 'date' }) fecha: string;
  @ApiProperty({ type: 'integer' }) turnosEmitidos: number;
  @ApiProperty({ type: 'integer' }) turnosAtendidos: number;
}

class DescartePorUnidadDto {
  @ApiProperty() unidadMedida: string;
  @ApiProperty() cantidad: number;
}

class ReporteGestionDto {
  @ApiProperty({ example: '2026-11' }) periodo: string;
  @ApiProperty({ type: 'integer' }) turnosEmitidos: number;
  @ApiProperty({
    type: 'integer',
    description: 'Total de turnos en estado ATENDIDO',
  })
  turnosAtendidos: number;
  @ApiProperty({
    type: 'integer',
    description: 'Días con al menos un turno atendido',
  })
  diasAtencion: number;
  @ApiProperty({ type: 'integer' }) descartesRegistrados: number;
  @ApiProperty({ type: 'integer' }) actasAutorizadas: number;
  @ApiProperty({ type: [AsistenciaDiariaDto] })
  asistenciaDiaria: AsistenciaDiariaDto[];
  @ApiProperty({ type: [DescartePorUnidadDto] })
  descartesPorUnidad: DescartePorUnidadDto[];
  @ApiProperty({
    type: 'array',
    items: { type: 'object' },
    maxItems: 0,
    description:
      'Vacía mientras el backend carezca de una fuente de fotografías verificadas para publicación',
  })
  fotos: [];
}

@ApiTags('Reportes de gestión')
@ApiBearerAuth()
@ApiUnauthorizedResponse()
@ApiForbiddenResponse()
@ApiBadRequestResponse()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(RolEnum.COORDINADORA, RolEnum.PRESIDENTE_JAC)
@Controller('reportes')
export class ReportesController {
  constructor(private readonly servicio: ReporteGestionService) {}

  @Get('gestion')
  @Header('Cache-Control', 'no-store')
  @ApiOkResponse({ type: ReporteGestionDto })
  consultar(
    @Query() { periodo }: ConsultaReporteDto,
    @Req() { user }: { user: { id: string } },
  ) {
    return this.servicio.consultar(periodo, user.id);
  }
}
