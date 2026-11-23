import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
  DESCARTE_REPOSITORY_PORT,
  type DescarteRepositoryPort,
} from '../../domain/ports/descarte-repository.port.js';
import { QueryDescartesDto } from '../../dto/query-descartes.dto.js';

@Injectable()
export class ConsultarDescartesUseCase {
  constructor(
    @Inject(DESCARTE_REPOSITORY_PORT)
    private readonly descarteRepo: DescarteRepositoryPort,
  ) {}

  async executeListar(query: QueryDescartesDto) {
    const page = query.page && query.page > 0 ? query.page : 1;
    const limit = query.limit && query.limit > 0 ? query.limit : 10;
    const desde = query.desde ? new Date(query.desde) : undefined;
    const hasta = query.hasta ? new Date(query.hasta) : undefined;

    return this.descarteRepo.search({
      page,
      limit,
      busqueda: query.busqueda,
      desde,
      hasta,
    });
  }

  async executeObtenerPorId(id: string) {
    const descarte = await this.descarteRepo.findById(id);
    if (!descarte) {
      throw new NotFoundException(`Registro de descarte con ID ${id} no encontrado`);
    }
    return descarte;
  }
}
