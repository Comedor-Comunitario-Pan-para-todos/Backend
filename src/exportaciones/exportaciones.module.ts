import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { ExportarBeneficiariosService } from './application/exportar-beneficiarios.service.js';
import {
  EXPORTACIONES_REPOSITORIO,
  GENERADOR_EXCEL,
} from './domain/exportaciones.js';
import { ExportacionesController } from './exportaciones.controller.js';
import { ExcelJsAdapter } from './infrastructure/exceljs.adapter.js';
import { ExportacionesTypeOrmAdapter } from './infrastructure/exportaciones-typeorm.adapter.js';

@Module({
  imports: [AuthModule],
  controllers: [ExportacionesController],
  providers: [
    ExportarBeneficiariosService,
    {
      provide: EXPORTACIONES_REPOSITORIO,
      useClass: ExportacionesTypeOrmAdapter,
    },
    { provide: GENERADOR_EXCEL, useClass: ExcelJsAdapter },
  ],
})
export class ExportacionesModule {}
