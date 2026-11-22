import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { RolEnum } from '../usuarios/enums/rol.enum.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { TurnosService } from './turnos.service.js';
import { CreateTurnoDto } from './dto/create-turno.dto.js';
import { QueryTurnosDto } from './dto/query-turnos.dto.js';
import { CancelarTurnoDto } from './dto/cancelar-turno.dto.js';

@ApiTags('Gestión de turnos y filas (Reja)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(RolEnum.COORDINADORA, RolEnum.VOLUNTARIO)
@ApiResponse({ status: 401, description: 'No autenticado o token expirado' })
@ApiResponse({ status: 403, description: 'Acceso denegado: rol no autorizado' })
@Controller('turnos')
export class TurnosController {
  constructor(private readonly turnosService: TurnosService) {}

  @Post()
  @ApiOperation({
    summary: 'Emitir número de turno consecutivo para la fila de atención (RF-03, HU-26, HU-27)',
    description:
      'Genera un nuevo tiquete correlativo diario partiendo desde 1 para el beneficiario verificado. Si ya cuenta con turno en el día, rechaza con 409 Conflict.',
  })
  @ApiResponse({ status: 201, description: 'Turno emitido exitosamente' })
  @ApiResponse({ status: 400, description: 'Datos del turno inválidos' })
  @ApiResponse({ status: 404, description: 'Beneficiario no encontrado en el padrón central' })
  @ApiResponse({
    status: 409,
    description: 'El beneficiario ya cuenta con turno asignado en la jornada de hoy (Prevención duplicados HU-27)',
  })
  emitirTurno(@Body() dto: CreateTurnoDto, @Req() req: any) {
    const usuarioId = req.user?.id;
    return this.turnosService.emitirTurno(dto, usuarioId);
  }

  @Get()
  @ApiOperation({
    summary: 'Listar y monitorear turnos en fila de la jornada (RF-03)',
    description: 'Permite consultar la fila por fecha y estado (por defecto fecha de hoy).',
  })
  @ApiResponse({ status: 200, description: 'Listado de turnos obtenido exitosamente' })
  findAll(@Query() query: QueryTurnosDto) {
    return this.turnosService.findAll(query);
  }

  @Get('beneficiario/:beneficiarioId/hoy')
  @ApiOperation({
    summary: 'Consultar turno asignado hoy a un beneficiario (Reimpresión o verificación en reja)',
  })
  @ApiResponse({ status: 200, description: 'Turno del beneficiario para la jornada de hoy o null si no tiene' })
  findHoyPorBeneficiario(@Param('beneficiarioId', ParseUUIDPipe) beneficiarioId: string) {
    return this.turnosService.findHoyPorBeneficiario(beneficiarioId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Consultar detalle de un turno por su ID' })
  @ApiResponse({ status: 200, description: 'Detalle del turno' })
  @ApiResponse({ status: 404, description: 'Turno no encontrado' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.turnosService.findOne(id);
  }

  @Patch(':id/atender')
  @ApiOperation({ summary: 'Marcar turno como atendido cuando el comensal ingresa a comedor' })
  @ApiResponse({ status: 200, description: 'Turno marcado como atendido exitosamente' })
  @ApiResponse({ status: 400, description: 'El turno no está en estado EN_ESPERA' })
  @ApiResponse({ status: 404, description: 'Turno no encontrado' })
  marcarAtendido(@Param('id', ParseUUIDPipe) id: string) {
    return this.turnosService.marcarAtendido(id);
  }

  @Patch(':id/cancelar')
  @ApiOperation({ summary: 'Cancelar un turno por retiro voluntario o novedad' })
  @ApiResponse({ status: 200, description: 'Turno cancelado exitosamente' })
  @ApiResponse({ status: 400, description: 'No se puede cancelar un turno ya atendido' })
  @ApiResponse({ status: 404, description: 'Turno no encontrado' })
  cancelar(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CancelarTurnoDto,
  ) {
    return this.turnosService.cancelar(id, dto);
  }
}
