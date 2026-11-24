import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDate,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  MinLength,
} from 'class-validator';
import {
  UnidadMedidaInsumoEnum,
} from '../domain/models/lote-inventario.model.js';

export class CrearLoteInventarioDto {
  @ApiProperty({ description: 'Nombre descriptivo del insumo o alimento', example: 'Arroz Diana' })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  nombreInsumo: string;

  @ApiProperty({ description: 'Categoría del insumo', example: 'Granos y Cereales' })
  @IsString()
  @IsNotEmpty()
  categoria: string;

  @ApiProperty({ description: 'Cantidad inicial recibida', example: 50 })
  @IsNumber()
  @IsPositive()
  cantidadInicial: number;

  @ApiProperty({
    description: 'Unidad de medida',
    enum: UnidadMedidaInsumoEnum,
    example: UnidadMedidaInsumoEnum.KG,
  })
  @IsEnum(UnidadMedidaInsumoEnum)
  @IsNotEmpty()
  unidadMedida: UnidadMedidaInsumoEnum;

  @ApiProperty({
    description: 'Fecha en la que se recibió el insumo (ISO-8601 string o YYYY-MM-DD)',
    example: '2026-11-24T00:00:00.000Z',
  })
  @Type(() => Date)
  @IsDate()
  @IsNotEmpty()
  fechaRecepcion: Date;

  @ApiProperty({
    description: 'Fecha de vencimiento o caducidad del insumo (debe ser estrictamente posterior a la recepción)',
    example: '2027-05-30T00:00:00.000Z',
  })
  @Type(() => Date)
  @IsDate()
  @IsNotEmpty()
  fechaVencimiento: Date;

  @ApiPropertyOptional({
    description: 'Código de lote asignado por fabricante o identificador interno',
    example: 'LOT-2026-ARR-001',
  })
  @IsString()
  @IsOptional()
  codigoLote?: string;

  @ApiPropertyOptional({
    description: 'ID de la donación vinculada si aplica (RF-11)',
    example: 'DON-2026-0042',
  })
  @IsString()
  @IsOptional()
  donacionOrigenId?: string;

  @ApiPropertyOptional({
    description: 'Nombre del donante o proveedor de origen',
    example: 'Supermercados Éxito',
  })
  @IsString()
  @IsOptional()
  nombreDonante?: string;

  @ApiPropertyOptional({
    description: 'Observaciones sobre el estado del empaque, condiciones de llegada, etc.',
    example: 'Bultos sellados en perfecto estado',
  })
  @IsString()
  @IsOptional()
  observaciones?: string;
}

export class RegistrarConsumoInsumoDto {
  @ApiProperty({ description: 'Cantidad a descontar / consumir del lote', example: 10 })
  @IsNumber()
  @IsPositive()
  cantidad: number;

  @ApiPropertyOptional({
    description: 'Motivo del consumo o preparación del día (RF-17)',
    example: 'Preparación de 120 almuerzos del día',
  })
  @IsString()
  @IsOptional()
  motivo?: string;
}
