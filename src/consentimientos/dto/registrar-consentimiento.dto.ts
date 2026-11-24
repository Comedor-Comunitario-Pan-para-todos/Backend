import { ApiProperty } from '@nestjs/swagger';

import { Equals, IsEnum, IsIn, IsInt, Min, Max } from 'class-validator';
import {
  FINALIDADES_CONSENTIMIENTO,
  type FinalidadConsentimiento,
  MetodoConsentimiento,
  type AceptacionConsentimiento,
} from '../domain/consentimiento.js';

export class RegistrarConsentimientoDto implements AceptacionConsentimiento {
  @ApiProperty({ type: Boolean, enum: [true], example: true })
  @Equals(true, {
    message: 'Se requiere la aceptación explícita del consentimiento',
  })
  aceptado: boolean;

  @ApiProperty({ type: 'integer', minimum: 1, maximum: 2147483647, example: 1 })
  @IsInt()
  @Min(1)
  @Max(2147483647)
  versionTexto: number;

  @ApiProperty({ enum: [...FINALIDADES_CONSENTIMIENTO] })
  @IsIn(FINALIDADES_CONSENTIMIENTO)
  finalidad: FinalidadConsentimiento;

  @ApiProperty({
    enum: MetodoConsentimiento,
    description:
      'Método declarado, obligatorio y sin valor por defecto. Solo se registra el método; no se reciben ni almacenan firmas, huellas o documentos.',
  })
  @IsEnum(MetodoConsentimiento)
  metodo: MetodoConsentimiento;
}

export class OperadorConsentimientoDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ type: String, nullable: true })
  nombreCompleto: string | null;
}

export class ConsentimientoRegistradoDto extends RegistrarConsentimientoDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ format: 'uuid' })
  beneficiarioId: string;

  @ApiProperty({ format: 'uuid' })
  registradoPorId: string;

  @ApiProperty({ type: OperadorConsentimientoDto })
  registradoPor: OperadorConsentimientoDto;

  @ApiProperty({ type: String, format: 'date-time' })
  registradoEn: Date;
}
