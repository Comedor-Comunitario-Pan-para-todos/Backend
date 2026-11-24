import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module.js';
import { TurnosModule } from '../turnos/turnos.module.js';
import { UsuariosModule } from '../usuarios/usuarios.module.js';
import { ExcepcionEntrega } from './entities/excepcion-entrega.entity.js';
import { ExcepcionesEntregaController } from './excepciones-entrega.controller.js';
import { RegistrarExcepcionEntregaUseCase } from './application/use-cases/registrar-excepcion-entrega.use-case.js';
import { ConsultarExcepcionesUseCase } from './application/use-cases/consultar-excepciones.use-case.js';
import { EXCEPCION_ENTREGA_REPOSITORY_PORT } from './domain/ports/excepcion-entrega-repository.port.js';
import { ExcepcionEntregaTypeOrmAdapter } from './infrastructure/adapters/out/persistence/excepcion-entrega-typeorm.adapter.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([ExcepcionEntrega]),
    AuthModule,
    TurnosModule,
    UsuariosModule,
  ],
  controllers: [ExcepcionesEntregaController],
  providers: [
    RegistrarExcepcionEntregaUseCase,
    ConsultarExcepcionesUseCase,
    {
      provide: EXCEPCION_ENTREGA_REPOSITORY_PORT,
      useClass: ExcepcionEntregaTypeOrmAdapter,
    },
  ],
  exports: [
    RegistrarExcepcionEntregaUseCase,
    ConsultarExcepcionesUseCase,
    EXCEPCION_ENTREGA_REPOSITORY_PORT,
    TypeOrmModule,
  ],
})
export class ExcepcionesEntregaModule {}
