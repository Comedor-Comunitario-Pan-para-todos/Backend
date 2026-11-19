import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
  BENEFICIARIO_REPOSITORY_PORT,
  type BeneficiarioRepositoryPort,
} from '../../domain/ports/beneficiario-repository.port.js';
import { QueryBeneficiariosDto } from '../../dto/query-beneficiarios.dto.js';
import { UpdateBeneficiarioDto } from '../../dto/update-beneficiario.dto.js';

@Injectable()
export class ManageBeneficiarioUseCase {
  constructor(
    @Inject(BENEFICIARIO_REPOSITORY_PORT)
    private readonly beneficiarioRepo: BeneficiarioRepositoryPort,
  ) {}

  async findAll(query: QueryBeneficiariosDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    return this.beneficiarioRepo.search({
      page,
      limit,
      busqueda: query.search,
    });
  }

  async findOne(id: string) {
    const beneficiario = await this.beneficiarioRepo.findById(id);
    if (!beneficiario) {
      throw new NotFoundException(`Beneficiario con ID ${id} no encontrado`);
    }
    return beneficiario;
  }

  async update(id: string, dto: UpdateBeneficiarioDto) {
    await this.findOne(id);
    return this.beneficiarioRepo.save(Object.assign({ id }, dto));
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.beneficiarioRepo.softDelete(id);
    return { mensaje: 'Beneficiario eliminado correctamente' };
  }
}
