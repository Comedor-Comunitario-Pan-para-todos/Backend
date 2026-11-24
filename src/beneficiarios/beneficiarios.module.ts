import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CreateBeneficiarioUseCase } from './application/use-cases/create-beneficiario.use-case.js';
import { ManageBeneficiarioUseCase } from './application/use-cases/manage-beneficiario.use-case.js';
import { BeneficiariosController } from './beneficiarios.controller.js';
import { BeneficiariosService } from './beneficiarios.service.js';
import { BENEFICIARIO_REPOSITORY_PORT } from './domain/ports/beneficiario-repository.port.js';
import { Beneficiario } from './entities/beneficiario.entity.js';
import { BeneficiarioTypeOrmAdapter } from './infrastructure/adapters/out/persistence/beneficiario-typeorm.adapter.js';

import { ConsentimientosModule } from '../consentimientos/consentimientos.module.js';

@Module({
  imports: [TypeOrmModule.forFeature([Beneficiario]), ConsentimientosModule],
  controllers: [BeneficiariosController],
  providers: [
    BeneficiariosService,
    CreateBeneficiarioUseCase,
    ManageBeneficiarioUseCase,
    // Vinculación del Puerto con el Adaptador TypeORM
    {
      provide: BENEFICIARIO_REPOSITORY_PORT,
      useClass: BeneficiarioTypeOrmAdapter,
    },
  ],
  exports: [
    BeneficiariosService,
    BENEFICIARIO_REPOSITORY_PORT,
    CreateBeneficiarioUseCase,
    ManageBeneficiarioUseCase,
    TypeOrmModule,
  ],
})
export class BeneficiariosModule {}
