import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class CancelarTurnoDto {
  @ApiPropertyOptional({
    example: 'Comensal se retiró voluntariamente de la fila',
    description: 'Motivo de la cancelación del turno',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255, { message: 'El motivo no puede exceder 255 caracteres' })
  motivo?: string;
}
