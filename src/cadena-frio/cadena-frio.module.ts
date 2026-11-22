import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { CadenaFrioService } from './application/cadena-frio.service.js';
import { CadenaFrioController } from './cadena-frio.controller.js';
import { CADENA_FRIO_REPOSITORY } from './domain/ports/cadena-frio-repository.port.js';
import { CadenaFrioTypeOrmAdapter } from './infrastructure/adapters/out/persistence/cadena-frio-typeorm.adapter.js';

@Module({
  imports: [AuthModule],
  controllers: [CadenaFrioController],
  providers: [
    CadenaFrioService,
    { provide: CADENA_FRIO_REPOSITORY, useClass: CadenaFrioTypeOrmAdapter },
  ],
})
export class CadenaFrioModule {}
