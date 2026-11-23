import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module.js';
import { ConsultarDescartesUseCase } from './application/use-cases/consultar-descartes.use-case.js';
import { RegistrarDescarteUseCase } from './application/use-cases/registrar-descarte.use-case.js';
import { DescartesController } from './descartes.controller.js';
import { DESCARTE_REPOSITORY_PORT } from './domain/ports/descarte-repository.port.js';
import { Descarte } from './infrastructure/adapters/out/persistence/descarte.entity.js';
import { DescarteTypeOrmAdapter } from './infrastructure/adapters/out/persistence/descarte-typeorm.adapter.js';

@Module({
  imports: [TypeOrmModule.forFeature([Descarte]), AuthModule],
  controllers: [DescartesController],
  providers: [
    RegistrarDescarteUseCase,
    ConsultarDescartesUseCase,
    {
      provide: DESCARTE_REPOSITORY_PORT,
      useClass: DescarteTypeOrmAdapter,
    },
  ],
  exports: [
    RegistrarDescarteUseCase,
    ConsultarDescartesUseCase,
    DESCARTE_REPOSITORY_PORT,
    TypeOrmModule,
  ],
})
export class DescartesModule {}
