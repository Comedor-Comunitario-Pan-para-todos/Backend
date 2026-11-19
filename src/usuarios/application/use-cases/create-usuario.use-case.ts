import { Inject, Injectable } from '@nestjs/common';
import { CreateUsuarioDto } from '../../dto/create-usuario.dto.js';
import {
  USUARIO_REPOSITORY_PORT,
  type UsuarioRepositoryPort,
} from '../../domain/ports/usuario-repository.port.js';
import {
  PASSWORD_HASHER_PORT,
  type PasswordHasherPort,
} from '../../../auth/domain/ports/password-hasher.port.js';
import { ConflictException, NotFoundException } from '@nestjs/common';

@Injectable()
export class CreateUsuarioUseCase {
  constructor(
    @Inject(USUARIO_REPOSITORY_PORT)
    private readonly usuarioRepo: UsuarioRepositoryPort,
    @Inject(PASSWORD_HASHER_PORT)
    private readonly passwordHasher: PasswordHasherPort,
  ) {}

  async execute(dto: CreateUsuarioDto) {
    const existe = await this.usuarioRepo.findByEmail(dto.email);
    if (existe) {
      throw new ConflictException('Ya existe un usuario con este correo electrónico');
    }

    const rol = await this.usuarioRepo.findRolByNombre(dto.rol);
    if (!rol) {
      throw new NotFoundException(`El rol ${dto.rol} no existe en el sistema`);
    }

    const hashedPassword = await this.passwordHasher.hash(dto.password);

    const guardado = await this.usuarioRepo.save({
      email: dto.email,
      nombreCompleto: dto.nombreCompleto,
      password: hashedPassword,
      rol,
      activo: true,
    });

    return {
      id: guardado.id,
      email: guardado.email,
      nombreCompleto: guardado.nombreCompleto,
      rol: guardado.rol.nombre,
      activo: guardado.activo,
    };
  }
}
