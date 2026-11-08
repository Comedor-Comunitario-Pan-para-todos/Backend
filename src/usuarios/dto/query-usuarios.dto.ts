import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
    IsBoolean,
    IsEnum,
    IsInt,
    IsOptional,
    IsString,
    Max,
    Min,
} from 'class-validator';
import { RolEnum } from '../../auth/enums/rol.enum.js';

export class QueryUsuariosDto {
    @ApiPropertyOptional({ default: 1 })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    page: number = 1;

    @ApiPropertyOptional({ default: 10, maximum: 100 })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    @Max(100)
    limit: number = 10;

    @ApiPropertyOptional({ description: 'Busca por nombre o correo' })
    @IsOptional()
    @IsString()
    search?: string;

    @ApiPropertyOptional({ enum: RolEnum })
    @IsOptional()
    @IsEnum(RolEnum)
    rol?: RolEnum;

    @ApiPropertyOptional({ description: 'Filtra por cuentas activas/inactivas' })
    @IsOptional()
    @Transform(({ value }) =>
        value === 'true' ? true : value === 'false' ? false : value,
    )
    @IsBoolean()
    activo?: boolean;
}