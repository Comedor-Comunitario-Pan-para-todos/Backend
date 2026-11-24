import {
  ApiProperty,
  ApiPropertyOptional,
  getSchemaPath,
} from '@nestjs/swagger';
import { ConsentimientoRegistradoDto } from '../../consentimientos/dto/registrar-consentimiento.dto.js';
import { NivelRegistroEnum } from '../enums/nivel-registro.enum.js';

import { ConsentimientoImagenDto } from '../../consentimientos/dto/consentimiento-imagen.dto.js';

import { AutorizacionTutorRespuestaDto } from '../../consentimientos/dto/autorizacion-tutor.dto.js';

export class BeneficiarioRespuestaDto {
  @ApiProperty({ format: 'uuid' }) id: string;
  @ApiProperty({ enum: NivelRegistroEnum }) nivelRegistro: NivelRegistroEnum;
  @ApiProperty() nombres: string;
  @ApiProperty() apellidos: string;
  @ApiProperty({ format: 'date' }) fechaNacimiento: string;
  @ApiProperty() esMenorEdad: boolean;
  @ApiPropertyOptional({ type: String, nullable: true }) barrio?: string;
  @ApiPropertyOptional({
    type: String,
    nullable: true,
    description: 'Solo coordinadora',
  })
  tipoDocumento?: string;
  @ApiPropertyOptional({
    type: String,
    nullable: true,
    description: 'Solo coordinadora',
  })
  numeroDocumento?: string;
  @ApiPropertyOptional({
    type: String,
    nullable: true,
    description: 'Solo coordinadora',
  })
  telefono?: string;
  @ApiPropertyOptional({
    type: String,
    nullable: true,
    description: 'Solo coordinadora',
  })
  clasificacionSocioeconomica?: string;
  @ApiProperty() autorizaTratamientoDatos: boolean;
  @ApiProperty({ type: String, format: 'date-time' }) createdAt: Date;
  @ApiProperty({ type: String, format: 'date-time' }) updatedAt: Date;
  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true })
  deletedAt?: Date;

  @ApiProperty({
    allOf: [{ $ref: getSchemaPath(ConsentimientoRegistradoDto) }],
    nullable: true,
    description:
      'Última versión de la autorización de atención alimentaria, o null si está pendiente.',
  })
  consentimiento: ConsentimientoRegistradoDto | null;

  @ApiProperty({
    allOf: [{ $ref: getSchemaPath(ConsentimientoImagenDto) }],
    nullable: true,
    description:
      'Opt-in efectivo de imagen, o null cuando la captura y publicación deben permanecer bloqueadas.',
  })
  consentimientoImagen: ConsentimientoImagenDto | null;

  @ApiProperty({
    allOf: [{ $ref: getSchemaPath(AutorizacionTutorRespuestaDto) }],
    nullable: true,
    description:
      'Autorización activa de un menor, con datos personales visibles solo para Coordinadora.',
  })
  autorizacionTutor: AutorizacionTutorRespuestaDto | null;
}

export class PaginacionBeneficiariosDto {
  @ApiProperty() total: number;
  @ApiProperty() page: number;
  @ApiProperty() limit: number;
  @ApiProperty() totalPages: number;
}

export class BeneficiariosListadoDto {
  @ApiProperty({ type: [BeneficiarioRespuestaDto] })
  data: BeneficiarioRespuestaDto[];
  @ApiProperty({ type: PaginacionBeneficiariosDto })
  meta: PaginacionBeneficiariosDto;
}

export class ValidacionDocumentoDto {
  @ApiProperty() existe: boolean;

  @ApiProperty({
    allOf: [{ $ref: getSchemaPath(BeneficiarioRespuestaDto) }],
    nullable: true,
  })
  beneficiario: BeneficiarioRespuestaDto | null;
}
