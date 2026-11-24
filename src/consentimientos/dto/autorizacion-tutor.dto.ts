import {
  ApiProperty,
  ApiPropertyOptional,
  getSchemaPath,
} from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsEnum,
  IsNotEmpty,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';
import {
  EstadoAutorizacionTutor,
  ParentescoTutor,
  TipoDocumentoTutor,
  type DatosTutor,
} from '../domain/autorizacion-tutor.js';
import { OperadorConsentimientoDto } from './registrar-consentimiento.dto.js';

function limpiar({ value }: { value: unknown }) {
  return typeof value === 'string' ? value.trim() : value;
}

export class RegistrarAutorizacionTutorDto implements DatosTutor {
  @ApiProperty({ maxLength: 150 })
  @Transform(limpiar)
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  nombreTutor: string;

  @ApiProperty({ enum: TipoDocumentoTutor })
  @IsEnum(TipoDocumentoTutor)
  tipoDocumentoTutor: TipoDocumentoTutor;

  @ApiProperty({ maxLength: 30 })
  @Transform(limpiar)
  @IsString()
  @Matches(/^[a-zA-Z0-9-]{1,30}$/)
  numeroDocumentoTutor: string;

  @ApiProperty({ enum: ParentescoTutor })
  @IsEnum(ParentescoTutor)
  parentesco: ParentescoTutor;

  @ApiProperty({ maxLength: 20 })
  @Transform(limpiar)
  @IsString()
  @Matches(/^\+?[0-9][0-9 ()-]{5,18}[0-9]$/)
  telefonoTutor: string;
}

export class RegistrarTutorMultipartDto extends RegistrarAutorizacionTutorDto {
  @ApiProperty({
    type: String,
    format: 'binary',
    description: 'Documento firmado en PDF, JPG o PNG. Máximo 5 MiB.',
  })
  soporte: unknown;
}

export class RevocarAutorizacionTutorDto {
  @ApiProperty({ minLength: 1, maxLength: 255 })
  @Transform(limpiar)
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  motivo: string;
}

export class AutorizacionTutorRespuestaDto {
  @ApiProperty({ format: 'uuid' }) id: string;
  @ApiProperty({ format: 'uuid' }) beneficiarioId: string;
  @ApiProperty({ enum: EstadoAutorizacionTutor })
  estado: EstadoAutorizacionTutor;
  @ApiProperty({ type: String, format: 'date-time' }) fechaAprobacion: Date;
  @ApiPropertyOptional({ description: 'Solo Coordinadora' })
  nombreTutor?: string;
  @ApiPropertyOptional({ enum: TipoDocumentoTutor })
  tipoDocumentoTutor?: TipoDocumentoTutor;
  @ApiPropertyOptional() numeroDocumentoTutor?: string;
  @ApiPropertyOptional({ enum: ParentescoTutor }) parentesco?: ParentescoTutor;
  @ApiPropertyOptional() telefonoTutor?: string;
  @ApiPropertyOptional({ format: 'uuid' }) aprobadaPorId?: string;
  @ApiPropertyOptional({ type: OperadorConsentimientoDto })
  aprobadaPor?: OperadorConsentimientoDto;
  @ApiPropertyOptional() soporteTipoMime?: string;
  @ApiPropertyOptional({ type: 'integer' }) soporteTamanoBytes?: number;
  @ApiPropertyOptional({ format: 'uuid', type: String, nullable: true })
  revocadaPorId?: string | null;
  @ApiPropertyOptional({
    allOf: [{ $ref: getSchemaPath(OperadorConsentimientoDto) }],
    nullable: true,
  })
  revocadaPor?: OperadorConsentimientoDto | null;
  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true })
  fechaRevocacion?: Date | null;
  @ApiPropertyOptional({ type: String, nullable: true }) motivoRevocacion?:
    string | null;
}
