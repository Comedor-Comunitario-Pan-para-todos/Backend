import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module.js';
import { BeneficiariosService } from './beneficiarios.service.js';
import { BeneficiariosController } from './beneficiarios.controller.js';
import { Beneficiario } from './entities/beneficiario.entity.js';

@Module({
  imports: [TypeOrmModule.forFeature([Beneficiario]), AuthModule],
  controllers: [BeneficiariosController],
  providers: [BeneficiariosService],
  exports: [BeneficiariosService],
})
export class BeneficiariosModule { }