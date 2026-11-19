import { RolEnum } from '../../enums/rol.enum.js';
import { RolModel, UsuarioModel } from '../models/usuario.model.js';

export interface PaginationOptions {
  pagina: number;
  limite: number;
  rol?: RolEnum;
  activo?: boolean;
  busqueda?: string;
}

export interface PaginatedResult<T> {
  data: T[];
  meta: {
    total: number;
    pagina: number;
    limite: number;
    totalPaginas: number;
  };
}

export interface UsuarioRepositoryPort {
  findById(id: string): Promise<UsuarioModel | null>;
  findByEmail(email: string, includePassword?: boolean): Promise<UsuarioModel | null>;
  findAndPaginate(options: PaginationOptions): Promise<PaginatedResult<UsuarioModel>>;
  save(usuario: Partial<UsuarioModel> & { password?: string; rol: RolModel }): Promise<UsuarioModel>;
  countCoordinadorasActivas(): Promise<number>;
  findRolByNombre(nombre: RolEnum): Promise<RolModel | null>;
}

export const USUARIO_REPOSITORY_PORT = Symbol('UsuarioRepositoryPort');
