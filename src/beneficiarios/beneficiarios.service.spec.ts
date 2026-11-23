import { MetodoConsentimiento } from '../consentimientos/domain/consentimiento.js';
import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { QueryFailedError } from 'typeorm';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { BeneficiariosService } from './beneficiarios.service.js';
import { CreateBeneficiarioDto } from './dto/create-beneficiario.dto.js';
import { UpdateBeneficiarioDto } from './dto/update-beneficiario.dto.js';
import { NivelRegistroEnum } from './enums/nivel-registro.enum.js';

const consentimiento = { aceptado: true, versionTexto: 1, finalidad: 'ATENCION_ALIMENTARIA' as const, metodo: MetodoConsentimiento.VERBAL_CON_TESTIGO };

const crearBeneficiarioMock = (overrides: Record<string, unknown> = {}) => ({
  id: 'uuid-beneficiario-1',
  nivelRegistro: NivelRegistroEnum.EXTENDIDO,
  tipoDocumento: 'CC',
  numeroDocumento: '1088234567',
  nombres: 'María Camila',
  apellidos: 'González López',
  fechaNacimiento: '1995-04-15',
  esMenorEdad: false,
  barrio: 'El Jardín',
  telefono: '3151234567',
  clasificacionSocioeconomica: 'C1',
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

describe('BeneficiariosService (RF-01 y RF-02)', () => {
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

  const manager = {
    getRepository: () => mockRepository,
    insert: vi.fn(),
  };
  Object.assign(mockRepository, {
    manager: { transaction: (work: (transaction: typeof manager) => unknown) => work(manager) },
  });

  beforeEach(() => {
    vi.clearAllMocks();
    service = new BeneficiariosService(mockRepository as any);
  });

  describe('create (Registro con niveles de sensibilidad - RF-01, RF-02, HU-13)', () => {
    const dtoExtendido: CreateBeneficiarioDto = {
      nivelRegistro: NivelRegistroEnum.EXTENDIDO,
      tipoDocumento: 'CC',
      numeroDocumento: '1088234567',
      nombres: 'María Camila',
      apellidos: 'González López',
      fechaNacimiento: '1995-04-15',
      barrio: 'El Jardín',
      telefono: '3151234567',
      clasificacionSocioeconomica: 'C1',
      autorizaTratamientoDatos: true,
      consentimiento,
    };

    const dtoBasico: CreateBeneficiarioDto = {
      nivelRegistro: NivelRegistroEnum.BASICO,
      nombres: 'Juan Carlos',
      apellidos: 'Pérez Gómez',
      fechaNacimiento: '1988-11-20',
      barrio: 'San Nicolás',
      autorizaTratamientoDatos: true,
      consentimiento,
    };

    it('debe registrar un beneficiario con nivel EXTENDIDO exitosamente', async () => {
      mockQueryBuilder.getOne.mockResolvedValue(null);
      mockRepository.save.mockResolvedValue(crearBeneficiarioMock());

      const resultado = await service.create(dtoExtendido, 'operador');

      expect(resultado).toBeDefined();
      expect(resultado.numeroDocumento).toBe('1088234567');
      expect(mockRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          nivelRegistro: NivelRegistroEnum.EXTENDIDO,
          numeroDocumento: '1088234567',
          tipoDocumento: 'CC',
          clasificacionSocioeconomica: 'C1',
          esMenorEdad: false,
        }),
      );
      expect(mockRepository.save).toHaveBeenCalled();
    });

    it('debe registrar con nivel BÁSICO por defecto y aplicar minimización de datos (Ley 1581 / RF-02)', async () => {
      mockQueryBuilder.getOne.mockResolvedValue(null);
      mockRepository.save.mockResolvedValue(
        crearBeneficiarioMock({
          nivelRegistro: NivelRegistroEnum.BASICO,
          tipoDocumento: null,
          numeroDocumento: null,
          telefono: null,
          clasificacionSocioeconomica: null,
        }),
      );

      // Enviamos campos extendidos en un DTO que declara nivel BÁSICO
      const dtoBasicoConCamposExtras: CreateBeneficiarioDto = {
        ...dtoBasico,
        tipoDocumento: 'CC',
        numeroDocumento: '99999999',
        telefono: '3100000000',
        clasificacionSocioeconomica: 'B2',
      };

      const resultado = await service.create(dtoBasicoConCamposExtras, 'operador');

      expect(resultado).toBeDefined();
      const calledWith = mockRepository.create.mock.calls[0][0];
      expect(calledWith.nivelRegistro).toBe(NivelRegistroEnum.BASICO);
      expect(calledWith.nombres).toBe('Juan Carlos');
      expect(calledWith.apellidos).toBe('Pérez Gómez');
      expect(calledWith.tipoDocumento).toBeUndefined();
      expect(calledWith.numeroDocumento).toBeUndefined();
      expect(calledWith.telefono).toBeUndefined();
      expect(calledWith.clasificacionSocioeconomica).toBeUndefined();
    });

    it('debe calcular esMenorEdad = true cuando la fecha de nacimiento corresponde a un menor (<18 años)', async () => {
      mockQueryBuilder.getOne.mockResolvedValue(null);
      mockRepository.save.mockResolvedValue(crearBeneficiarioMock({ esMenorEdad: true }));

      // Nacido hace 10 años
      const hoy = new Date();
      const hace10Anios = `${hoy.getFullYear() - 10}-01-01`;

      await service.create({
        nivelRegistro: NivelRegistroEnum.BASICO,
        nombres: 'Santiago',
        apellidos: 'Mora',
        fechaNacimiento: hace10Anios,
        autorizaTratamientoDatos: true,
        consentimiento,
      }, 'operador');

      expect(mockRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          esMenorEdad: true,
        }),
      );
    });

    it('debe rechazar con BadRequestException si en nivel EXTENDIDO se envía tipoDocumento sin numeroDocumento', async () => {
      const dtoIncompleto: CreateBeneficiarioDto = {
        nivelRegistro: NivelRegistroEnum.EXTENDIDO,
        tipoDocumento: 'CC',
        nombres: 'Carlos',
        apellidos: 'Ruiz',
        fechaNacimiento: '1990-05-10',
        autorizaTratamientoDatos: true,
        consentimiento,
      };

      await expect(service.create(dtoIncompleto, 'operador')).rejects.toThrow(BadRequestException);
      expect(mockRepository.save).not.toHaveBeenCalled();
    });

    it('debe rechazar con BadRequestException si en nivel EXTENDIDO se envía numeroDocumento sin tipoDocumento', async () => {
      const dtoIncompleto: CreateBeneficiarioDto = {
        nivelRegistro: NivelRegistroEnum.EXTENDIDO,
        numeroDocumento: '12345678',
        nombres: 'Carlos',
        apellidos: 'Ruiz',
        fechaNacimiento: '1990-05-10',
        autorizaTratamientoDatos: true,
        consentimiento,
      };

      await expect(service.create(dtoIncompleto, 'operador')).rejects.toThrow(BadRequestException);
      expect(mockRepository.save).not.toHaveBeenCalled();
    });

    it('debe permitir registrar una persona sin documento en nivel extendido (situación humanitaria / RNF-15)', async () => {
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

      const resultado = await service.create(dtoBasico, 'operador');

      expect(resultado).toBeDefined();
      expect(mockRepository.save).toHaveBeenCalled();
    });

    it('debe rechazar duplicados de personas sin documento con los mismos nombres, fecha de nacimiento y barrio (RNF-15)', async () => {
      mockQueryBuilder.getOne.mockResolvedValue(crearBeneficiarioMock());

      await expect(service.create(dtoBasico, 'operador')).rejects.toThrow(ConflictException);
      expect(mockRepository.save).not.toHaveBeenCalled();
    });

    it('debe lanzar ConflictException (409) si ya existe un beneficiario con ese documento', async () => {
      mockQueryBuilder.getOne.mockResolvedValue(crearBeneficiarioMock());

      await expect(service.create(dtoExtendido, 'operador')).rejects.toThrow(ConflictException);
      expect(mockRepository.save).not.toHaveBeenCalled();
    });

    it('debe capturar el error UNIQUE de base de datos ER_DUP_ENTRY y responder 409', async () => {
      mockQueryBuilder.getOne.mockResolvedValue(null);
      mockRepository.save.mockRejectedValue(errorDocumentoDuplicado());

      await expect(service.create(dtoExtendido, 'operador')).rejects.toThrow(ConflictException);
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
