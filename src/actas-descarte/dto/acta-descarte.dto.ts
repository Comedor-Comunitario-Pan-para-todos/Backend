import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { EstadoActaEnum, EvidenciaFotoDto, TipoDonanteEnum } from './crear-acta-descarte.dto.js';

export class ActaDescarteDto {
  @ApiProperty({ example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11' })
  id: string;

  @ApiProperty({ example: 'ACTA-2026-0001' })
  numeroActa: string;

  @ApiProperty({ example: 'DON-2026-04-123' })
  donacionOrigenId: string;

  @ApiProperty({ example: 'Pollo entero refrigerado' })
  insumo: string;

  @ApiProperty({ example: 45.0 })
  cantidad: number;

  @ApiProperty({ example: 'KG' })
  unidadMedida: string;

  @ApiProperty({ enum: TipoDonanteEnum, example: TipoDonanteEnum.CORPORATIVO })
  tipoDonante: TipoDonanteEnum;

  @ApiProperty({ example: 'Ruptura de cadena de frío y olor fétido' })
  motivo: string;

  @ApiProperty({ enum: EstadoActaEnum, example: EstadoActaEnum.PENDIENTE })
  estado: EstadoActaEnum;

  @ApiProperty({ type: [EvidenciaFotoDto] })
  evidencias: EvidenciaFotoDto[];

  @ApiProperty({ example: 'uuid-voluntario-1' })
  generadaPorId: string;

  @ApiPropertyOptional({ example: 'uuid-coordinadora-1' })
  autorizadaPorId?: string;

  @ApiPropertyOptional({ example: '2026-11-23T18:00:00.000Z' })
  fechaAutorizacion?: Date;

  @ApiPropertyOptional({ example: 'Aprobado sin novedades' })
  observaciones?: string;

  @ApiProperty({ example: '2026-11-23T17:30:00.000Z' })
  createdAt: Date;
}

export class RespuestaPaginadaActasDto {
  @ApiProperty({ type: [ActaDescarteDto] })
  data: ActaDescarteDto[];

  @ApiProperty({
    example: { total: 10, page: 1, limit: 10, totalPages: 1 },
  })
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
