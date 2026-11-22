import { MetodoConsentimiento } from '../../../consentimientos/domain/consentimiento.js';
import { BadRequestException, ConflictException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CreateBeneficiarioUseCase } from './create-beneficiario.use-case.js';
import { BeneficiarioRepositoryPort } from '../../domain/ports/beneficiario-repository.port.js';
import { NivelRegistroEnum } from '../../enums/nivel-registro.enum.js';
import { BeneficiarioModel } from '../../domain/models/beneficiario.model.js';

const consentimiento = { aceptado: true, versionTexto: 1, finalidad: 'ATENCION_ALIMENTARIA' as const, metodo: MetodoConsentimiento.VERBAL_CON_TESTIGO };

describe('CreateBeneficiarioUseCase (RF-02 / HU-13)', () => {
  let useCase: CreateBeneficiarioUseCase;

  const mockRepo: BeneficiarioRepositoryPort = {
    save: vi.fn((data) =>
      Promise.resolve(
        new BeneficiarioModel(
          'uuid-123',
          data.nivelRegistro,
          data.tipoDocumento ?? null,
          data.numeroDocumento ?? null,
          data.nombres || '',
          data.apellidos || '',
          data.fechaNacimiento || '',
          data.esMenorEdad ?? false,
          data.barrio,
          data.telefono,
          data.clasificacionSocioeconomica,
          data.autorizaTratamientoDatos,
        ),
      ),
    ),
    findByDocumento: vi.fn(),
    findById: vi.fn(),
    findByDatosBasicos: vi.fn(),
    search: vi.fn(),
    softDelete: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    useCase = new CreateBeneficiarioUseCase(mockRepo);
  });

  it('debe registrar un beneficiario con nivel BASICO minimizando campos extendidos', async () => {
    vi.mocked(mockRepo.findByDatosBasicos).mockResolvedValue(null);

    const dto = {
      nivelRegistro: NivelRegistroEnum.BASICO,
      nombres: 'Pedro',
      apellidos: 'Ramírez',
      fechaNacimiento: '1990-01-01',
      barrio: 'Centro',
      autorizaTratamientoDatos: true,
      consentimiento,
      tipoDocumento: 'CC',
      numeroDocumento: '123456',
      telefono: '3120000000',
      clasificacionSocioeconomica: 'A1',
    };

    const resultado = await useCase.execute(dto);

    expect(resultado).toBeDefined();
    expect(mockRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({
        nivelRegistro: NivelRegistroEnum.BASICO,
        nombres: 'Pedro',
        apellidos: 'Ramírez',
        tipoDocumento: undefined,
        numeroDocumento: undefined,
        telefono: undefined,
        clasificacionSocioeconomica: undefined,
      }),
    );
  });

  it('debe registrar con nivel EXTENDIDO preservando documento, teléfono y Sisbén', async () => {
    vi.mocked(mockRepo.findByDocumento).mockResolvedValue(null);

    const dto = {
      nivelRegistro: NivelRegistroEnum.EXTENDIDO,
      nombres: 'Luisa',
      apellidos: 'Fernández',
      fechaNacimiento: '1992-06-15',
      tipoDocumento: 'CC',
      numeroDocumento: '1098765432',
      telefono: '3157778899',
      clasificacionSocioeconomica: 'B1',
      autorizaTratamientoDatos: true,
      consentimiento,
    };

    const resultado = await useCase.execute(dto);

    expect(resultado).toBeDefined();
    expect(mockRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({
        nivelRegistro: NivelRegistroEnum.EXTENDIDO,
        tipoDocumento: 'CC',
        numeroDocumento: '1098765432',
        telefono: '3157778899',
        clasificacionSocioeconomica: 'B1',
        esMenorEdad: false,
      }),
    );
  });

  it('debe calcular esMenorEdad = true cuando fecha de nacimiento es de menor', async () => {
    vi.mocked(mockRepo.findByDatosBasicos).mockResolvedValue(null);

    const hoy = new Date();
    const fechaMenor = `${hoy.getFullYear() - 8}-05-20`;

    const dto = {
      nivelRegistro: NivelRegistroEnum.BASICO,
      nombres: 'Mateo',
      apellidos: 'Gómez',
      fechaNacimiento: fechaMenor,
      autorizaTratamientoDatos: true,
      consentimiento,
    };

    await useCase.execute(dto);

    expect(mockRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({
        esMenorEdad: true,
      }),
    );
  });

  it('debe lanzar BadRequestException si en EXTENDIDO se envía tipoDocumento sin numeroDocumento', async () => {
    const dto = {
      nivelRegistro: NivelRegistroEnum.EXTENDIDO,
      nombres: 'Andrea',
      apellidos: 'Castro',
      fechaNacimiento: '2000-01-01',
      tipoDocumento: 'CC',
      autorizaTratamientoDatos: true,
      consentimiento,
    };

    await expect(useCase.execute(dto)).rejects.toThrow(BadRequestException);
    expect(mockRepo.save).not.toHaveBeenCalled();
  });

  it('debe lanzar ConflictException si el documento ya existe', async () => {
    vi.mocked(mockRepo.findByDocumento).mockResolvedValue(
      new BeneficiarioModel('uuid-existente', NivelRegistroEnum.EXTENDIDO, 'CC', '1098765432'),
    );

    const dto = {
      nivelRegistro: NivelRegistroEnum.EXTENDIDO,
      nombres: 'Luisa',
      apellidos: 'Fernández',
      fechaNacimiento: '1992-06-15',
      tipoDocumento: 'CC',
      numeroDocumento: '1098765432',
      autorizaTratamientoDatos: true,
      consentimiento,
    };

    await expect(useCase.execute(dto)).rejects.toThrow(ConflictException);
    expect(mockRepo.save).not.toHaveBeenCalled();
  });
});
