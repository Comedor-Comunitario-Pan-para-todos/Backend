import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  Equals,
  IsDefined,
  IsObject,
  ValidateNested,
  IsDateString,
  IsEnum,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { NivelRegistroEnum } from '../enums/nivel-registro.enum.js';

import { RegistrarConsentimientoDto } from '../../consentimientos/dto/registrar-consentimiento.dto.js';

export class CreateBeneficiarioDto {
  @ApiPropertyOptional({
    enum: NivelRegistroEnum,
    default: NivelRegistroEnum.BASICO,
    description: 'Nivel de sensibilidad de datos: BASICO (mínimo) o EXTENDIDO (con documento y datos socioeconómicos)',
  })
  @IsOptional()
  @IsEnum(NivelRegistroEnum, {
    message: 'El nivel de registro debe ser BASICO o EXTENDIDO',
  })
  nivelRegistro?: NivelRegistroEnum = NivelRegistroEnum.BASICO;

  @ApiPropertyOptional({ example: 'CC', description: 'Tipo de documento (CC, TI, RC, PPT)' })
  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toUpperCase() : value))
  @IsString()
  @IsIn(['CC', 'TI', 'RC', 'PPT'], {
    message: 'El tipo de documento debe ser CC, TI, RC o PPT',
  })
  tipoDocumento?: string;

  @ApiPropertyOptional({ example: '1088234567', description: 'Número de documento normalizado' })
  @IsOptional()
  @Transform(({ value }) =>
    typeof value === 'string' ? value.replace(/[^a-zA-Z0-9]/g, '').trim() : value,
  )
  @IsString()
  @MaxLength(50, { message: 'El número de documento no puede superar 50 caracteres' })
  numeroDocumento?: string;

  @ApiProperty({ example: 'María Camila' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @IsNotEmpty({ message: 'Los nombres son requeridos' })
  @MaxLength(100, { message: 'Los nombres no pueden superar 100 caracteres' })
  nombres: string;

  @ApiProperty({ example: 'González López' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @IsNotEmpty({ message: 'Los apellidos son requeridos' })
  @MaxLength(100, { message: 'Los apellidos no pueden superar 100 caracteres' })
  apellidos: string;

  @ApiProperty({ example: '1995-04-15', description: 'Fecha de nacimiento (AAAA-MM-DD)' })
  @IsDateString({}, { message: 'La fecha de nacimiento debe tener formato válido AAAA-MM-DD' })
  @IsNotEmpty({ message: 'La fecha de nacimiento es requerida' })
  fechaNacimiento: string;

  @ApiPropertyOptional({ example: 'El Jardín', description: 'Barrio de residencia (referencial)' })
  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MaxLength(100, { message: 'El barrio no puede superar 100 caracteres' })
  barrio?: string;

  @ApiPropertyOptional({ example: '3151234567', description: 'Número de contacto (solo extendido)' })
  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MaxLength(20, { message: 'El teléfono no puede superar 20 caracteres' })
  telefono?: string;

  @ApiPropertyOptional({
    example: 'C1',
    description: 'Clasificación socioeconómica (Sisbén IV grupos A1 a D21, o RUI)',
  })
  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toUpperCase() : value))
  @IsString()
  @MaxLength(50, { message: 'La clasificación socioeconómica no puede superar 50 caracteres' })
  clasificacionSocioeconomica?: string;

  @ApiProperty({
    example: true,
    description: 'Consentimiento para el tratamiento de datos personales (Ley 1581)',
  })
  @Equals(true, { message: 'La autorización de datos debe ser explícita' })
  autorizaTratamientoDatos: boolean;

  @ApiProperty({ type: RegistrarConsentimientoDto })
  @IsDefined()
  @IsObject()
  @ValidateNested()
  @Type(() => RegistrarConsentimientoDto)
  consentimiento: RegistrarConsentimientoDto;
}
