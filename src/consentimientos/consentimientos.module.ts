import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { ConsentimientosService } from './application/consentimientos.service.js';
import { ConsentimientosController } from './consentimientos.controller.js';
import { CONSENTIMIENTO_REPOSITORY } from './domain/consentimiento-repository.port.js';
import { ConsentimientoTypeOrmAdapter } from './infrastructure/consentimiento-typeorm.adapter.js';

@Module({
  imports: [AuthModule],
  controllers: [ConsentimientosController],
  providers: [
    ConsentimientosService,
    {
      provide: CONSENTIMIENTO_REPOSITORY,
      useClass: ConsentimientoTypeOrmAdapter,
    },
  ],
})
export class ConsentimientosModule {}
