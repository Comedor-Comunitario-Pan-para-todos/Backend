import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  MinLength,
  ValidateNested,
} from 'class-validator';

export enum TipoDonanteEnum {
  CORPORATIVO = 'CORPORATIVO',
  COMUNITARIO = 'COMUNITARIO',
}

export enum EstadoActaEnum {
  PENDIENTE = 'PENDIENTE',
  AUTORIZADA = 'AUTORIZADA',
  RECHAZADA = 'RECHAZADA',
}

export class EvidenciaFotoDto {
  @ApiProperty({
    description: 'URL o identificador de almacenamiento de la fotografía',
    example: 'https://storage.comedor.org/evidencias/descarte-pollo-1.jpg',
  })
  @IsString({ message: 'La URL de la foto debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'La URL de la evidencia es requerida' })
  url: string;

  @ApiProperty({
    description: 'Tipo MIME de la fotografía (debe ser JPG o PNG)',
    example: 'image/jpeg',
    enum: ['image/jpeg', 'image/png', 'image/jpg'],
  })
  @IsString({ message: 'El formato de imagen es requerido' })
  @IsNotEmpty({ message: 'El formato mimeType es obligatorio' })
  mimeType: string;

  @ApiPropertyOptional({
    description: 'Descripción breve de lo que se evidencia en la fotografía',
    example: 'Empaque roto y pérdida de cadena de frío',
  })
  @IsOptional()
  @IsString()
  descripcion?: string;
}

export class CrearActaDescarteDto {
  @ApiProperty({
    description: 'ID o código de la donación/lote de insumo de origen',
    example: 'DON-2026-04-123',
  })
  @IsString({ message: 'La donación de origen debe ser texto' })
  @IsNotEmpty({ message: 'El identificador de la donación de origen es obligatorio' })
  donacionOrigenId: string;

  @ApiProperty({
    description: 'Nombre del alimento o insumo a dar de baja en el acta',
    example: 'Pollo entero refrigerado',
  })
  @IsString({ message: 'El nombre del insumo debe ser texto' })
  @IsNotEmpty({ message: 'El nombre del insumo es obligatorio' })
  insumo: string;

  @ApiProperty({
    description: 'Cantidad exacta que se da de baja',
    example: 45.0,
  })
  @IsNumber({}, { message: 'La cantidad debe ser numérica' })
  @IsPositive({ message: 'La cantidad a descartar debe ser mayor a 0' })
  cantidad: number;

  @ApiProperty({
    description: 'Unidad de medida',
    example: 'KG',
  })
  @IsString({ message: 'La unidad de medida es requerida' })
  @IsNotEmpty({ message: 'La unidad de medida es obligatoria' })
  unidadMedida: string;

  @ApiProperty({
    description: 'Tipo de donante de origen del lote',
    enum: TipoDonanteEnum,
    example: TipoDonanteEnum.CORPORATIVO,
  })
  @IsEnum(TipoDonanteEnum, { message: 'El tipo de donante debe ser CORPORATIVO o COMUNITARIO' })
  tipoDonante: TipoDonanteEnum;

  @ApiProperty({
    description: 'Motivo y justificación detallada de la baja',
    example: 'Ruptura de cadena de frío y olor fétido detectado en recepción',
  })
  @IsString({ message: 'El motivo debe ser texto' })
  @IsNotEmpty({ message: 'El motivo es obligatorio' })
  @MinLength(5, { message: 'El motivo debe contener al menos 5 caracteres' })
  motivo: string;

  @ApiPropertyOptional({
    description: 'Fotografías de evidencia (Obligatorias si tipoDonante es CORPORATIVO)',
    type: [EvidenciaFotoDto],
  })
  @IsOptional()
  @IsArray({ message: 'Las evidencias deben ser una lista de fotografías' })
  @ValidateNested({ each: true })
  @Type(() => EvidenciaFotoDto)
  evidencias?: EvidenciaFotoDto[];
}

export class AutorizarActaDto {
  @ApiPropertyOptional({
    description: 'Observaciones de la Coordinadora al autorizar o rechazar',
    example: 'Acta aprobada y contrastada con informe de cocinero.',
  })
  @IsOptional()
  @IsString()
  observaciones?: string;
}
