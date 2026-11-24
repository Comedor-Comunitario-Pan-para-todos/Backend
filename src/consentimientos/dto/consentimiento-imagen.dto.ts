import {
  ApiProperty,
  ApiPropertyOptional,
  OmitType,
  getSchemaPath,
} from '@nestjs/swagger';
import {
  Equals,
  IsBoolean,
  IsEnum,
  IsInt,
  Max,
  Min,
  ValidateIf,
} from 'class-validator';
import {
  FINALIDAD_USO_IMAGEN,
  MetodoConsentimiento,
} from '../domain/consentimiento.js';
import {
  ConsentimientoRegistradoDto,
  OperadorConsentimientoDto,
  RegistrarConsentimientoDto,
} from './registrar-consentimiento.dto.js';

export class RegistrarSolicitudConsentimientoDto extends OmitType(
  RegistrarConsentimientoDto,
  ['aceptado', 'metodo', 'versionTexto'] as const,
) {
  @ApiPropertyOptional({
    type: Boolean,
    enum: [true],
    description: 'Obligatorio al usar versionTexto.',
  })
  @ValidateIf((_dto, valor: unknown) => valor !== undefined)
  @Equals(true)
  aceptado?: true;

  @ApiPropertyOptional({ type: 'integer', minimum: 1, maximum: 2147483647 })
  @ValidateIf((_dto, valor: unknown) => valor !== undefined)
  @IsInt()
  @Min(1)
  @Max(2147483647)
  versionTexto?: number;

  @ApiPropertyOptional({
    type: 'integer',
    minimum: 1,
    maximum: 2147483647,
    description:
      'Para USO_IMAGEN. En el formato abreviado el consentimiento se registra como verbal con testigo.',
  })
  @ValidateIf((_dto, valor: unknown) => valor !== undefined)
  @IsInt()
  @Min(1)
  @Max(2147483647)
  versionPolitica?: number;

  @ApiPropertyOptional({
    enum: MetodoConsentimiento,
    description:
      'Obligatorio al usar versionTexto. Solo se registra el método declarado.',
  })
  @ValidateIf((_dto, valor: unknown) => valor !== undefined)
  @IsEnum(MetodoConsentimiento)
  metodo?: MetodoConsentimiento;
}

export class RevocarImagenDto {
  @ApiProperty({ enum: [FINALIDAD_USO_IMAGEN] })
  @Equals(FINALIDAD_USO_IMAGEN)
  finalidad: typeof FINALIDAD_USO_IMAGEN;
}

export class HistorialImagenQueryDto extends RevocarImagenDto {}

export class ActualizarImagenDto {
  @ApiProperty({ type: Boolean })
  @IsBoolean()
  autorizado: boolean;

  @ApiPropertyOptional({
    type: 'integer',
    minimum: 1,
    maximum: 2147483647,
    description: 'Obligatorio para opt-in.',
  })
  @ValidateIf(
    (dto: ActualizarImagenDto, valor: unknown) =>
      dto.autorizado === true || valor !== undefined,
  )
  @IsInt()
  @Min(1)
  @Max(2147483647)
  versionPolitica?: number;
}

export class ConsentimientoImagenDto extends ConsentimientoRegistradoDto {
  @ApiProperty({ enum: [FINALIDAD_USO_IMAGEN] })
  declare finalidad: typeof FINALIDAD_USO_IMAGEN;

  @ApiProperty({ type: 'integer', minimum: 1 })
  versionPolitica: number;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt: Date;

  @ApiProperty({
    allOf: [{ $ref: getSchemaPath(OperadorConsentimientoDto) }],
    nullable: true,
  })
  revocadoPor: OperadorConsentimientoDto | null;

  @ApiProperty({ type: String, format: 'date-time', nullable: true })
  revocadoEn: Date | null;

  @ApiProperty({
    type: Boolean,
    description:
      'Vigencia del registro. El estado efectivo para la ficha se obtiene de consentimientoImagen.',
  })
  vigente: boolean;
}
