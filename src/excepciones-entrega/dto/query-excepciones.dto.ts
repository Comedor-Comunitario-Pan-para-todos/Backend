import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsUUID,
  Max,
  Min,
} from 'class-validator';
import { TipoExcepcionEnum } from '../enums/tipo-excepcion.enum.js';

export class QueryExcepcionesDto {
  @ApiPropertyOptional({
    description: 'Número de página para paginación',
    default: 1,
    minimum: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'La página debe ser un número entero' })
  @Min(1, { message: 'La página debe ser mayor o igual a 1' })
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Cantidad de registros por página',
    default: 10,
    minimum: 1,
    maximum: 100,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'El límite debe ser un número entero' })
  @Min(1, { message: 'El límite debe ser mayor o igual a 1' })
  @Max(100, { message: 'El límite no puede superar los 100 registros por página' })
  limit?: number = 10;

  @ApiPropertyOptional({
    description: 'Filtrar por tipo de excepción',
    enum: TipoExcepcionEnum,
  })
  @IsOptional()
  @IsEnum(TipoExcepcionEnum, {
    message: 'El tipo de excepción debe ser RACION_EXTRA, MERCADO_LLEVAR o DIETA_ESPECIAL',
  })
  tipoExcepcion?: TipoExcepcionEnum;

  @ApiPropertyOptional({
    description: 'Filtrar excepciones desde esta fecha (formato YYYY-MM-DD)',
    example: '2026-11-01',
  })
  @IsOptional()
  @IsDateString({}, { message: 'La fecha desde debe ser una fecha válida (YYYY-MM-DD)' })
  desde?: string;

  @ApiPropertyOptional({
    description: 'Filtrar excepciones hasta esta fecha (formato YYYY-MM-DD)',
    example: '2026-11-30',
  })
  @IsOptional()
  @IsDateString({}, { message: 'La fecha hasta debe ser una fecha válida (YYYY-MM-DD)' })
  hasta?: string;

  @ApiPropertyOptional({
    description: 'Filtrar por identificador de turno específico (UUID)',
  })
  @IsOptional()
  @IsUUID('all', { message: 'El turnoId debe ser un UUID válido' })
  turnoId?: string;
}
