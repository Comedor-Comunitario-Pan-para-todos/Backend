import {
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Usuario } from '../../../usuarios/entities/usuario.entity.js';
import { LoginDto } from '../../dto/login.dto.js';
import {
  PASSWORD_HASHER_PORT,
  type PasswordHasherPort,
} from '../../domain/ports/password-hasher.port.js';
import {
  TOKEN_SERVICE_PORT,
  type TokenServicePort,
} from '../../domain/ports/token-service.port.js';

@Injectable()
export class LoginUseCase {
  constructor(
    @InjectRepository(Usuario)
    private readonly usuarioRepository: Repository<Usuario>,
    @Inject(PASSWORD_HASHER_PORT)
    private readonly passwordHasher: PasswordHasherPort,
    @Inject(TOKEN_SERVICE_PORT)
    private readonly tokenService: TokenServicePort,
  ) {}

  async execute(loginDto: LoginDto) {
    const { email, password } = loginDto;

    const usuario = await this.usuarioRepository
      .createQueryBuilder('usuario')
      .addSelect('usuario.password')
      .leftJoinAndSelect('usuario.rol', 'rol')
      .where('usuario.email = :email', { email })
      .getOne();

    if (!usuario) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    if (!usuario.activo) {
      throw new UnauthorizedException('El usuario se encuentra inactivo');
    }

    const passwordValida = await this.passwordHasher.compare(
      password,
      usuario.password,
    );
    if (!passwordValida) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const token = this.tokenService.sign({
      sub: usuario.id,
      email: usuario.email,
      rol: usuario.rol.nombre,
    });

    return {
      accessToken: token,
      usuario: {
        id: usuario.id,
        email: usuario.email,
        nombreCompleto: usuario.nombreCompleto,
        rol: usuario.rol.nombre,
      },
    };
  }
}
