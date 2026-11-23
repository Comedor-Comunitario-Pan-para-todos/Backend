import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDateString, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class QueryDescartesDto {
  @ApiPropertyOptional({ default: 1, description: 'Número de página para paginación' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 10, maximum: 100, description: 'Cantidad de elementos por página' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 10;

  @ApiPropertyOptional({ description: 'Filtro de búsqueda por texto en alimento o motivo' })
  @IsOptional()
  @IsString()
  busqueda?: string;

  @ApiPropertyOptional({ description: 'Filtrar descartes a partir de esta fecha (ISO)' })
  @IsOptional()
  @IsDateString()
  desde?: string;

  @ApiPropertyOptional({ description: 'Filtrar descartes hasta esta fecha (ISO)' })
  @IsOptional()
  @IsDateString()
  hasta?: string;
}
