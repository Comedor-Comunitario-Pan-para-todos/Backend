import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDateString, IsEnum, IsInt, IsOptional, Max, Min } from 'class-validator';
import { EstadoTurnoEnum } from '../enums/estado-turno.enum.js';

export class QueryTurnosDto {
  @ApiPropertyOptional({
    example: '2026-11-21',
    description: 'Fecha de los turnos en formato AAAA-MM-DD (por defecto hoy)',
  })
  @IsOptional()
  @IsDateString({}, { message: 'La fecha debe tener formato AAAA-MM-DD válido' })
  fecha?: string;

  @ApiPropertyOptional({
    enum: EstadoTurnoEnum,
    description: 'Filtrar por estado del turno (EN_ESPERA, ATENDIDO, CANCELADO, NO_SHOW)',
  })
  @IsOptional()
  @IsEnum(EstadoTurnoEnum, { message: 'Estado del turno no válido' })
  estado?: EstadoTurnoEnum;

  @ApiPropertyOptional({ example: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ example: 20, default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}
