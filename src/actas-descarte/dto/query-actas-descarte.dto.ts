import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { EstadoActaEnum, TipoDonanteEnum } from './crear-acta-descarte.dto.js';

export class QueryActasDescarteDto {
  @ApiPropertyOptional({ default: 1, description: 'Número de página' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 10, maximum: 100, description: 'Elementos por página' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 10;

  @ApiPropertyOptional({ enum: EstadoActaEnum, description: 'Filtrar por estado del acta' })
  @IsOptional()
  @IsEnum(EstadoActaEnum)
  estado?: EstadoActaEnum;

  @ApiPropertyOptional({ enum: TipoDonanteEnum, description: 'Filtrar por tipo de donante' })
  @IsOptional()
  @IsEnum(TipoDonanteEnum)
  tipoDonante?: TipoDonanteEnum;

  @ApiPropertyOptional({ description: 'Búsqueda por número de acta, insumo o donación' })
  @IsOptional()
  @IsString()
  busqueda?: string;
}
