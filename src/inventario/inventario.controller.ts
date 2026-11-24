import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { RolEnum } from '../usuarios/enums/rol.enum.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { ConsultarInventarioUseCase } from './application/use-cases/consultar-inventario.use-case.js';
import { RegistrarConsumoInsumoUseCase } from './application/use-cases/registrar-consumo-insumo.use-case.js';
import { RegistrarLoteInventarioUseCase } from './application/use-cases/registrar-lote-inventario.use-case.js';
import {
  CrearLoteInventarioDto,
  RegistrarConsumoInsumoDto,
} from './dto/crear-lote-inventario.dto.js';
import {
  LoteInventarioDto,
  RespuestaPaginadaInventarioDto,
} from './dto/lote-inventario.dto.js';
import { QueryInventarioDto } from './dto/query-inventario.dto.js';

@ApiTags('inventario')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('inventario')
export class InventarioController {
  constructor(
    private readonly registrarLoteUseCase: RegistrarLoteInventarioUseCase,
    private readonly consultarInventarioUseCase: ConsultarInventarioUseCase,
    private readonly registrarConsumoUseCase: RegistrarConsumoInsumoUseCase,
  ) {}

  @Post('lotes')
  @Roles(RolEnum.COORDINADORA, RolEnum.VOLUNTARIO)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Registrar nuevo lote de insumos con fecha de recepción y vencimiento obligatorias (RF-08)',
    description:
      'Permite registrar alimentos/insumos en bodega ingresando obligatoriamente fecha de recepción y fecha de vencimiento (que debe ser estrictamente posterior).',
  })
  @ApiResponse({
    status: 201,
    description: 'Lote de inventario registrado exitosamente',
    type: LoteInventarioDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Datos inválidos o fecha de vencimiento no es posterior a la de recepción',
  })
  @ApiResponse({
    status: 409,
    description: 'El código de lote ya existe en el sistema',
  })
  async registrarLote(
    @Body() dto: CrearLoteInventarioDto,
    @Request() req: any,
  ): Promise<LoteInventarioDto> {
    const usuarioId = req.user?.id ?? req.user?.sub ?? 'sistema';
    return this.registrarLoteUseCase.execute(dto, usuarioId);
  }

  @Get('lotes')
  @Roles(RolEnum.COORDINADORA, RolEnum.VOLUNTARIO, RolEnum.PRESIDENTE_JAC)
  @ApiOperation({
    summary: 'Consultar existencias y lotes de inventario con filtros y paginación (RF-08)',
    description:
      'Retorna los lotes de insumos ordenados por rotación FEFO (primeros en vencer), con filtros opcionales de insumo, categoría, estado o días próximos a vencer.',
  })
  @ApiResponse({
    status: 200,
    description: 'Listado paginado de lotes',
    type: RespuestaPaginadaInventarioDto,
  })
  async consultarLotes(
    @Query() query: QueryInventarioDto,
  ): Promise<RespuestaPaginadaInventarioDto> {
    return this.consultarInventarioUseCase.consultar(query);
  }

  @Get('lotes/:id')
  @Roles(RolEnum.COORDINADORA, RolEnum.VOLUNTARIO, RolEnum.PRESIDENTE_JAC)
  @ApiOperation({ summary: 'Consultar detalle de un lote de inventario por ID' })
  @ApiParam({ name: 'id', description: 'UUID del lote de inventario' })
  @ApiResponse({ status: 200, type: LoteInventarioDto })
  @ApiResponse({ status: 404, description: 'Lote no encontrado' })
  async consultarPorId(@Param('id') id: string): Promise<LoteInventarioDto> {
    return this.consultarInventarioUseCase.consultarPorId(id);
  }

  @Patch('lotes/:id/consumo')
  @Roles(RolEnum.COORDINADORA, RolEnum.VOLUNTARIO)
  @ApiOperation({
    summary: 'Registrar consumo o salida de insumo de un lote (RF-17)',
    description: 'Descuenta stock del lote y actualiza el estado a AGOTADO si llega a 0.',
  })
  @ApiParam({ name: 'id', description: 'UUID del lote' })
  @ApiResponse({ status: 200, type: LoteInventarioDto })
  @ApiResponse({ status: 400, description: 'Stock insuficiente o cantidad inválida' })
  @ApiResponse({ status: 404, description: 'Lote no encontrado' })
  async registrarConsumo(
    @Param('id') id: string,
    @Body() dto: RegistrarConsumoInsumoDto,
  ): Promise<LoteInventarioDto> {
    return this.registrarConsumoUseCase.execute(id, dto);
  }
}
