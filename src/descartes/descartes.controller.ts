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
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
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
import { ConsultarDescartesUseCase } from './application/use-cases/consultar-descartes.use-case.js';
import { RegistrarDescarteUseCase } from './application/use-cases/registrar-descarte.use-case.js';
import { CrearDescarteDto } from './dto/crear-descarte.dto.js';
import {
  DescarteDto,
  RespuestaPaginadaDescartesDto,
} from './dto/descarte.dto.js';
import { QueryDescartesDto } from './dto/query-descartes.dto.js';

@ApiTags('Descartes de Alimentos')
@ApiBearerAuth()
@ApiUnauthorizedResponse({ description: 'No autenticado o token JWT no proporcionado' })
@ApiForbiddenResponse({ description: 'Acceso denegado: rol no autorizado' })
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('descartes')
export class DescartesController {
  constructor(
    private readonly registrarUseCase: RegistrarDescarteUseCase,
    private readonly consultarUseCase: ConsultarDescartesUseCase,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Roles(RolEnum.COORDINADORA)
  @ApiOperation({
    summary: 'Registrar un nuevo descarte de alimentos (Exclusivo Coordinadora)',
    description:
      'Registra la baja justificada de alimentos en el comedor indicando cantidad, motivo, evaluador y la autorización expresa de la Coordinadora (RF-05).',
  })
  @ApiCreatedResponse({
    description: 'Descarte registrado exitosamente',
    type: DescarteDto,
  })
  crear(@Body() dto: CrearDescarteDto, @Req() req: any) {
    return this.registrarUseCase.execute(dto, req.user);
  }

  @Get()
  @Roles(RolEnum.COORDINADORA, RolEnum.VOLUNTARIO, RolEnum.PRESIDENTE_JAC)
  @ApiOperation({
    summary: 'Listar descartes de alimentos registrados con filtros y paginación',
  })
  @ApiOkResponse({
    description: 'Listado de descartes obtenido exitosamente',
    type: RespuestaPaginadaDescartesDto,
  })
  listar(@Query() query: QueryDescartesDto) {
    return this.consultarUseCase.executeListar(query);
  }

  @Get(':id')
  @Roles(RolEnum.COORDINADORA, RolEnum.VOLUNTARIO, RolEnum.PRESIDENTE_JAC)
  @ApiOperation({ summary: 'Obtener el detalle de un descarte por su ID' })
  @ApiOkResponse({
    description: 'Detalle del descarte encontrado',
    type: DescarteDto,
  })
  @ApiNotFoundResponse({ description: 'Descarte no encontrado' })
  obtenerPorId(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.consultarUseCase.executeObtenerPorId(id);
  }
}
