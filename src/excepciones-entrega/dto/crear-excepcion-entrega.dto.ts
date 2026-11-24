import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';
import { TipoExcepcionEnum } from '../enums/tipo-excepcion.enum.js';

export class CrearExcepcionEntregaDto {
  @ApiProperty({
    description: 'Identificador único del turno de atención (UUID)',
    example: 'b1a2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
  })
  @IsUUID('all', { message: 'El turnoId debe ser un UUID válido' })
  @IsNotEmpty({ message: 'El turnoId es obligatorio' })
  turnoId: string;

  @ApiProperty({
    description: 'Identificador del usuario con rol de Coordinadora que autorizó la excepción (UUID)',
    example: 'e5f6a7b8-c9d0-1e2f-3a4b-5c6d7e8f9a0b',
  })
  @IsUUID('all', { message: 'El autorizadoPorUsuarioId debe ser un UUID válido' })
  @IsNotEmpty({ message: 'El autorizadoPorUsuarioId es obligatorio' })
  autorizadoPorUsuarioId: string;

  @ApiProperty({
    description: 'Tipo o categoría de la excepción de entrega',
    enum: TipoExcepcionEnum,
    example: TipoExcepcionEnum.RACION_EXTRA,
  })
  @IsEnum(TipoExcepcionEnum, {
    message: 'El tipo de excepción debe ser RACION_EXTRA, MERCADO_LLEVAR o DIETA_ESPECIAL',
  })
  @IsNotEmpty({ message: 'El tipo de excepción es obligatorio' })
  tipoExcepcion: TipoExcepcionEnum;

  @ApiProperty({
    description: 'Motivo y justificación documentada de la entrega extraordinaria',
    example: 'Familiar en condición de discapacidad postrado en cama en el mismo domicilio',
    maxLength: 255,
  })
  @IsString({ message: 'La justificación debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'La justificación es obligatoria y no puede estar vacía' })
  @MaxLength(255, { message: 'La justificación no puede superar los 255 caracteres' })
  justificacion: string;

  @ApiPropertyOptional({
    description: 'Número de raciones extraordinarias concedidas (mínimo 1, por defecto 1)',
    example: 1,
    default: 1,
  })
  @IsOptional()
  @IsInt({ message: 'La cantidad de raciones debe ser un número entero' })
  @Min(1, { message: 'La cantidad de raciones debe ser al menos 1' })
  cantidadRaciones?: number = 1;
}
