import { RolEnum } from '../../enums/rol.enum.js';

export class RolModel {
  constructor(
    public readonly id: number,
    public readonly nombre: RolEnum,
    public readonly descripcion?: string,
  ) {}
}

export class UsuarioModel {
  constructor(
    public readonly id: string,
    public readonly email: string,
    public readonly nombreCompleto: string,
    public readonly activo: boolean,
    public readonly rol: RolModel,
    public readonly password?: string,
    public readonly createdAt?: Date,
    public readonly updatedAt?: Date,
  ) {}
}
