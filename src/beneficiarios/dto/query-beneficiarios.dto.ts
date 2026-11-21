import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class QueryBeneficiariosDto {
    @ApiPropertyOptional({ default: 1, description: 'Número de página' })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    page: number = 1;

    @ApiPropertyOptional({ default: 10, maximum: 100, description: 'Cantidad de resultados por página' })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    @Max(100)
    limit: number = 10;

    @ApiPropertyOptional({
        description: 'Búsqueda en tiempo real por número de documento, nombres o apellidos',
        example: '1088234567',
    })
    @IsOptional()
    @IsString()
    search?: string;

    @ApiPropertyOptional({ description: 'Filtrar por barrio', example: 'El Jardín' })
    @IsOptional()
    @IsString()
    barrio?: string;
}