import { ConflictException, NotFoundException } from '@nestjs/common';
import { QueryFailedError } from 'typeorm';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { BeneficiariosService } from './beneficiarios.service.js';
import { CreateBeneficiarioDto } from './dto/create-beneficiario.dto.js';
import { UpdateBeneficiarioDto } from './dto/update-beneficiario.dto.js';

const crearBeneficiarioMock = (overrides: Record<string, unknown> = {}) => ({
  id: 'uuid-beneficiario-1',
  tipoDocumento: 'CC',
  numeroDocumento: '1088234567',
  nombres: 'María Camila',
  apellidos: 'González López',
  fechaNacimiento: '1995-04-15',
  barrio: 'El Jardín',
  telefono: '3151234567',
  autorizaTratamientoDatos: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: null,
  ...overrides,
});

const errorDocumentoDuplicado = () =>
  new QueryFailedError(
    'INSERT INTO beneficiarios',
    [],
    Object.assign(new Error('Duplicate entry'), {
      code: 'ER_DUP_ENTRY',
      errno: 1062,
    }),
  );

describe('BeneficiariosService (RF-01)', () => {
  let service: BeneficiariosService;

  const mockQueryBuilder = {
    where: vi.fn().mockReturnThis(),
    andWhere: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockReturnThis(),
    skip: vi.fn().mockReturnThis(),
    take: vi.fn().mockReturnThis(),
    getOne: vi.fn(),
    getManyAndCount: vi.fn(),
  };

  const mockRepository = {
    create: vi.fn((dto: any) => ({ ...dto })),
    save: vi.fn((entity: any) => Promise.resolve({ id: 'uuid-nuevo', ...entity })),
    findOne: vi.fn(),
    createQueryBuilder: vi.fn(() => mockQueryBuilder),
    softRemove: vi.fn((entity: any) => Promise.resolve(entity)),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    service = new BeneficiariosService(mockRepository as any);
  });

  describe('create (Registro de beneficiarios con y sin documento - RF-01, RNF-15)', () => {
    const dtoConDocumento: CreateBeneficiarioDto = {
      tipoDocumento: 'CC',
      numeroDocumento: '1088234567',
      nombres: 'María Camila',
      apellidos: 'González López',
      fechaNacimiento: '1995-04-15',
      barrio: 'El Jardín',
      telefono: '3151234567',
      autorizaTratamientoDatos: true,
    };

    const dtoSinDocumento: CreateBeneficiarioDto = {
      nombres: 'Juan Carlos',
      apellidos: 'Pérez Gómez',
      fechaNacimiento: '1988-11-20',
      barrio: 'San Nicolás',
      autorizaTratamientoDatos: true,
    };

    it('debe registrar un beneficiario exitosamente cuando el documento no existe', async () => {
      mockQueryBuilder.getOne.mockResolvedValue(null);
      mockRepository.save.mockResolvedValue(crearBeneficiarioMock());

      const resultado = await service.create(dtoConDocumento);

      expect(resultado).toBeDefined();
      expect(resultado.numeroDocumento).toBe('1088234567');
      expect(mockRepository.create).toHaveBeenCalledWith(dtoConDocumento);
      expect(mockRepository.save).toHaveBeenCalled();
    });

    it('debe permitir registrar una persona sin documento (indocumentado / situación de calle)', async () => {
      mockQueryBuilder.getOne.mockResolvedValue(null);
      mockRepository.save.mockResolvedValue(
        crearBeneficiarioMock({
          tipoDocumento: null,
          numeroDocumento: null,
          nombres: 'Juan Carlos',
          apellidos: 'Pérez Gómez',
          barrio: 'San Nicolás',
        }),
      );

      const resultado = await service.create(dtoSinDocumento);

      expect(resultado).toBeDefined();
      expect(mockRepository.create).toHaveBeenCalledWith(dtoSinDocumento);
      expect(mockRepository.save).toHaveBeenCalled();
    });

    it('debe rechazar duplicados de personas sin documento con los mismos nombres, fecha de nacimiento y barrio (RNF-15)', async () => {
      mockQueryBuilder.getOne.mockResolvedValue(crearBeneficiarioMock()); // Ya existe uno con esos datos básicos

      await expect(service.create(dtoSinDocumento)).rejects.toThrow(ConflictException);
      expect(mockRepository.save).not.toHaveBeenCalled();
    });

    it('debe lanzar ConflictException (409) si ya existe un beneficiario con ese documento', async () => {
      mockQueryBuilder.getOne.mockResolvedValue(crearBeneficiarioMock());

      await expect(service.create(dtoConDocumento)).rejects.toThrow(ConflictException);
      expect(mockRepository.save).not.toHaveBeenCalled();
    });

    it('debe capturar el error UNIQUE de base de datos ER_DUP_ENTRY y responder 409', async () => {
      mockQueryBuilder.getOne.mockResolvedValue(null);
      mockRepository.save.mockRejectedValue(errorDocumentoDuplicado());

      await expect(service.create(dtoConDocumento)).rejects.toThrow(ConflictException);
    });
  });

  describe('validarDocumento (Validación rápida en tiempo real normalizando documento)', () => {
    it('debe normalizar y retornar { existe: true } si el documento ya se encuentra registrado', async () => {
      mockRepository.findOne.mockResolvedValue(crearBeneficiarioMock());

      const res = await service.validarDocumento('10.882.345-67');

      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { numeroDocumento: '1088234567' },
      });
      expect(res.existe).toBe(true);
      expect(res.beneficiario).toBeDefined();
    });

    it('debe retornar { existe: false } si el documento no está registrado o viene vacío', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      const res = await service.validarDocumento('99999999');

      expect(res.existe).toBe(false);
      expect(res.beneficiario).toBeNull();
    });
  });

  describe('findAll (Búsqueda en tiempo real por nombre completo y paginación)', () => {
    it('debe listar beneficiarios paginados correctamente', async () => {
      const lista = [crearBeneficiarioMock()];
      mockQueryBuilder.getManyAndCount.mockResolvedValue([lista, 1]);

      const res = await service.findAll({ page: 1, limit: 10 });

      expect(res.data).toEqual(lista);
      expect(res.meta).toEqual({ total: 1, page: 1, limit: 10, totalPages: 1 });
    });

    it('debe buscar tanto por partes individuales como por nombre completo (CONCAT)', async () => {
      mockQueryBuilder.getManyAndCount.mockResolvedValue([[], 0]);

      await service.findAll({ page: 1, limit: 10, search: 'María Camila' });

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        expect.stringContaining("CONCAT(beneficiario.nombres, ' ', beneficiario.apellidos)"),
        expect.objectContaining({ search: '%María Camila%' }),
      );
    });

    it('debe filtrar por barrio si se proporciona', async () => {
      mockQueryBuilder.getManyAndCount.mockResolvedValue([[], 0]);

      await service.findAll({ page: 1, limit: 10, barrio: 'El Jardín' });

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'beneficiario.barrio = :barrio',
        { barrio: 'El Jardín' },
      );
    });
  });

  describe('findOne', () => {
    it('debe retornar un beneficiario por su ID', async () => {
      const mock = crearBeneficiarioMock();
      mockRepository.findOne.mockResolvedValue(mock);

      const res = await service.findOne('uuid-1');
      expect(res).toEqual(mock);
    });

    it('debe lanzar NotFoundException si el ID no existe', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('uuid-inexistente')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('debe actualizar los datos de un beneficiario', async () => {
      const mock = crearBeneficiarioMock();
      mockRepository.findOne.mockResolvedValue(mock);
      mockRepository.save.mockResolvedValue({ ...mock, telefono: '3000000000' });

      const dto: UpdateBeneficiarioDto = { telefono: '3000000000' };
      const res = await service.update('uuid-1', dto);

      expect(res.telefono).toBe('3000000000');
    });

    it('debe validar documento disponible si se cambia el documento', async () => {
      const mock = crearBeneficiarioMock({ numeroDocumento: '1088234567' });
      mockRepository.findOne.mockResolvedValue(mock);
      mockQueryBuilder.getOne.mockResolvedValue(crearBeneficiarioMock({ id: 'uuid-otro' }));

      const dto: UpdateBeneficiarioDto = { numeroDocumento: '1111222333' };

      await expect(service.update('uuid-1', dto)).rejects.toThrow(ConflictException);
    });
  });

  describe('remove (Borrado lógico)', () => {
    it('debe desactivar un beneficiario usando softRemove', async () => {
      const mock = crearBeneficiarioMock();
      mockRepository.findOne.mockResolvedValue(mock);

      const res = await service.remove('uuid-1');

      expect(mockRepository.softRemove).toHaveBeenCalledWith(mock);
      expect(res.mensaje).toContain('ha sido desactivado correctamente');
    });
  });
});
