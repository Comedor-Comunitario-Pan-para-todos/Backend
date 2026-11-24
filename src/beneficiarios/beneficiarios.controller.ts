import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Logger,
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

import { ConsentimientoImagenDto } from '../consentimientos/dto/consentimiento-imagen.dto.js';
import { imagenAplicaParaEdad } from '../consentimientos/domain/consentimiento-imagen.js';
import { clasificarEdad } from './domain/edad-beneficiario.js';
import { AutorizacionTutorService } from '../consentimientos/application/autorizacion-tutor.service.js';
import type { AutorizacionTutorConOperadores } from '../consentimientos/domain/autorizacion-tutor.js';
import { AutorizacionTutorRespuestaDto } from '../consentimientos/dto/autorizacion-tutor.dto.js';

type SolicitudBeneficiario = {
  user: { id?: string; rol: { nombre: RolEnum } };
};

@ApiExtraModels(
  ConsentimientoRegistradoDto,
  ConsentimientoImagenDto,
  AutorizacionTutorRespuestaDto,
)
@ApiTags('Gestión de beneficiarios (Padrón)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(RolEnum.COORDINADORA, RolEnum.VOLUNTARIO)
@ApiResponse({ status: 401, description: 'No autenticado o token expirado' })
@ApiResponse({ status: 403, description: 'Acceso denegado: rol no autorizado' })
@Controller('beneficiarios')
export class BeneficiariosController {
  private readonly logger = new Logger(BeneficiariosController.name);

  constructor(
    private readonly beneficiariosService: BeneficiariosService,
    private readonly consentimientos: ConsentimientosService,
    private readonly tutores: AutorizacionTutorService,
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
    return this.presentarFicha(beneficiario, user);
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
    const ids = data.map(({ id }) => id);
    const [vigentes, imagenes, tutores] = await Promise.all([
      this.consentimientos.buscarVigentes(ids),
      this.consentimientos.buscarImagenesVigentes(ids),
      this.tutores.buscarActivas(
        data
          .filter(
            ({ fechaNacimiento }) =>
              clasificarEdad(fechaNacimiento) === 'menor',
          )
          .map(({ id }) => id),
      ),
    ]);
    const tutorPorBeneficiario = new Map(
      tutores.map((tutor) => [tutor.beneficiarioId, tutor]),
    );
    const imagenPorBeneficiario = new Map(
      imagenes.map((imagen) => [imagen.beneficiarioId, imagen]),
    );
    const porBeneficiario = new Map(
      vigentes.map((evidencia) => [evidencia.beneficiarioId, evidencia]),
    );
    return {
      data: data.map((ficha) =>
        this.proyectar(
          ficha,
          user,
          porBeneficiario.get(ficha.id) ?? null,
          imagenPorBeneficiario.get(ficha.id) ?? null,
          tutorPorBeneficiario.get(ficha.id) ?? null,
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
        ? await this.presentarFicha(beneficiario, user)
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
    return this.presentarFicha(beneficiario, user);
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
    return this.presentarFicha(beneficiario, user);
  }

  private async presentarFicha(
    beneficiario: Beneficiario,
    usuario: SolicitudBeneficiario['user'],
  ) {
    const ids = [beneficiario.id];
    const [[consentimiento], [imagen], [tutor]] = await Promise.all([
      this.consentimientos.buscarVigentes(ids),
      this.consentimientos.buscarImagenesVigentes(ids),
      clasificarEdad(beneficiario.fechaNacimiento) === 'menor'
        ? this.tutores.buscarActivas(ids)
        : [],
    ]);
    return this.proyectar(
      beneficiario,
      usuario,
      consentimiento ?? null,
      imagen ?? null,
      tutor ?? null,
    );
  }

  private proyectar(
    beneficiario: Beneficiario,
    usuario: SolicitudBeneficiario['user'],
    consentimiento: ConsentimientoConOperador | null,
    imagen: ConsentimientoConOperador | null,
    tutor: AutorizacionTutorConOperadores | null,
  ) {
    const {
      tipoDocumento,
      numeroDocumento,
      telefono,
      clasificacionSocioeconomica,
      ...datos
    } = beneficiario;
    const esMenorEdad =
      clasificarEdad(beneficiario.fechaNacimiento) === 'menor';
    const tutorActivo = esMenorEdad ? tutor : null;
    const coordinadora = usuario.rol.nombre === RolEnum.COORDINADORA;
    if (tutorActivo && coordinadora) {
      this.logger.log({
        evento: 'CONSULTA_DATOS_TUTOR',
        beneficiarioId: beneficiario.id,
        autorizacionId: tutorActivo.id,
        usuarioId: usuario.id,
        consultadoEn: new Date().toISOString(),
      });
    }
    const autorizacionTutor =
      tutorActivo &&
      (coordinadora
        ? tutorActivo
        : {
            id: tutorActivo.id,
            beneficiarioId: tutorActivo.beneficiarioId,
            estado: tutorActivo.estado,
            fechaAprobacion: tutorActivo.fechaAprobacion,
          });
    return {
      ...datos,
      ...(coordinadora
        ? {
            tipoDocumento,
            numeroDocumento,
            telefono,
            clasificacionSocioeconomica,
          }
        : {}),
      esMenorEdad,
      consentimiento,
      autorizacionTutor,
      consentimientoImagen:
        imagen &&
        imagenAplicaParaEdad(
          beneficiario.fechaNacimiento,
          imagen.autorizacionTutorId,
          tutorActivo?.id,
        )
          ? imagen
          : null,
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
