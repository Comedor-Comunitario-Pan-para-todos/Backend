import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PASSWORD_HASHER_PORT } from '../auth/domain/ports/password-hasher.port.js';
import { BcryptPasswordHasherAdapter } from '../auth/infrastructure/adapters/out/bcrypt-password-hasher.adapter.js';
import { CreateUsuarioUseCase } from './application/use-cases/create-usuario.use-case.js';
import { GetUsuariosUseCase } from './application/use-cases/get-usuarios.use-case.js';
import { ManageUsuarioUseCase } from './application/use-cases/manage-usuario.use-case.js';
import { USUARIO_REPOSITORY_PORT } from './domain/ports/usuario-repository.port.js';
import { Rol } from './entities/rol.entity.js';
import { Usuario } from './entities/usuario.entity.js';
import { UsuarioTypeOrmAdapter } from './infrastructure/adapters/out/persistence/usuario-typeorm.adapter.js';
import { UsuariosController } from './usuarios.controller.js';
import { UsuariosService } from './usuarios.service.js';

@Module({
  imports: [TypeOrmModule.forFeature([Usuario, Rol])],
  controllers: [UsuariosController],
  providers: [
    UsuariosService,
    CreateUsuarioUseCase,
    GetUsuariosUseCase,
    ManageUsuarioUseCase,
    // Vinculación del Puerto de Repositorio con el Adaptador TypeORM
    {
      provide: USUARIO_REPOSITORY_PORT,
      useClass: UsuarioTypeOrmAdapter,
    },
    // Vinculación del Puerto Hasher con el Adaptador Bcrypt
    {
      provide: PASSWORD_HASHER_PORT,
      useClass: BcryptPasswordHasherAdapter,
    },
  ],
  exports: [
    UsuariosService,
    USUARIO_REPOSITORY_PORT,
    CreateUsuarioUseCase,
    GetUsuariosUseCase,
    ManageUsuarioUseCase,
    TypeOrmModule,
  ],
})
export class UsuariosModule {}
