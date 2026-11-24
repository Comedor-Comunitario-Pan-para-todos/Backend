import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConsultarInventarioUseCase } from './application/use-cases/consultar-inventario.use-case.js';
import { RegistrarConsumoInsumoUseCase } from './application/use-cases/registrar-consumo-insumo.use-case.js';
import { RegistrarLoteInventarioUseCase } from './application/use-cases/registrar-lote-inventario.use-case.js';
import { INVENTARIO_REPOSITORY_PORT } from './domain/ports/inventario-repository.port.js';
import { InventarioTypeOrmAdapter } from './infrastructure/adapters/out/persistence/inventario-typeorm.adapter.js';
import { LoteInventarioEntity } from './infrastructure/adapters/out/persistence/lote-inventario.entity.js';
import { InventarioController } from './inventario.controller.js';

@Module({
  imports: [TypeOrmModule.forFeature([LoteInventarioEntity])],
  controllers: [InventarioController],
  providers: [
    RegistrarLoteInventarioUseCase,
    ConsultarInventarioUseCase,
    RegistrarConsumoInsumoUseCase,
    {
      provide: INVENTARIO_REPOSITORY_PORT,
      useClass: InventarioTypeOrmAdapter,
    },
  ],
  exports: [
    RegistrarLoteInventarioUseCase,
    ConsultarInventarioUseCase,
    RegistrarConsumoInsumoUseCase,
    INVENTARIO_REPOSITORY_PORT,
  ],
})
export class InventarioModule {}
