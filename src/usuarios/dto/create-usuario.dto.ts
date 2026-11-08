import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
    IsEmail,
    IsEnum,
    IsNotEmpty,
    IsString,
    MaxLength,
    MinLength,
} from 'class-validator';
import { RolEnum } from '../../auth/enums/rol.enum.js';

const normalizarEmail = ({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value;

export class CreateUsuarioDto {
    @ApiProperty({ example: 'voluntario@comedor.org' })
    @Transform(normalizarEmail)
    @IsEmail({}, { message: 'El correo electrónico no es válido' })
    @IsNotEmpty({ message: 'El correo electrónico es requerido' })
    email: string;

    @ApiProperty({ example: 'Clave1234*' })
    @IsString()
    @IsNotEmpty({ message: 'La contraseña es requerida' })
    @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres' })
    password: string;

    @ApiProperty({ example: 'Carlos Andrés Pérez', maxLength: 255 })
    @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
    @IsString()
    @IsNotEmpty({ message: 'El nombre completo es requerido' })
    @MaxLength(255, { message: 'El nombre completo no puede superar 255 caracteres' })
    nombreCompleto: string;

    @ApiProperty({ enum: RolEnum, example: RolEnum.VOLUNTARIO })
    @IsEnum(RolEnum, { message: 'El rol especificado no es válido' })
    @IsNotEmpty({ message: 'El rol es requerido' })
    rol: RolEnum;
}