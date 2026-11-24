import {
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  EXCEPCION_ENTREGA_REPOSITORY_PORT,
  type ExcepcionEntregaRepositoryPort,
  type ExcepcionPaginatedResult,
  type ExcepcionPaginationOptions,
} from '../../domain/ports/excepcion-entrega-repository.port.js';
import { ExcepcionEntregaModel } from '../../domain/models/excepcion-entrega.model.js';

@Injectable()
export class ConsultarExcepcionesUseCase {
  constructor(
    @Inject(EXCEPCION_ENTREGA_REPOSITORY_PORT)
    private readonly excepcionRepo: ExcepcionEntregaRepositoryPort,
  ) {}

  async execute(options: ExcepcionPaginationOptions): Promise<ExcepcionPaginatedResult> {
    const page = options.page > 0 ? options.page : 1;
    const limit = options.limit > 0 ? options.limit : 10;
    return this.excepcionRepo.findAll({ ...options, page, limit });
  }

  async findById(id: string): Promise<ExcepcionEntregaModel> {
    const excepcion = await this.excepcionRepo.findById(id);
    if (!excepcion) {
      throw new NotFoundException(`Excepción de entrega con ID '${id}' no encontrada`);
    }
    return excepcion;
  }

  async findByTurnoId(turnoId: string): Promise<ExcepcionEntregaModel> {
    const excepcion = await this.excepcionRepo.findByTurnoId(turnoId);
    if (!excepcion) {
      throw new NotFoundException(
        `No se encontró ninguna excepción de entrega vinculada al turno '${turnoId}'`,
      );
    }
    return excepcion;
  }
}
