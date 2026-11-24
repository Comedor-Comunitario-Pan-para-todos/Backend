import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { RolEnum } from '../usuarios/enums/rol.enum.js';
import { RegistrarExcepcionEntregaUseCase } from './application/use-cases/registrar-excepcion-entrega.use-case.js';
import { ConsultarExcepcionesUseCase } from './application/use-cases/consultar-excepciones.use-case.js';
import { CrearExcepcionEntregaDto } from './dto/crear-excepcion-entrega.dto.js';
import {
  ExcepcionEntregaDto,
  RespuestaPaginadaExcepcionesDto,
} from './dto/excepcion-entrega.dto.js';
import { QueryExcepcionesDto } from './dto/query-excepciones.dto.js';

@ApiTags('Excepciones de Entrega (RF-07)')
@ApiBearerAuth()
@ApiUnauthorizedResponse({ description: 'No autenticado o token JWT no proporcionado' })
@ApiForbiddenResponse({ description: 'Acceso denegado: rol no autorizado' })
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('excepciones-entrega')
export class ExcepcionesEntregaController {
  constructor(
    private readonly registrarUseCase: RegistrarExcepcionEntregaUseCase,
    private readonly consultarUseCase: ConsultarExcepcionesUseCase,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Roles(RolEnum.COORDINADORA, RolEnum.VOLUNTARIO)
  @ApiOperation({
    summary: 'Registrar una entrega extraordinaria con justificación y autorizador (RF-07)',
    description:
      'Registra y justifica raciones extraordinarias (ración adicional o mercado para llevar) asociadas de forma única a un turno de atención, verificando que el usuario autorizador cuente con rol de COORDINADORA (HU-19, CU-11).',
  })
  @ApiCreatedResponse({
    description: 'Excepción de entrega registrada exitosamente',
    type: ExcepcionEntregaDto,
  })
  @ApiConflictResponse({
    description: 'Ya existe una excepción de entrega registrada para este turno',
  })
  @ApiNotFoundResponse({
    description: 'El turno de atención o el usuario autorizador no existen',
  })
  async registrar(@Body() dto: CrearExcepcionEntregaDto) {
    return this.registrarUseCase.execute(dto);
  }

  @Get()
  @Roles(RolEnum.COORDINADORA, RolEnum.VOLUNTARIO, RolEnum.PRESIDENTE_JAC)
  @ApiOperation({
    summary: 'Consultar listado paginado de excepciones de entrega',
    description:
      'Retorna el historial de entregas extraordinarias con soporte de filtros por tipo, rango de fechas y turno.',
  })
  @ApiOkResponse({
    description: 'Listado de excepciones obtenido correctamente',
    type: RespuestaPaginadaExcepcionesDto,
  })
  async consultar(@Query() query: QueryExcepcionesDto) {
    const desde = query.desde ? new Date(query.desde) : undefined;
    const hasta = query.hasta ? new Date(query.hasta) : undefined;

    return this.consultarUseCase.execute({
      page: query.page ?? 1,
      limit: query.limit ?? 10,
      tipoExcepcion: query.tipoExcepcion,
      desde,
      hasta,
      turnoId: query.turnoId,
    });
  }

  @Get('turno/:turnoId')
  @Roles(RolEnum.COORDINADORA, RolEnum.VOLUNTARIO, RolEnum.PRESIDENTE_JAC)
  @ApiOperation({
    summary: 'Consultar la excepción de entrega vinculada a un turno específico',
  })
  @ApiOkResponse({
    description: 'Excepción encontrada para el turno',
    type: ExcepcionEntregaDto,
  })
  @ApiNotFoundResponse({
    description: 'No existe excepción para este turno',
  })
  async consultarPorTurno(@Param('turnoId', ParseUUIDPipe) turnoId: string) {
    return this.consultarUseCase.findByTurnoId(turnoId);
  }

  @Get(':id')
  @Roles(RolEnum.COORDINADORA, RolEnum.VOLUNTARIO, RolEnum.PRESIDENTE_JAC)
  @ApiOperation({
    summary: 'Consultar una excepción de entrega por su identificador único',
  })
  @ApiOkResponse({
    description: 'Detalle de la excepción de entrega',
    type: ExcepcionEntregaDto,
  })
  @ApiNotFoundResponse({
    description: 'Excepción de entrega no encontrada',
  })
  async consultarPorId(@Param('id', ParseUUIDPipe) id: string) {
    return this.consultarUseCase.findById(id);
  }
}
