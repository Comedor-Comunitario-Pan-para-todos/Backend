import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  EstadoLoteEnum,
  UnidadMedidaInsumoEnum,
} from '../domain/models/lote-inventario.model.js';

export class LoteInventarioDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  codigoLote: string;

  @ApiProperty()
  nombreInsumo: string;

  @ApiProperty()
  categoria: string;

  @ApiProperty()
  cantidadInicial: number;

  @ApiProperty()
  cantidadActual: number;

  @ApiProperty({ enum: UnidadMedidaInsumoEnum })
  unidadMedida: UnidadMedidaInsumoEnum;

  @ApiProperty()
  fechaRecepcion: Date;

  @ApiProperty()
  fechaVencimiento: Date;

  @ApiProperty({ enum: EstadoLoteEnum })
  estado: EstadoLoteEnum;

  @ApiPropertyOptional()
  donacionOrigenId?: string | null;

  @ApiPropertyOptional()
  nombreDonante?: string | null;

  @ApiPropertyOptional()
  observaciones?: string | null;

  @ApiPropertyOptional()
  registradoPorId?: string;

  @ApiPropertyOptional()
  createdAt?: Date;

  @ApiPropertyOptional()
  updatedAt?: Date;
}

export class RespuestaPaginadaInventarioDto {
  @ApiProperty({ type: [LoteInventarioDto] })
  data: LoteInventarioDto[];

  @ApiProperty()
  total: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  limit: number;

  @ApiProperty()
  totalPages: number;
}
