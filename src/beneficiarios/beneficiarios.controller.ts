import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { RolEnum } from '../auth/enums/rol.enum.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { BeneficiariosService } from './beneficiarios.service.js';
import { CreateBeneficiarioDto } from './dto/create-beneficiario.dto.js';
import { UpdateBeneficiarioDto } from './dto/update-beneficiario.dto.js';
import { QueryBeneficiariosDto } from './dto/query-beneficiarios.dto.js';

@ApiTags('Gestión de beneficiarios (Padrón)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(RolEnum.COORDINADORA, RolEnum.VOLUNTARIO)
@ApiResponse({ status: 401, description: 'No autenticado o token expirado' })
@ApiResponse({ status: 403, description: 'Acceso denegado: rol no autorizado' })
@Controller('beneficiarios')
export class BeneficiariosController {
  constructor(private readonly beneficiariosService: BeneficiariosService) {}

  @Post()
  @ApiOperation({ summary: 'Registrar un nuevo beneficiario (RF-01)' })
  @ApiResponse({ status: 201, description: 'Beneficiario registrado exitosamente' })
  @ApiResponse({ status: 400, description: 'Datos inválidos o faltantes' })
  @ApiResponse({ status: 409, description: 'El documento ya está registrado' })
  create(@Body() createBeneficiarioDto: CreateBeneficiarioDto) {
    return this.beneficiariosService.create(createBeneficiarioDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Listar y buscar beneficiarios en tiempo real con paginación (RF-01)',
  })
  @ApiResponse({ status: 200, description: 'Listado de beneficiarios obtenido exitosamente' })
  findAll(@Query() query: QueryBeneficiariosDto) {
    return this.beneficiariosService.findAll(query);
  }

  @Get('validar-documento/:numeroDocumento')
  @ApiOperation({
    summary: 'Validar rápidamente en tiempo real si un beneficiario ya existe (RF-01 Criterio 1)',
  })
  @ApiResponse({ status: 200, description: 'Resultado de la validación retornado exitosamente' })
  validarDocumento(@Param('numeroDocumento') numeroDocumento: string) {
    return this.beneficiariosService.validarDocumento(numeroDocumento);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Consultar detalle de un beneficiario por su ID' })
  @ApiResponse({ status: 200, description: 'Detalle del beneficiario' })
  @ApiResponse({ status: 404, description: 'Beneficiario no encontrado' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.beneficiariosService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar los datos de un beneficiario' })
  @ApiResponse({ status: 200, description: 'Beneficiario actualizado exitosamente' })
  @ApiResponse({ status: 404, description: 'Beneficiario no encontrado' })
  @ApiResponse({ status: 409, description: 'El nuevo documento ya está en uso' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateBeneficiarioDto: UpdateBeneficiarioDto,
  ) {
    return this.beneficiariosService.update(id, updateBeneficiarioDto);
  }

  @Delete(':id')
  @Roles(RolEnum.COORDINADORA) // Exclusivo de Coordinadora para desactivar registros
  @ApiOperation({ summary: 'Desactivar a un beneficiario (borrado lógico) - Exclusivo Coordinadora' })
  @ApiResponse({ status: 200, description: 'Beneficiario desactivado exitosamente' })
  @ApiResponse({ status: 403, description: 'Acceso denegado: solo Coordinadora puede desactivar' })
  @ApiResponse({ status: 404, description: 'Beneficiario no encontrado' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.beneficiariosService.remove(id);
  }
}
