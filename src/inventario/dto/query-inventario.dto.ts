import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsPositive, IsString, Min } from 'class-validator';
import { EstadoLoteEnum } from '../domain/models/lote-inventario.model.js';

export class QueryInventarioDto {
  @ApiPropertyOptional({ description: 'Buscar insumo por nombre o coincidencia parcial' })
  @IsString()
  @IsOptional()
  nombreInsumo?: string;

  @ApiPropertyOptional({ description: 'Filtrar por categoría de insumo' })
  @IsString()
  @IsOptional()
  categoria?: string;

  @ApiPropertyOptional({ description: 'Filtrar por estado del lote', enum: EstadoLoteEnum })
  @IsEnum(EstadoLoteEnum)
  @IsOptional()
  estado?: EstadoLoteEnum;

  @ApiPropertyOptional({ description: 'Filtrar insumos que vencerán en los próximos N días', example: 15 })
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  @IsOptional()
  proximoAVencerDias?: number;

  @ApiPropertyOptional({ description: 'Número de página', default: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Elementos por página', default: 10 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  limit?: number = 10;
}
