import { BadRequestException, ConflictException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  EstadoLoteEnum,
  LoteInventarioModel,
  UnidadMedidaInsumoEnum,
} from '../../domain/models/lote-inventario.model.js';
import type { InventarioRepositoryPort } from '../../domain/ports/inventario-repository.port.js';
import type { CrearLoteInventarioDto } from '../../dto/crear-lote-inventario.dto.js';
import { RegistrarLoteInventarioUseCase } from './registrar-lote-inventario.use-case.js';

describe('RegistrarLoteInventarioUseCase (RF-08)', () => {
  let useCase: RegistrarLoteInventarioUseCase;
  let mockRepo: InventarioRepositoryPort;

  beforeEach(() => {
    mockRepo = {
      save: vi.fn().mockImplementation((lote: LoteInventarioModel) => Promise.resolve(lote)),
      findById: vi.fn(),
      findByCodigoLote: vi.fn().mockResolvedValue(null),
      generarSiguienteCodigoLote: vi.fn().mockResolvedValue('LOTE-2026-ARROZ-0001'),
      search: vi.fn(),
      findDisponiblesPorInsumoOrdenadoPorVencimiento: vi.fn(),
    };
    useCase = new RegistrarLoteInventarioUseCase(mockRepo);
  });

  const dtoValido: CrearLoteInventarioDto = {
    nombreInsumo: 'Arroz Diana',
    categoria: 'Granos',
    cantidadInicial: 100,
    unidadMedida: UnidadMedidaInsumoEnum.KG,
    fechaRecepcion: new Date('2026-11-24T10:00:00.000Z'),
    fechaVencimiento: new Date('2027-05-24T10:00:00.000Z'),
    donacionOrigenId: 'DON-01',
    nombreDonante: 'Banco de Alimentos',
    observaciones: 'Lote en óptimas condiciones',
  };

  it('debe registrar exitosamente un lote cuando fechaVencimiento es posterior a fechaRecepcion', async () => {
    const resultado = await useCase.execute(dtoValido, 'user-voluntario-1');

    expect(resultado).toBeDefined();
    expect(resultado.nombreInsumo).toBe('Arroz Diana');
    expect(resultado.cantidadInicial).toBe(100);
    expect(resultado.cantidadActual).toBe(100);
    expect(resultado.estado).toBe(EstadoLoteEnum.DISPONIBLE);
    expect(resultado.codigoLote).toBe('LOTE-2026-ARROZ-0001');
    expect(mockRepo.save).toHaveBeenCalledTimes(1);
  });

  it('debe lanzar BadRequestException si la fecha de vencimiento es igual a la de recepción', async () => {
    const fecha = new Date('2026-11-24T10:00:00.000Z');
    const dtoInvalido = { ...dtoValido, fechaRecepcion: fecha, fechaVencimiento: fecha };

    await expect(useCase.execute(dtoInvalido, 'user-voluntario-1')).rejects.toThrow(
      BadRequestException,
    );
    expect(mockRepo.save).not.toHaveBeenCalled();
  });

  it('debe lanzar BadRequestException si la fecha de vencimiento es anterior a la de recepción', async () => {
    const dtoInvalido = {
      ...dtoValido,
      fechaRecepcion: new Date('2026-11-24T10:00:00.000Z'),
      fechaVencimiento: new Date('2026-11-20T10:00:00.000Z'),
    };

    await expect(useCase.execute(dtoInvalido, 'user-voluntario-1')).rejects.toThrow(
      BadRequestException,
    );
    expect(mockRepo.save).not.toHaveBeenCalled();
  });

  it('debe lanzar ConflictException si el código de lote manual ya existe', async () => {
    vi.mocked(mockRepo.findByCodigoLote).mockResolvedValue(
      new LoteInventarioModel(
        '1',
        'COD-EXISTENTE',
        'Arroz',
        'Granos',
        50,
        50,
        UnidadMedidaInsumoEnum.KG,
        new Date(),
        new Date(Date.now() + 1000000),
        EstadoLoteEnum.DISPONIBLE,
      ),
    );

    const dtoConCodigoExistente = { ...dtoValido, codigoLote: 'COD-EXISTENTE' };

    await expect(useCase.execute(dtoConCodigoExistente, 'user-voluntario-1')).rejects.toThrow(
      ConflictException,
    );
    expect(mockRepo.save).not.toHaveBeenCalled();
  });
});
