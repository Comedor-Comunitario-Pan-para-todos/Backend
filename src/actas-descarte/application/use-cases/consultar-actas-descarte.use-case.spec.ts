import { NotFoundException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  EstadoActaEnum,
  TipoDonanteEnum,
} from '../../dto/crear-acta-descarte.dto.js';
import { ConsultarActasDescarteUseCase } from './consultar-actas-descarte.use-case.js';
import { ActaDescarteModel } from '../../domain/models/acta-descarte.model.js';
import type {
  ActaDescarteRepositoryPort,
  PdfGeneratorPort,
} from '../../domain/ports/acta-descarte-repository.port.js';

describe('ConsultarActasDescarteUseCase', () => {
  let useCase: ConsultarActasDescarteUseCase;
  let mockRepo: ActaDescarteRepositoryPort;
  let mockPdf: PdfGeneratorPort;

  const actaEjemplo = new ActaDescarteModel(
    'uuid-acta-1',
    'ACTA-2026-0001',
    'DON-1',
    'Lentejas',
    50,
    'KG',
    TipoDonanteEnum.COMUNITARIO,
    'Humedad',
    EstadoActaEnum.AUTORIZADA,
    [],
    'user-1',
  );

  beforeEach(() => {
    mockRepo = {
      save: vi.fn(),
      findById: vi.fn().mockImplementation((id: string) =>
        Promise.resolve(id === 'uuid-acta-1' ? actaEjemplo : null),
      ),
      search: vi.fn().mockResolvedValue({
        data: [actaEjemplo],
        meta: { total: 1, page: 1, limit: 10, totalPages: 1 },
      }),
      generarSiguienteNumeroActa: vi.fn(),
    };

    mockPdf = {
      generarPdfActa: vi.fn().mockResolvedValue(Buffer.from('%PDF-1.4 TEST')),
    };

    useCase = new ConsultarActasDescarteUseCase(mockRepo, mockPdf);
  });

  it('debe listar actas con paginación correctamente', async () => {
    const res = await useCase.executeListar({ page: 1, limit: 10 });
    expect(res.data).toHaveLength(1);
    expect(mockRepo.search).toHaveBeenCalledWith(
      expect.objectContaining({ page: 1, limit: 10 }),
    );
  });

  it('debe obtener un acta por ID', async () => {
    const res = await useCase.executeObtenerPorId('uuid-acta-1');
    expect(res.id).toBe('uuid-acta-1');
    expect(res.numeroActa).toBe('ACTA-2026-0001');
  });

  it('debe lanzar NotFoundException si el acta no existe', async () => {
    await expect(useCase.executeObtenerPorId('no-existe')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('debe exportar el PDF del acta usando el adaptador', async () => {
    const pdf = await useCase.executeExportarPdf('uuid-acta-1');
    expect(pdf).toBeInstanceOf(Buffer);
    expect(mockPdf.generarPdfActa).toHaveBeenCalledWith(actaEjemplo);
  });
});
