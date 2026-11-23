import { ApiProperty } from '@nestjs/swagger';

import { Equals, IsEnum, IsInt, Min, Max } from 'class-validator';
import {
  FINALIDAD_CONSENTIMIENTO,
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

  @ApiProperty({ enum: [FINALIDAD_CONSENTIMIENTO] })
  @Equals(FINALIDAD_CONSENTIMIENTO)
  finalidad: typeof FINALIDAD_CONSENTIMIENTO;

  @ApiProperty({ enum: MetodoConsentimiento })
  @IsEnum(MetodoConsentimiento)
  metodo: MetodoConsentimiento;
}

export class ConsentimientoRegistradoDto extends RegistrarConsentimientoDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ format: 'uuid' })
  beneficiarioId: string;

  @ApiProperty({ format: 'uuid' })
  registradoPorId: string;

  @ApiProperty({ type: String, format: 'date-time' })
  registradoEn: Date;
}
