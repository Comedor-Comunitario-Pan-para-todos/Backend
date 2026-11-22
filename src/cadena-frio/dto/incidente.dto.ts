import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import {
  TipoEquipoRefrigeracion,
  type ReporteIncidente,
} from '../domain/cadena-frio.js';

export class CrearIncidenteDto implements ReporteIncidente {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  equipoId: string;

  @ApiProperty({ description: 'Temperatura observada en °C', example: 12.5 })
  @IsNumber()
  temperaturaObservada: number;

  @ApiProperty({ minimum: 0, maximum: 2147483647, example: 30 })
  @IsInt()
  @Min(0)
  @Max(2147483647)
  minutosTranscurridos: number;

  @ApiProperty({ type: [String], maxItems: 100, example: ['Leche'] })
  @IsArray()
  @ArrayMaxSize(100)
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  @MaxLength(255, { each: true })
  insumosAfectados: string[];

  @ApiProperty({
    minLength: 1,
    maxLength: 1000,
    example: 'Trasladar los insumos a la nevera auxiliar.',
  })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  accionCorrectiva: string;
}

export class IncidenteDto extends CrearIncidenteDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ format: 'uuid' })
  reportadoPorId: string;

  @ApiProperty({ type: String, format: 'date-time' })
  registradoEn: Date;
}

export class EquipoRefrigeracionDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty()
  nombre: string;

  @ApiProperty({ enum: TipoEquipoRefrigeracion })
  tipo: TipoEquipoRefrigeracion;

  @ApiProperty()
  activo: boolean;
}
