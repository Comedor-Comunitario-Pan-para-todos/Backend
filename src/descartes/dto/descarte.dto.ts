import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class DescarteDto {
  @ApiProperty({ example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11' })
  id: string;

  @ApiProperty({ example: 'Tomate chonto maduro' })
  alimento: string;

  @ApiProperty({ example: 12.5 })
  cantidad: number;

  @ApiProperty({ example: 'KG' })
  unidadMedida: string;

  @ApiProperty({ example: 'Descomposición por presencia de moho' })
  motivo: string;

  @ApiProperty({ example: '2026-11-23T10:30:00.000Z' })
  fecha: Date;

  @ApiProperty({ example: 'Mario Pérez (Cocinero)' })
  evaluadoPor: string;

  @ApiProperty({ example: 'uuid-coordinadora-1' })
  autorizadoPorId: string;

  @ApiPropertyOptional({ example: 'lote-123' })
  loteId?: string;

  @ApiProperty({ example: '2026-11-23T10:31:00.000Z' })
  createdAt: Date;
}

export class RespuestaPaginadaDescartesDto {
  @ApiProperty({ type: [DescarteDto] })
  data: DescarteDto[];

  @ApiProperty({
    example: {
      total: 15,
      page: 1,
      limit: 10,
      totalPages: 2,
    },
  })
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
