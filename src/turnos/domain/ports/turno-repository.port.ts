import { TurnoModel } from '../models/turno.model.js';
import { EstadoTurnoEnum } from '../../enums/estado-turno.enum.js';

export interface TurnoPaginationOptions {
  fecha?: string;
  estado?: EstadoTurnoEnum;
  page: number;
  limit: number;
}

export interface TurnoPaginatedResult {
  data: TurnoModel[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface TurnoRepositoryPort {
  save(data: Partial<TurnoModel>): Promise<TurnoModel>;
  obtenerSiguienteNumeroTurno(fecha: string): Promise<number>;
  findByBeneficiarioYFecha(beneficiarioId: string, fecha: string): Promise<TurnoModel | null>;
  findById(id: string): Promise<TurnoModel | null>;
  findAll(options: TurnoPaginationOptions): Promise<TurnoPaginatedResult>;
  updateEstado(
    id: string,
    estado: EstadoTurnoEnum,
    extra?: { horaAtencion?: string; motivoCancelacion?: string },
  ): Promise<TurnoModel>;
}

export const TURNO_REPOSITORY_PORT = Symbol('TurnoRepositoryPort');
