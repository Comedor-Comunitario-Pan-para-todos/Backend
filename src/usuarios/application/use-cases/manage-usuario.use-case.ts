import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  USUARIO_REPOSITORY_PORT,
  type UsuarioRepositoryPort,
} from '../../domain/ports/usuario-repository.port.js';
import { UpdateUsuarioDto } from '../../dto/update-usuario.dto.js';
import { ResetPasswordDto } from '../../dto/reset-password.dto.js';
import {
  PASSWORD_HASHER_PORT,
  type PasswordHasherPort,
} from '../../../auth/domain/ports/password-hasher.port.js';
import { RolEnum } from '../../enums/rol.enum.js';

@Injectable()
export class ManageUsuarioUseCase {
  constructor(
    @Inject(USUARIO_REPOSITORY_PORT)
    private readonly usuarioRepo: UsuarioRepositoryPort,
    @Inject(PASSWORD_HASHER_PORT)
    private readonly passwordHasher: PasswordHasherPort,
  ) {}

  async update(id: string, dto: UpdateUsuarioDto) {
    const usuario = await this.usuarioRepo.findById(id);
    if (!usuario) {
      throw new NotFoundException(`Usuario con ID ${id} no encontrado`);
    }

    if (dto.email && dto.email !== usuario.email) {
      const existe = await this.usuarioRepo.findByEmail(dto.email);
      if (existe && existe.id !== id) {
        throw new ConflictException('Ya existe un usuario con este correo electrónico');
      }
    }

    let rol = usuario.rol;
    if (dto.rol) {
      const rolEncontrado = await this.usuarioRepo.findRolByNombre(dto.rol);
      if (!rolEncontrado) {
        throw new NotFoundException(`El rol ${dto.rol} no existe`);
      }
      rol = rolEncontrado;
    }

    if (
      dto.rol &&
      dto.rol !== RolEnum.COORDINADORA &&
      usuario.rol.nombre === RolEnum.COORDINADORA &&
      usuario.activo
    ) {
      const totalCoordinadoras = await this.usuarioRepo.countCoordinadorasActivas();
      if (totalCoordinadoras <= 1) {
        throw new BadRequestException('No se puede cambiar el rol de la única Coordinadora activa');
      }
    }

    const guardado = await this.usuarioRepo.save({
      id: usuario.id,
      email: dto.email ?? usuario.email,
      nombreCompleto: dto.nombreCompleto ?? usuario.nombreCompleto,
      activo: usuario.activo,
      rol,
    });

    return {
      id: guardado.id,
      email: guardado.email,
      nombreCompleto: guardado.nombreCompleto,
      rol: guardado.rol.nombre,
      activo: guardado.activo,
    };
  }

  async resetPassword(id: string, dto: ResetPasswordDto) {
    const usuario = await this.usuarioRepo.findById(id);
    if (!usuario) {
      throw new NotFoundException(`Usuario con ID ${id} no encontrado`);
    }

    const hashedPassword = await this.passwordHasher.hash(dto.nuevaPassword);
    await this.usuarioRepo.save({
      id: usuario.id,
      email: usuario.email,
      nombreCompleto: usuario.nombreCompleto,
      activo: usuario.activo,
      rol: usuario.rol,
      password: hashedPassword,
    });

    return { mensaje: 'Contraseña restablecida correctamente' };
  }

  async softDelete(id: string) {
    const usuario = await this.usuarioRepo.findById(id);
    if (!usuario) {
      throw new NotFoundException(`Usuario con ID ${id} no encontrado`);
    }

    if (usuario.rol.nombre === RolEnum.COORDINADORA && usuario.activo) {
      const totalCoordinadoras = await this.usuarioRepo.countCoordinadorasActivas();
      if (totalCoordinadoras <= 1) {
        throw new BadRequestException('No se puede desactivar a la única Coordinadora activa');
      }
    }

    const guardado = await this.usuarioRepo.save({
      id: usuario.id,
      email: usuario.email,
      nombreCompleto: usuario.nombreCompleto,
      activo: false,
      rol: usuario.rol,
    });

    return {
      id: guardado.id,
      email: guardado.email,
      nombreCompleto: guardado.nombreCompleto,
      rol: guardado.rol.nombre,
      activo: false,
    };
  }
}
