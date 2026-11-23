import { DescarteModel } from '../models/descarte.model.js';

export interface DescartePaginationOptions {
  page: number;
  limit: number;
  busqueda?: string;
  desde?: Date;
  hasta?: Date;
}

export interface DescartePaginatedResult {
  data: DescarteModel[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface DescarteRepositoryPort {
  save(descarte: Partial<DescarteModel>): Promise<DescarteModel>;
  findById(id: string): Promise<DescarteModel | null>;
  search(options: DescartePaginationOptions): Promise<DescartePaginatedResult>;
}

export const DESCARTE_REPOSITORY_PORT = Symbol('DescarteRepositoryPort');
