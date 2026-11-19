import { BeneficiarioModel } from '../models/beneficiario.model.js';

export interface BeneficiarioPaginationOptions {
  page: number;
  limit: number;
  busqueda?: string;
}

export interface BeneficiarioPaginatedResult {
  data: BeneficiarioModel[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface BeneficiarioRepositoryPort {
  save(data: Partial<BeneficiarioModel>): Promise<BeneficiarioModel>;
  findByDocumento(numeroDocumento: string): Promise<BeneficiarioModel | null>;
  findById(id: string): Promise<BeneficiarioModel | null>;
  search(options: BeneficiarioPaginationOptions): Promise<BeneficiarioPaginatedResult>;
  softDelete(id: string): Promise<void>;
}

export const BENEFICIARIO_REPOSITORY_PORT = Symbol('BeneficiarioRepositoryPort');
