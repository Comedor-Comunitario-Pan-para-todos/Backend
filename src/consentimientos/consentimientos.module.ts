import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { ConsentimientosService } from './application/consentimientos.service.js';
import { ConsentimientosController } from './consentimientos.controller.js';
import { CONSENTIMIENTO_REPOSITORY } from './domain/consentimiento-repository.port.js';
import { ConsentimientoTypeOrmAdapter } from './infrastructure/consentimiento-typeorm.adapter.js';

import { AutorizacionTutorController } from './autorizacion-tutor.controller.js';
import { AutorizacionTutorService } from './application/autorizacion-tutor.service.js';
import { AUTORIZACION_TUTOR_REPOSITORY } from './domain/autorizacion-tutor-repository.port.js';
import { AutorizacionTutorTypeOrmAdapter } from './infrastructure/autorizacion-tutor-typeorm.adapter.js';

@Module({
  imports: [AuthModule],
  exports: [ConsentimientosService, AutorizacionTutorService],
  controllers: [ConsentimientosController, AutorizacionTutorController],
  providers: [
    ConsentimientosService,
    AutorizacionTutorService,
    {
      provide: AUTORIZACION_TUTOR_REPOSITORY,
      useClass: AutorizacionTutorTypeOrmAdapter,
    },
    {
      provide: CONSENTIMIENTO_REPOSITORY,
      useClass: ConsentimientoTypeOrmAdapter,
    },
  ],
})
export class ConsentimientosModule {}
