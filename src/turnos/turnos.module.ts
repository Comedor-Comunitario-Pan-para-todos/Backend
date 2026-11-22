import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TurnoAtencion } from './entities/turno-atencion.entity.js';
import { TurnosController } from './turnos.controller.js';
import { TurnosService } from './turnos.service.js';
import { EmitirTurnoUseCase } from './application/use-cases/emitir-turno.use-case.js';
import { ConsultarTurnosUseCase } from './application/use-cases/consultar-turnos.use-case.js';
import { CambiarEstadoTurnoUseCase } from './application/use-cases/cambiar-estado-turno.use-case.js';
import { TURNO_REPOSITORY_PORT } from './domain/ports/turno-repository.port.js';
import { TurnoTypeOrmAdapter } from './infrastructure/adapters/out/persistence/turno-typeorm.adapter.js';
import { BeneficiariosModule } from '../beneficiarios/beneficiarios.module.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([TurnoAtencion]),
    BeneficiariosModule,
  ],
  controllers: [TurnosController],
  providers: [
    TurnosService,
    EmitirTurnoUseCase,
    ConsultarTurnosUseCase,
    CambiarEstadoTurnoUseCase,
    {
      provide: TURNO_REPOSITORY_PORT,
      useClass: TurnoTypeOrmAdapter,
    },
  ],
  exports: [
    TurnosService,
    TURNO_REPOSITORY_PORT,
    EmitirTurnoUseCase,
    ConsultarTurnosUseCase,
    CambiarEstadoTurnoUseCase,
    TypeOrmModule,
  ],
})
export class TurnosModule {}
