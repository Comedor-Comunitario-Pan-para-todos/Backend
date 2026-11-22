import { beforeEach, describe, expect, it, vi } from 'vitest';
import { BeneficiariosController } from './beneficiarios.controller.js';
import { BeneficiariosService } from './beneficiarios.service.js';
import { NivelRegistroEnum } from './enums/nivel-registro.enum.js';
import { RolEnum } from '../usuarios/enums/rol.enum.js';

describe('BeneficiariosController (RF-01, RF-02)', () => {
  let controller: BeneficiariosController;
  let service: BeneficiariosService;

  const mockService = {
    create: vi.fn(),
    findAll: vi.fn(),
    validarDocumento: vi.fn(),
    findOne: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    service = mockService as any;
    controller = new BeneficiariosController(service);
  });

  it('debe registrar un beneficiario invocando al servicio', async () => {
    const dto = {
      nivelRegistro: NivelRegistroEnum.EXTENDIDO,
      nombres: 'María',
      apellidos: 'Gómez',
      fechaNacimiento: '1990-01-01',
      autorizaTratamientoDatos: true,
    };
    mockService.create.mockResolvedValue({ id: 'uuid-1', ...dto });

    const res = await controller.create(dto as any, { user: { id: 'operador', rol: { nombre: RolEnum.COORDINADORA } } });
    expect(res).toBeDefined();
    expect(mockService.create).toHaveBeenCalledWith(dto, 'operador');
  });

  it('debe listar beneficiarios proyectando datos sensibles solo para COORDINADORA', async () => {
    const data = [
      {
        id: 'uuid-1',
        nombres: 'María',
        apellidos: 'Gómez',
        clasificacionSocioeconomica: 'A1',
      },
    ];
    mockService.findAll.mockResolvedValue({ data, meta: { total: 1, page: 1, limit: 10, totalPages: 1 } });

    // Cuando el rol es COORDINADORA, ve el Sisbén
    const reqCoord = { user: { rol: { nombre: RolEnum.COORDINADORA } } };
    const resCoord = await controller.findAll({ page: 1, limit: 10 }, reqCoord);
    expect(resCoord.data[0].clasificacionSocioeconomica).toBe('A1');

    // Cuando el rol es VOLUNTARIO, se oculta el Sisbén por RNF-07
    const reqVol = { user: { rol: { nombre: RolEnum.VOLUNTARIO } } };
    const resVol = await controller.findAll({ page: 1, limit: 10 }, reqVol);
    expect(resVol.data[0].clasificacionSocioeconomica).toBeUndefined();
  });

  it('debe consultar un beneficiario por ID proyectando según el rol', async () => {
    const b = {
      id: 'uuid-1',
      nombres: 'María',
      apellidos: 'Gómez',
      clasificacionSocioeconomica: 'B2',
    };
    mockService.findOne.mockResolvedValue(b);

    const reqVol = { user: { rol: { nombre: RolEnum.VOLUNTARIO } } };
    const resVol = await controller.findOne('uuid-1', reqVol);
    expect(resVol.clasificacionSocioeconomica).toBeUndefined();

    const reqCoord = { user: { rol: { nombre: RolEnum.COORDINADORA } } };
    const resCoord = await controller.findOne('uuid-1', reqCoord);
    expect(resCoord.clasificacionSocioeconomica).toBe('B2');
  });
});
