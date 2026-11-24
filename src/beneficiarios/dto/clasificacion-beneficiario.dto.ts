import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsIn,
  IsNotEmpty,
  IsString,
  MaxLength,
  ValidateIf,
} from 'class-validator';

function normalizar({ value }: { value: unknown }) {
  return typeof value === 'string' ? value.trim().toUpperCase() : value;
}

export class ClasificacionBeneficiarioDto {
  @ApiProperty({ enum: ['SISBEN', 'SISBEN_IV', 'RUI'] })
  @Transform(normalizar)
  @IsIn(['SISBEN', 'SISBEN_IV', 'RUI'])
  sistema: 'SISBEN' | 'SISBEN_IV' | 'RUI';

  @ApiProperty({
    example: 'C1',
    required: false,
    description: 'Obligatorio para Sisbén; opcional para RUI',
  })
  @ValidateIf(
    (dto: ClasificacionBeneficiarioDto) =>
      dto.sistema !== 'RUI' || dto.grupo != null,
  )
  @Transform(normalizar)
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  grupo?: string;
}
