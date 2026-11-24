import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module.js';
import { ActasDescarteController } from './actas-descarte.controller.js';
import { AutorizarActaDescarteUseCase } from './application/use-cases/autorizar-acta-descarte.use-case.js';
import { ConsultarActasDescarteUseCase } from './application/use-cases/consultar-actas-descarte.use-case.js';
import { GenerarActaDescarteUseCase } from './application/use-cases/generar-acta-descarte.use-case.js';
import {
  ACTA_DESCARTE_REPOSITORY_PORT,
  PDF_GENERATOR_PORT,
} from './domain/ports/acta-descarte-repository.port.js';
import { ActaDescarte } from './infrastructure/adapters/out/persistence/acta-descarte.entity.js';
import { ActaDescarteTypeOrmAdapter } from './infrastructure/adapters/out/persistence/acta-descarte-typeorm.adapter.js';
import { SimplePdfGeneratorAdapter } from './infrastructure/adapters/out/pdf/simple-pdf-generator.adapter.js';

@Module({
  imports: [TypeOrmModule.forFeature([ActaDescarte]), AuthModule],
  controllers: [ActasDescarteController],
  providers: [
    GenerarActaDescarteUseCase,
    AutorizarActaDescarteUseCase,
    ConsultarActasDescarteUseCase,
    {
      provide: ACTA_DESCARTE_REPOSITORY_PORT,
      useClass: ActaDescarteTypeOrmAdapter,
    },
    {
      provide: PDF_GENERATOR_PORT,
      useClass: SimplePdfGeneratorAdapter,
    },
  ],
  exports: [
    GenerarActaDescarteUseCase,
    AutorizarActaDescarteUseCase,
    ConsultarActasDescarteUseCase,
    ACTA_DESCARTE_REPOSITORY_PORT,
    PDF_GENERATOR_PORT,
    TypeOrmModule,
  ],
})
export class ActasDescartesModule {}
