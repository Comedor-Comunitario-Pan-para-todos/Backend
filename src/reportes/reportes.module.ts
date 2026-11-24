import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { ReporteGestionService } from './application/reporte-gestion.service.js';
import { REPORTE_GESTION_REPOSITORIO } from './domain/reporte-gestion.js';
import { ReporteGestionTypeOrmAdapter } from './infrastructure/reporte-gestion-typeorm.adapter.js';
import { ReportesController } from './reportes.controller.js';

@Module({
  imports: [AuthModule],
  controllers: [ReportesController],
  providers: [
    ReporteGestionService,
    {
      provide: REPORTE_GESTION_REPOSITORIO,
      useClass: ReporteGestionTypeOrmAdapter,
    },
  ],
})
export class ReportesModule {}
