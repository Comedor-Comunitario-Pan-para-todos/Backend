import { ApiProperty } from '@nestjs/swagger';
import {
    IsEmail,
    IsEnum,
    IsNotEmpty,
    MaxLength,
    MinLength,
} from 'class-validator';
import { RolEnum } from '../enums/rol.enum.js';

export class RegisterDto {
    @ApiProperty({ example: 'coordinadora@comedor.org' })
    @IsEmail({}, { message: 'El correo electrónico no es válido' })
    @IsNotEmpty({ message: 'El correo electrónico es requerido' })
    email: string;

    @ApiProperty({ example: 'Admin123*' })
    @IsNotEmpty({ message: 'La contraseña es requerida' })
    @MinLength(6, { message: 'La contraseña debe tener al menos 6 caracteres' })
    password: string;

    @ApiProperty({ example: 'Ana María Gómez', maxLength: 255 })
    @IsNotEmpty({ message: 'El nombre completo es requerido' })
    @MaxLength(255, { message: 'El nombre completo no puede superar 255 caracteres' })
    nombreCompleto: string;

    @ApiProperty({ enum: RolEnum, example: RolEnum.COORDINADORA })
    @IsEnum(RolEnum, { message: 'El rol especificado no es válido' })
    @IsNotEmpty({ message: 'El rol es requerido' })
    rol: RolEnum;
}