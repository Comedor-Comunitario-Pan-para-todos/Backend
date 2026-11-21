import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Rol } from '../../../usuarios/entities/rol.entity.js';
import { Usuario } from '../../../usuarios/entities/usuario.entity.js';
import { RegisterDto } from '../../dto/register.dto.js';
import {
  PASSWORD_HASHER_PORT,
  type PasswordHasherPort,
} from '../../domain/ports/password-hasher.port.js';

@Injectable()
export class RegisterUseCase {
  constructor(
    @InjectRepository(Usuario)
    private readonly usuarioRepository: Repository<Usuario>,
    @InjectRepository(Rol)
    private readonly rolRepository: Repository<Rol>,
    @Inject(PASSWORD_HASHER_PORT)
    private readonly passwordHasher: PasswordHasherPort,
  ) {}

  async execute(registerDto: RegisterDto) {
    const { email, password, nombreCompleto, rol } = registerDto;

    const existeUsuario = await this.usuarioRepository.findOne({
      where: { email },
    });
    if (existeUsuario) {
      throw new ConflictException(
        'Ya existe un usuario con este correo electrónico',
      );
    }

    const rolEntity = await this.rolRepository.findOne({
      where: { nombre: rol },
    });
    if (!rolEntity) {
      throw new NotFoundException(`El rol ${rol} no existe en el sistema`);
    }

    const hashedPassword = await this.passwordHasher.hash(password);

    const nuevoUsuario = this.usuarioRepository.create({
      email,
      password: hashedPassword,
      nombreCompleto,
      rol: rolEntity,
    });

    const guardado = await this.usuarioRepository.save(nuevoUsuario);

    return {
      id: guardado.id,
      email: guardado.email,
      nombreCompleto: guardado.nombreCompleto,
      rol: rolEntity.nombre,
    };
  }
}
