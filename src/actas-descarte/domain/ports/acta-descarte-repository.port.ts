import { ActaDescarteModel } from '../models/acta-descarte.model.js';
import { EstadoActaEnum, TipoDonanteEnum } from '../../dto/crear-acta-descarte.dto.js';

export interface ActaDescartePaginationOptions {
  page: number;
  limit: number;
  estado?: EstadoActaEnum;
  tipoDonante?: TipoDonanteEnum;
  busqueda?: string;
}

export interface ActaDescartePaginatedResult {
  data: ActaDescarteModel[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface ActaDescarteRepositoryPort {
  save(acta: Partial<ActaDescarteModel>): Promise<ActaDescarteModel>;
  findById(id: string): Promise<ActaDescarteModel | null>;
  search(options: ActaDescartePaginationOptions): Promise<ActaDescartePaginatedResult>;
  generarSiguienteNumeroActa(): Promise<string>;
}

export const ACTA_DESCARTE_REPOSITORY_PORT = Symbol('ActaDescarteRepositoryPort');

export interface PdfGeneratorPort {
  generarPdfActa(acta: ActaDescarteModel): Promise<Buffer>;
}

export const PDF_GENERATOR_PORT = Symbol('PdfGeneratorPort');
