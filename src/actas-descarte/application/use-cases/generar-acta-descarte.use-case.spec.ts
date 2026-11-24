import { BadRequestException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  EstadoActaEnum,
  TipoDonanteEnum,
} from '../../dto/crear-acta-descarte.dto.js';
import { GenerarActaDescarteUseCase } from './generar-acta-descarte.use-case.js';
import {
  ActaDescarteModel,
} from '../../domain/models/acta-descarte.model.js';
import type { ActaDescarteRepositoryPort } from '../../domain/ports/acta-descarte-repository.port.js';

describe('GenerarActaDescarteUseCase', () => {
  let useCase: GenerarActaDescarteUseCase;
  let mockRepo: ActaDescarteRepositoryPort;

  beforeEach(() => {
    mockRepo = {
      save: vi.fn().mockImplementation((data) =>
        Promise.resolve(
          new ActaDescarteModel(
            'uuid-acta-1',
            data.numeroActa,
            data.donacionOrigenId,
            data.insumo,
            data.cantidad,
            data.unidadMedida,
            data.tipoDonante,
            data.motivo,
            data.estado ?? EstadoActaEnum.PENDIENTE,
            data.evidencias ?? [],
            data.generadaPorId,
          ),
        ),
      ),
      findById: vi.fn(),
      search: vi.fn(),
      generarSiguienteNumeroActa: vi.fn().mockResolvedValue('ACTA-2026-0001'),
    };

    useCase = new GenerarActaDescarteUseCase(mockRepo);
  });

  it('debe generar un acta en estado PENDIENTE con evidencia para donante CORPORATIVO', async () => {
    const dto = {
      donacionOrigenId: 'DON-POLLO-1',
      insumo: 'Pollo congelado',
      cantidad: 30,
      unidadMedida: 'KG',
      tipoDonante: TipoDonanteEnum.CORPORATIVO,
      motivo: 'Pérdida de temperatura en transporte',
      evidencias: [
        {
          url: 'https://cdn.comedor.org/foto1.jpg',
          mimeType: 'image/jpeg',
          descripcion: 'Termómetro marcando 18°C',
        },
      ],
    };

    const resultado = await useCase.execute(dto, 'voluntario-123');

    expect(resultado).toBeDefined();
    expect(resultado.numeroActa).toBe('ACTA-2026-0001');
    expect(resultado.estado).toBe(EstadoActaEnum.PENDIENTE);
    expect(resultado.evidencias).toHaveLength(1);
    expect(mockRepo.save).toHaveBeenCalledTimes(1);
  });

  it('debe rechazar con BadRequestException si el donante es CORPORATIVO y no adjunta fotografías', async () => {
    const dto = {
      donacionOrigenId: 'DON-POLLO-1',
      insumo: 'Pollo congelado',
      cantidad: 30,
      unidadMedida: 'KG',
      tipoDonante: TipoDonanteEnum.CORPORATIVO,
      motivo: 'Pérdida de cadena de frío',
      evidencias: [],
    };

    await expect(useCase.execute(dto, 'voluntario-123')).rejects.toThrow(
      BadRequestException,
    );
  });

  it('debe permitir generar el acta sin fotografías si el donante es COMUNITARIO', async () => {
    const dto = {
      donacionOrigenId: 'DON-VECINOS-1',
      insumo: 'Yuca y plátano',
      cantidad: 10,
      unidadMedida: 'KG',
      tipoDonante: TipoDonanteEnum.COMUNITARIO,
      motivo: 'Maduración excesiva',
    };

    const resultado = await useCase.execute(dto, 'voluntario-123');
    expect(resultado).toBeDefined();
    expect(resultado.tipoDonante).toBe(TipoDonanteEnum.COMUNITARIO);
    expect(resultado.evidencias).toHaveLength(0);
  });
});
