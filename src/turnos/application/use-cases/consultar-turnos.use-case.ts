import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { TurnoModel } from '../../domain/models/turno.model.js';
import {
  TURNO_REPOSITORY_PORT,
  type TurnoPaginationOptions,
  type TurnoPaginatedResult,
  type TurnoRepositoryPort,
} from '../../domain/ports/turno-repository.port.js';

@Injectable()
export class ConsultarTurnosUseCase {
  constructor(
    @Inject(TURNO_REPOSITORY_PORT)
    private readonly turnoRepo: TurnoRepositoryPort,
  ) {}

  async listar(options: TurnoPaginationOptions): Promise<TurnoPaginatedResult> {
    return this.turnoRepo.findAll(options);
  }

  async consultarPorId(id: string): Promise<TurnoModel> {
    const turno = await this.turnoRepo.findById(id);
    if (!turno) {
      throw new NotFoundException(`Turno con ID ${id} no encontrado`);
    }
    return turno;
  }

  async consultarPorBeneficiarioHoy(beneficiarioId: string): Promise<TurnoModel | null> {
    const fecha = new Date().toISOString().slice(0, 10);
    return this.turnoRepo.findByBeneficiarioYFecha(beneficiarioId, fecha);
  }
}
