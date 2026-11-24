import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
  ACTA_DESCARTE_REPOSITORY_PORT,
  type ActaDescarteRepositoryPort,
  PDF_GENERATOR_PORT,
  type PdfGeneratorPort,
} from '../../domain/ports/acta-descarte-repository.port.js';
import { QueryActasDescarteDto } from '../../dto/query-actas-descarte.dto.js';

@Injectable()
export class ConsultarActasDescarteUseCase {
  constructor(
    @Inject(ACTA_DESCARTE_REPOSITORY_PORT)
    private readonly actaRepo: ActaDescarteRepositoryPort,
    @Inject(PDF_GENERATOR_PORT)
    private readonly pdfGenerator: PdfGeneratorPort,
  ) {}

  async executeListar(query: QueryActasDescarteDto) {
    const page = query.page && query.page > 0 ? query.page : 1;
    const limit = query.limit && query.limit > 0 ? query.limit : 10;

    return this.actaRepo.search({
      page,
      limit,
      estado: query.estado,
      tipoDonante: query.tipoDonante,
      busqueda: query.busqueda,
    });
  }

  async executeObtenerPorId(id: string) {
    const acta = await this.actaRepo.findById(id);
    if (!acta) {
      throw new NotFoundException(`Acta de descarte con ID ${id} no encontrada`);
    }
    return acta;
  }

  async executeExportarPdf(id: string): Promise<Buffer> {
    const acta = await this.executeObtenerPorId(id);
    return this.pdfGenerator.generarPdfActa(acta);
  }
}
