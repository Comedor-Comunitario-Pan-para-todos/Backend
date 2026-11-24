import { ExcepcionEntregaModel } from '../models/excepcion-entrega.model.js';
import { TipoExcepcionEnum } from '../../enums/tipo-excepcion.enum.js';

export interface ExcepcionPaginationOptions {
  page: number;
  limit: number;
  tipoExcepcion?: TipoExcepcionEnum;
  desde?: Date;
  hasta?: Date;
  turnoId?: string;
}

export interface ExcepcionPaginatedResult {
  data: ExcepcionEntregaModel[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface ExcepcionEntregaRepositoryPort {
  save(data: Partial<ExcepcionEntregaModel>): Promise<ExcepcionEntregaModel>;
  findById(id: string): Promise<ExcepcionEntregaModel | null>;
  findByTurnoId(turnoId: string): Promise<ExcepcionEntregaModel | null>;
  findAll(options: ExcepcionPaginationOptions): Promise<ExcepcionPaginatedResult>;
}

export const EXCEPCION_ENTREGA_REPOSITORY_PORT = Symbol('ExcepcionEntregaRepositoryPort');
