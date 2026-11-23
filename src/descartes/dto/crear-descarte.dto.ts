import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  MinLength,
} from 'class-validator';

export class CrearDescarteDto {
  @ApiProperty({
    description: 'Nombre o descripción del alimento a descartar',
    example: 'Tomate chonto maduro',
  })
  @IsString({ message: 'El alimento debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'El nombre del alimento es obligatorio' })
  alimento: string;

  @ApiProperty({
    description: 'Cantidad de alimento a descartar (debe ser mayor a 0)',
    example: 12.5,
  })
  @IsNumber({}, { message: 'La cantidad debe ser un número válido' })
  @IsPositive({ message: 'La cantidad a descartar debe ser mayor a 0' })
  cantidad: number;

  @ApiProperty({
    description: 'Unidad de medida del alimento descartado',
    example: 'KG',
  })
  @IsString({ message: 'La unidad de medida debe ser texto' })
  @IsNotEmpty({ message: 'La unidad de medida es obligatoria' })
  unidadMedida: string;

  @ApiProperty({
    description: 'Motivo y justificación detallada de la baja del alimento',
    example: 'Descomposición por presencia de moho detectada en inspección matutina',
  })
  @IsString({ message: 'El motivo debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'El motivo del descarte es obligatorio' })
  @MinLength(5, { message: 'El motivo debe contener al menos 5 caracteres' })
  motivo: string;

  @ApiPropertyOptional({
    description: 'Fecha y hora en que ocurrió el descarte (por defecto fecha actual si se omite)',
    example: '2026-11-23T10:30:00Z',
  })
  @IsOptional()
  @IsDateString({}, { message: 'La fecha debe ser un formato ISO válido' })
  fecha?: string;

  @ApiProperty({
    description: 'Nombre de la persona que evaluó la condición del alimento (ej. cocinero o voluntario)',
    example: 'Mario Pérez (Cocinero turno mañana)',
  })
  @IsString({ message: 'El evaluador debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'El campo evaluado por es obligatorio' })
  evaluadoPor: string;

  @ApiPropertyOptional({
    description: 'Identificador del lote de insumo de origen (opcional/referencial)',
    example: 'lote-tomate-2026-11',
  })
  @IsOptional()
  @IsString({ message: 'El loteId debe ser una cadena de texto' })
  loteId?: string;
}
