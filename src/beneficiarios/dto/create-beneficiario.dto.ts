import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
    IsDateString,
    IsNotEmpty,
    IsOptional,
    IsString,
    MaxLength,
} from 'class-validator';

export class CreateBeneficiarioDto {
    @ApiProperty({ example: 'CC', description: 'Tipo de documento (CC, TI, RC, PPT)' })
    @Transform(({ value }) => (typeof value === 'string' ? value.trim().toUpperCase() : value))
    @IsString()
    @IsNotEmpty({ message: 'El tipo de documento es requerido' })
    @MaxLength(20, { message: 'El tipo de documento no puede superar 20 caracteres' })
    tipoDocumento: string;

    @ApiProperty({ example: '1088234567', description: 'Número de documento único' })
    @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
    @IsString()
    @IsNotEmpty({ message: 'El número de documento es requerido' })
    @MaxLength(50, { message: 'El número de documento no puede superar 50 caracteres' })
    numeroDocumento: string;

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

    @ApiPropertyOptional({ example: 'El Jardín', description: 'Barrio de residencia' })
    @IsOptional()
    @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
    @IsString()
    @MaxLength(100, { message: 'El barrio no puede superar 100 caracteres' })
    barrio?: string;

    @ApiPropertyOptional({ example: '3151234567', description: 'Número de contacto' })
    @IsOptional()
    @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
    @IsString()
    @MaxLength(20, { message: 'El teléfono no puede superar 20 caracteres' })
    telefono?: string;
}