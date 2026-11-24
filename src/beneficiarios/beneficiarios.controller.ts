import {
  BadRequestException,
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
  ApiExtraModels,
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

import { ConsentimientosService } from '../consentimientos/application/consentimientos.service.js';
import type { ConsentimientoConOperador } from '../consentimientos/domain/consentimiento-repository.port.js';
import { ConsentimientoRegistradoDto } from '../consentimientos/dto/registrar-consentimiento.dto.js';
import type { Beneficiario } from './entities/beneficiario.entity.js';
import {
  BeneficiarioRespuestaDto,
  BeneficiariosListadoDto,
  ValidacionDocumentoDto,
} from './dto/beneficiario-respuesta.dto.js';

type SolicitudBeneficiario = { user: { rol: { nombre: RolEnum } } };

@ApiExtraModels(ConsentimientoRegistradoDto)
@ApiTags('Gestión de beneficiarios (Padrón)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(RolEnum.COORDINADORA, RolEnum.VOLUNTARIO)
@ApiResponse({ status: 401, description: 'No autenticado o token expirado' })
@ApiResponse({ status: 403, description: 'Acceso denegado: rol no autorizado' })
@Controller('beneficiarios')
export class BeneficiariosController {
  constructor(
    private readonly beneficiariosService: BeneficiariosService,
    private readonly consentimientos: ConsentimientosService,
  ) {}

  @Post()
  @ApiOperation({
    summary:
      'Registrar un nuevo beneficiario con nivel básico o extendido (RF-01, RF-02)',
    description:
      'Permite registrar comensales con nivel BASICO (mínimo: nombres, apellidos, fecha nacimiento) o EXTENDIDO (con documento, teléfono y Sisbén). Aplica minimización de datos según Ley 1581.',
  })
  @ApiResponse({
    status: 201,
    type: BeneficiarioRespuestaDto,
    description: 'Beneficiario registrado exitosamente',
  })
  @ApiResponse({
    status: 400,
    description: 'Datos inválidos o inconsistencia en nivel extendido',
  })
  @ApiResponse({
    status: 409,
    description: 'El documento o datos básicos ya están registrados',
  })
  async create(
    @Body() createBeneficiarioDto: CreateBeneficiarioDto,
    @Req() { user }: { user: { id: string; rol: { nombre: RolEnum } } },
  ) {
    const { nivel, clasificacion, ...datos } = createBeneficiarioDto;
    if (nivel && datos.nivelRegistro && datos.nivelRegistro !== nivel) {
      throw new BadRequestException('nivel y nivelRegistro deben coincidir');
    }
    const grupo =
      clasificacion?.sistema === 'RUI' ? 'RUI' : clasificacion?.grupo;
    if (
      grupo &&
      datos.clasificacionSocioeconomica &&
      datos.clasificacionSocioeconomica !== grupo
    ) {
      throw new BadRequestException(
        'Las clasificaciones enviadas deben coincidir',
      );
    }
    if (nivel) datos.nivelRegistro = nivel;
    if (grupo) datos.clasificacionSocioeconomica = grupo;

    const beneficiario = await this.beneficiariosService.create(datos, user.id);
    return this.presentarFicha(beneficiario, user.rol.nombre);
  }

  @Get()
  @ApiOperation({
    summary:
      'Listar y buscar beneficiarios en tiempo real con paginación y proyección por rol (RF-01, RF-02)',
  })
  @ApiResponse({
    status: 200,
    type: BeneficiariosListadoDto,
    description: 'Listado de beneficiarios obtenido exitosamente',
  })
  async findAll(
    @Query() query: QueryBeneficiariosDto,
    @Req() { user }: SolicitudBeneficiario,
  ) {
    const { data, meta } = await this.beneficiariosService.findAll(query);
    const vigentes = await this.consentimientos.buscarVigentes(
      data.map(({ id }) => id),
    );
    const porBeneficiario = new Map(
      vigentes.map((evidencia) => [evidencia.beneficiarioId, evidencia]),
    );
    return {
      data: data.map((ficha) =>
        this.proyectar(
          ficha,
          user.rol.nombre,
          porBeneficiario.get(ficha.id) ?? null,
        ),
      ),
      meta,
    };
  }

  @Get('validar-documento/:numeroDocumento')
  @ApiOperation({
    summary:
      'Validar rápidamente en tiempo real si un beneficiario ya existe (RF-01 Criterio 1)',
  })
  @ApiResponse({
    status: 200,
    type: ValidacionDocumentoDto,
    description: 'Resultado de la validación retornado exitosamente',
  })
  async validarDocumento(
    @Param('numeroDocumento') numeroDocumento: string,
    @Req() { user }: SolicitudBeneficiario,
  ) {
    const { existe, beneficiario } =
      await this.beneficiariosService.validarDocumento(numeroDocumento);
    return {
      existe,
      beneficiario: beneficiario
        ? await this.presentarFicha(beneficiario, user.rol.nombre)
        : null,
    };
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Consultar detalle de un beneficiario por su ID (RF-01, RF-02)',
  })
  @ApiResponse({
    status: 200,
    type: BeneficiarioRespuestaDto,
    description: 'Detalle del beneficiario',
  })
  @ApiResponse({ status: 404, description: 'Beneficiario no encontrado' })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() { user }: SolicitudBeneficiario,
  ) {
    const beneficiario = await this.beneficiariosService.findOne(id);
    return this.presentarFicha(beneficiario, user.rol.nombre);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar los datos de un beneficiario' })
  @ApiResponse({
    status: 200,
    type: BeneficiarioRespuestaDto,
    description: 'Beneficiario actualizado exitosamente',
  })
  @ApiResponse({ status: 404, description: 'Beneficiario no encontrado' })
  @ApiResponse({
    status: 409,
    description: 'El nuevo documento ya está en uso',
  })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateBeneficiarioDto: UpdateBeneficiarioDto,
    @Req() { user }: SolicitudBeneficiario,
  ) {
    const beneficiario = await this.beneficiariosService.update(
      id,
      updateBeneficiarioDto,
    );
    return this.presentarFicha(beneficiario, user.rol.nombre);
  }

  private async presentarFicha(beneficiario: Beneficiario, rol: RolEnum) {
    const [consentimiento] = await this.consentimientos.buscarVigentes([
      beneficiario.id,
    ]);
    return this.proyectar(beneficiario, rol, consentimiento ?? null);
  }

  private proyectar(
    beneficiario: Beneficiario,
    rol: RolEnum,
    consentimiento: ConsentimientoConOperador | null,
  ) {
    const {
      tipoDocumento,
      numeroDocumento,
      telefono,
      clasificacionSocioeconomica,
      ...datos
    } = beneficiario;
    return {
      ...datos,
      ...(rol === RolEnum.COORDINADORA
        ? {
            tipoDocumento,
            numeroDocumento,
            telefono,
            clasificacionSocioeconomica,
          }
        : {}),
      consentimiento,
    };
  }

  @Delete(':id')
  @Roles(RolEnum.COORDINADORA) // Exclusivo de Coordinadora para desactivar registros
  @ApiOperation({
    summary:
      'Desactivar a un beneficiario (borrado lógico) - Exclusivo Coordinadora',
  })
  @ApiResponse({
    status: 200,
    description: 'Beneficiario desactivado exitosamente',
  })
  @ApiResponse({
    status: 403,
    description: 'Acceso denegado: solo Coordinadora puede desactivar',
  })
  @ApiResponse({ status: 404, description: 'Beneficiario no encontrado' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.beneficiariosService.remove(id);
  }
}
