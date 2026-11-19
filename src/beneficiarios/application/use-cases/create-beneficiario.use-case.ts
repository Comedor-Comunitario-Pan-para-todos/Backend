import { ConflictException, Inject, Injectable } from '@nestjs/common';
import { CreateBeneficiarioDto } from '../../dto/create-beneficiario.dto.js';
import {
  BENEFICIARIO_REPOSITORY_PORT,
  type BeneficiarioRepositoryPort,
} from '../../domain/ports/beneficiario-repository.port.js';

@Injectable()
export class CreateBeneficiarioUseCase {
  constructor(
    @Inject(BENEFICIARIO_REPOSITORY_PORT)
    private readonly beneficiarioRepo: BeneficiarioRepositoryPort,
  ) {}

  async execute(dto: CreateBeneficiarioDto) {
    const existe = await this.beneficiarioRepo.findByDocumento(dto.numeroDocumento);
    if (existe) {
      throw new ConflictException(
        `Ya existe un beneficiario registrado con el documento ${dto.numeroDocumento}`,
      );
    }

    return this.beneficiarioRepo.save(dto);
  }
}
