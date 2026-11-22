import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsUUID } from 'class-validator';

export class CreateTurnoDto {
  @ApiProperty({
    example: 'd3b07384-d113-4a11-8e9a-6c8a55e18e76',
    description: 'UUID del beneficiario registrado previamente en el padrón central',
  })
  @IsNotEmpty({ message: 'El ID del beneficiario es obligatorio' })
  @IsUUID('4', { message: 'El beneficiarioId debe ser un UUID válido versión 4' })
  beneficiarioId: string;
}
