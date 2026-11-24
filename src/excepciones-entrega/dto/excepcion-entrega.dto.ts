import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TipoExcepcionEnum } from '../enums/tipo-excepcion.enum.js';

export class ExcepcionEntregaDto {
  @ApiProperty({ example: 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d' })
  id: string;

  @ApiProperty({ example: 'b1a2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d' })
  turnoId: string;

  @ApiProperty({ example: 'e5f6a7b8-c9d0-1e2f-3a4b-5c6d7e8f9a0b' })
  autorizadoPorUsuarioId: string;

  @ApiProperty({ enum: TipoExcepcionEnum, example: TipoExcepcionEnum.RACION_EXTRA })
  tipoExcepcion: TipoExcepcionEnum;

  @ApiProperty({ example: 'Madre gestante con requerimiento nutricional adicional' })
  justificacion: string;

  @ApiProperty({ example: 1 })
  cantidadRaciones: number;

  @ApiProperty({ example: '2026-11-24T12:00:00.000Z' })
  fechaHora: Date;

  @ApiPropertyOptional()
  createdAt?: Date;

  @ApiPropertyOptional()
  updatedAt?: Date;

  @ApiPropertyOptional()
  turno?: any;

  @ApiPropertyOptional()
  autorizadoPorUsuario?: any;
}

export class RespuestaPaginadaExcepcionesDto {
  @ApiProperty({ type: [ExcepcionEntregaDto] })
  data: ExcepcionEntregaDto[];

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
