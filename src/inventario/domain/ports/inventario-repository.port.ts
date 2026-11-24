import type { LoteInventarioModel } from '../models/lote-inventario.model.js';

export const INVENTARIO_REPOSITORY_PORT = Symbol('INVENTARIO_REPOSITORY_PORT');

export interface FiltrosConsultaInventario {
  nombreInsumo?: string;
  categoria?: string;
  estado?: string;
  proximoAVencerDias?: number;
  page?: number;
  limit?: number;
}

export interface ResultadoPaginadoInventario<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface InventarioRepositoryPort {
  save(lote: LoteInventarioModel): Promise<LoteInventarioModel>;
  findById(id: string): Promise<LoteInventarioModel | null>;
  findByCodigoLote(codigoLote: string): Promise<LoteInventarioModel | null>;
  generarSiguienteCodigoLote(nombreInsumo: string, fechaRecepcion: Date): Promise<string>;
  search(filtros: FiltrosConsultaInventario): Promise<ResultadoPaginadoInventario<LoteInventarioModel>>;
  findDisponiblesPorInsumoOrdenadoPorVencimiento(nombreInsumo: string): Promise<LoteInventarioModel[]>;
}
