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
  @ApiOperation({
    summary: 'Registrar un nuevo beneficiario con nivel básico o extendido (RF-01, RF-02)',
    description:
      'Permite registrar comensales con nivel BASICO (mínimo: nombres, apellidos, fecha nacimiento) o EXTENDIDO (con documento, teléfono y Sisbén). Aplica minimización de datos según Ley 1581.',
  })
  @ApiResponse({ status: 201, description: 'Beneficiario registrado exitosamente' })
  @ApiResponse({ status: 400, description: 'Datos inválidos o inconsistencia en nivel extendido' })
  @ApiResponse({ status: 409, description: 'El documento o datos básicos ya están registrados' })
  async create(
    @Body() createBeneficiarioDto: CreateBeneficiarioDto,
    @Req() { user }: { user: { id: string; rol: { nombre: RolEnum } } },
  ) {
    const beneficiario = await this.beneficiariosService.create(createBeneficiarioDto, user.id);
    if (user.rol.nombre === RolEnum.COORDINADORA) return beneficiario;

    const { numeroDocumento: _numeroDocumento, tipoDocumento: _tipoDocumento, clasificacionSocioeconomica: _clasificacionSocioeconomica, ...respuesta } = beneficiario;
    return respuesta;
  }

  @Get()
  @ApiOperation({
    summary: 'Listar y buscar beneficiarios en tiempo real con paginación y proyección por rol (RF-01, RF-02)',
  })
  @ApiResponse({ status: 200, description: 'Listado de beneficiarios obtenido exitosamente' })
  async findAll(@Query() query: QueryBeneficiariosDto, @Req() req?: any) {
    const res = await this.beneficiariosService.findAll(query);
    const rolNombre = req?.user?.rol?.nombre || req?.user?.rol;

    // Proyección de seguridad RNF-07: datos sensibles (ej. Sisbén) solo visibles para COORDINADORA
    if (rolNombre && rolNombre !== RolEnum.COORDINADORA) {
      res.data = res.data.map((b: any) => {
        const { clasificacionSocioeconomica, ...resto } = b;
        return resto;
      });
    }

    return res;
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
  @ApiOperation({ summary: 'Consultar detalle de un beneficiario por su ID (RF-01, RF-02)' })
  @ApiResponse({ status: 200, description: 'Detalle del beneficiario' })
  @ApiResponse({ status: 404, description: 'Beneficiario no encontrado' })
  async findOne(@Param('id', ParseUUIDPipe) id: string, @Req() req?: any) {
    const beneficiario = await this.beneficiariosService.findOne(id);
    const rolNombre = req?.user?.rol?.nombre || req?.user?.rol;

    if (rolNombre && rolNombre !== RolEnum.COORDINADORA) {
      const { clasificacionSocioeconomica, ...resto } = beneficiario as any;
      return resto;
    }

    return beneficiario;
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
