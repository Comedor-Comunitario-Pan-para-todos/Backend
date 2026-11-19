import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Rol } from '../usuarios/entities/rol.entity.js';
import { RolEnum } from '../usuarios/enums/rol.enum.js';
import { LoginUseCase } from './application/use-cases/login.use-case.js';
import { RegisterUseCase } from './application/use-cases/register.use-case.js';
import { LoginDto } from './dto/login.dto.js';
import { RegisterDto } from './dto/register.dto.js';

@Injectable()
export class AuthService implements OnModuleInit {
  constructor(
    @InjectRepository(Rol)
    private readonly rolRepository: Repository<Rol>,
    private readonly loginUseCase: LoginUseCase,
    private readonly registerUseCase: RegisterUseCase,
  ) {}

  async onModuleInit() {
    for (const rolNombre of Object.values(RolEnum)) {
      const existe = await this.rolRepository.findOne({
        where: { nombre: rolNombre },
      });
      if (!existe) {
        await this.rolRepository.save(
          this.rolRepository.create({
            nombre: rolNombre,
            descripcion: `Rol de ${rolNombre}`,
          }),
        );
      }
    }
  }

  login(loginDto: LoginDto) {
    return this.loginUseCase.execute(loginDto);
  }

  register(registerDto: RegisterDto) {
    return this.registerUseCase.execute(registerDto);
  }
}
