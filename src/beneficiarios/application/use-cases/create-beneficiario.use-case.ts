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
    if (dto.numeroDocumento) {
      const existe = await this.beneficiarioRepo.findByDocumento(dto.numeroDocumento);
      if (existe) {
        throw new ConflictException(
          `Ya existe un beneficiario registrado con el documento ${dto.numeroDocumento}`,
        );
      }
    } else {
      const existe = await this.beneficiarioRepo.findByDatosBasicos(
        dto.nombres,
        dto.apellidos,
        dto.fechaNacimiento,
        dto.barrio,
      );
      if (existe) {
        throw new ConflictException(
          'Ya existe un beneficiario registrado con los mismos nombres, apellidos, fecha de nacimiento y barrio',
        );
      }
    }

    return this.beneficiarioRepo.save(dto);
  }
}
