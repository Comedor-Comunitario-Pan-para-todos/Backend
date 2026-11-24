import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { RetencionService } from './application/retencion.service.js';
import { VerificacionRetencionJob } from './application/verificacion-retencion.job.js';
import { RETENCION_REPOSITORIO } from './domain/retencion.js';
import { RetencionTypeOrmAdapter } from './infrastructure/retencion-typeorm.adapter.js';
import { RetencionController } from './retencion.controller.js';

@Module({
  imports: [AuthModule],
  controllers: [RetencionController],
  providers: [
    RetencionService,
    VerificacionRetencionJob,
    { provide: RETENCION_REPOSITORIO, useClass: RetencionTypeOrmAdapter },
  ],
})
export class RetencionModule {}
