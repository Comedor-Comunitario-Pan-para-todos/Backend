import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Logger,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiExtraModels,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
  getSchemaPath,
} from '@nestjs/swagger';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { RolEnum } from '../usuarios/enums/rol.enum.js';
import { ConsentimientosService } from './application/consentimientos.service.js';
import {
  FINALIDAD_USO_IMAGEN,
  MetodoConsentimiento,
} from './domain/consentimiento.js';
import {
  ActualizarImagenDto,
  ConsentimientoImagenDto,
  HistorialImagenQueryDto,
  RegistrarSolicitudConsentimientoDto,
  RevocarImagenDto,
} from './dto/consentimiento-imagen.dto.js';
import { ConsentimientoRegistradoDto } from './dto/registrar-consentimiento.dto.js';

type Solicitud = { user: { id: string } };

const esquemaRegistro = {
  anyOf: [
    { $ref: getSchemaPath(ConsentimientoRegistradoDto) },
    { $ref: getSchemaPath(ConsentimientoImagenDto) },
  ],
};

@ApiTags('Consentimientos')
@ApiBearerAuth()
@ApiExtraModels(ConsentimientoRegistradoDto, ConsentimientoImagenDto)
@ApiUnauthorizedResponse()
@ApiForbiddenResponse()
@ApiBadRequestResponse()
@ApiNotFoundResponse({
  description:
    'Beneficiario inexistente o desactivado, o sin consentimiento vigente al revocar',
})
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(RolEnum.VOLUNTARIO, RolEnum.COORDINADORA)
@Controller('beneficiarios/:id')
export class ConsentimientosController {
  private readonly logger = new Logger(ConsentimientosController.name);

  constructor(private readonly service: ConsentimientosService) {}

  @Post('consentimiento')
  @ApiOperation({
    summary:
      'Registrar consentimiento informado o autorizar uso de imagen (RF-19, RF-20)',
  })
  @ApiCreatedResponse({ schema: esquemaRegistro })
  @ApiOkResponse({
    schema: esquemaRegistro,
    description: 'Devuelve la autorización vigente sin crear otro registro',
  })
  @ApiConflictResponse({
    description:
      'REQUIERE_TUTOR si el uso de imagen está bloqueado por minoría de edad',
  })
  async registrar(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RegistrarSolicitudConsentimientoDto,
    @Req() { user }: Solicitud,
    @Res({ passthrough: true }) response: { status(code: number): unknown },
  ) {
    const abreviado =
      dto.finalidad === FINALIDAD_USO_IMAGEN &&
      dto.versionPolitica !== undefined;
    if (
      dto.versionPolitica !== undefined &&
      (!abreviado ||
        (dto.versionTexto !== undefined &&
          dto.versionPolitica !== dto.versionTexto))
    ) {
      throw new BadRequestException(
        'versionPolitica solo aplica a USO_IMAGEN y debe coincidir con versionTexto si se envían ambas',
      );
    }
    const versionTexto = dto.versionTexto ?? dto.versionPolitica;
    const metodo =
      dto.metodo ??
      (abreviado ? MetodoConsentimiento.VERBAL_CON_TESTIGO : undefined);
    if (
      versionTexto === undefined ||
      metodo === undefined ||
      (!abreviado && dto.aceptado !== true)
    ) {
      throw new BadRequestException(
        'Se requiere versión, método y aceptación explícita',
      );
    }
    const resultado = await this.service.registrar(
      id,
      {
        aceptado: true,
        versionTexto,
        metodo,
        finalidad: dto.finalidad,
      },
      user.id,
    );
    if (!resultado.creado) response.status(HttpStatus.OK);
    return resultado.consentimiento;
  }

  @Post('consentimiento/revocacion')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Revocar el permiso vigente de uso de imagen (RF-20)',
  })
  @ApiOkResponse({ type: ConsentimientoImagenDto })
  revocar(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() _dto: RevocarImagenDto,
    @Req() { user }: Solicitud,
  ) {
    return this.service.revocarImagen(id, user.id);
  }

  @Get('consentimientos')
  @ApiOperation({ summary: 'Consultar el historial de uso de imagen (RF-20)' })
  @ApiOkResponse({ type: [ConsentimientoImagenDto] })
  async historial(
    @Param('id', ParseUUIDPipe) id: string,
    @Query() _query: HistorialImagenQueryDto,
    @Req() { user }: Solicitud,
  ) {
    const historial = await this.service.historialImagen(id);
    this.logger.log({
      evento: 'CONSULTA_HISTORIAL_IMAGEN',
      beneficiarioId: id,
      usuarioId: user.id,
      consultadoEn: new Date().toISOString(),
    });
    return historial;
  }

  @Put('consentimiento-imagen')
  @ApiOperation({
    summary: 'Autorizar o revocar el permiso de uso de imagen (RF-20)',
  })
  @ApiOkResponse({ type: ConsentimientoImagenDto })
  @ApiConflictResponse({
    description:
      'REQUIERE_TUTOR si el uso de imagen está bloqueado por minoría de edad',
  })
  actualizarImagen(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ActualizarImagenDto,
    @Req() { user }: Solicitud,
  ) {
    if (!dto.autorizado) return this.service.revocarImagen(id, user.id);
    if (dto.versionPolitica === undefined)
      throw new BadRequestException('El opt-in requiere versionPolitica');
    return this.service
      .registrar(
        id,
        {
          aceptado: true,
          versionTexto: dto.versionPolitica,
          metodo: MetodoConsentimiento.VERBAL_CON_TESTIGO,
          finalidad: FINALIDAD_USO_IMAGEN,
        },
        user.id,
      )
      .then(({ consentimiento }) => consentimiento);
  }
}
