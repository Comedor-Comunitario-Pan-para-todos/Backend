import { Body, Controller, Get, Put, Req, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiProperty,
  ApiExtraModels,
  ApiTags,
  ApiUnauthorizedResponse,
  getSchemaPath,
  ApiBadRequestResponse,
} from '@nestjs/swagger';
import {
  IsInt,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { RolEnum } from '../usuarios/enums/rol.enum.js';
import { RetencionService } from './application/retencion.service.js';
import { EventoRetencion } from './domain/retencion.js';

class PlazosRetencionDto {
  @ApiProperty({ type: 'integer', minimum: 1, maximum: 36500, example: 730 })
  @IsInt()
  @Min(1)
  @Max(36500)
  diasBasicos: number;

  @ApiProperty({ type: 'integer', minimum: 1, maximum: 36500, example: 365 })
  @IsInt()
  @Min(1)
  @Max(36500)
  diasSensibles: number;
}

class ActualizarRetencionDto extends PlazosRetencionDto {
  @ApiProperty({
    format: 'password',
    writeOnly: true,
    description: 'Contraseña actual de la Coordinadora',
  })
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  password: string;
}

class PoliticaRetencionDto extends PlazosRetencionDto {
  @ApiProperty({ format: 'uuid' }) actualizadaPorId: string;
  @ApiProperty({ type: String, format: 'date-time' }) actualizadaEn: Date;
}

class EventoRetencionDto {
  @ApiProperty({ format: 'uuid' }) id: string;
  @ApiProperty({
    enum: [EventoRetencion.CAMBIO_POLITICA, EventoRetencion.VERIFICACION],
  })
  evento: EventoRetencion;
  @ApiProperty({ type: String, format: 'uuid', nullable: true }) operadorId:
    string | null;
  @ApiProperty({ type: String, format: 'date-time' }) registradoEn: Date;
  @ApiProperty({
    allOf: [{ $ref: getSchemaPath(PlazosRetencionDto) }],
    nullable: true,
  })
  anterior: PlazosRetencionDto | null;
  @ApiProperty({
    allOf: [{ $ref: getSchemaPath(PlazosRetencionDto) }],
    nullable: true,
  })
  vigente: PlazosRetencionDto | null;
  @ApiProperty({ type: 'integer', nullable: true }) basicosPendientes:
    number | null;
  @ApiProperty({ type: 'integer', nullable: true }) sensiblesPendientes:
    number | null;
}

class ConsultaRetencionDto {
  @ApiProperty({
    allOf: [{ $ref: getSchemaPath(PoliticaRetencionDto) }],
    nullable: true,
  })
  politica: PoliticaRetencionDto | null;
  @ApiProperty({
    type: [EventoRetencionDto],
    description:
      'Hasta 100 eventos de configuración y verificación, del más reciente al más antiguo',
  })
  historial: EventoRetencionDto[];
}

@ApiTags('Retención')
@ApiBearerAuth()
@ApiExtraModels(PlazosRetencionDto, PoliticaRetencionDto)
@ApiUnauthorizedResponse()
@ApiForbiddenResponse({
  description: 'Rol no autorizado o contraseña incorrecta al actualizar',
})
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(RolEnum.COORDINADORA)
@Controller('retencion')
export class RetencionController {
  constructor(private readonly service: RetencionService) {}

  @Get()
  @ApiOkResponse({ type: ConsultaRetencionDto })
  consultar(@Req() { user }: { user: { id: string } }) {
    return this.service.consultar(user.id);
  }

  @Put()
  @ApiBadRequestResponse({
    description: 'Los plazos deben ser enteros positivos',
  })
  @ApiOkResponse({ type: PoliticaRetencionDto })
  actualizar(
    @Body() { password, diasBasicos, diasSensibles }: ActualizarRetencionDto,
    @Req() { user }: { user: { id: string } },
  ) {
    return this.service.actualizar(
      { diasBasicos, diasSensibles },
      user.id,
      password,
    );
  }
}
