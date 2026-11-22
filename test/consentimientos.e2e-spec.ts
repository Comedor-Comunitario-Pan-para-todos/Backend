import {
  type ExecutionContext,
  type INestApplication,
  UnauthorizedException,
  ValidationPipe,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import type { App } from 'supertest/types.js';
import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import { JwtAuthGuard } from '../src/auth/guards/jwt-auth.guard.js';
import { BeneficiariosController } from '../src/beneficiarios/beneficiarios.controller.js';
import { BeneficiariosService } from '../src/beneficiarios/beneficiarios.service.js';
import { ConsentimientosService } from '../src/consentimientos/application/consentimientos.service.js';
import { ConsentimientosController } from '../src/consentimientos/consentimientos.controller.js';
import { CONSENTIMIENTO_REPOSITORY } from '../src/consentimientos/domain/consentimiento-repository.port.js';
import { RolEnum } from '../src/usuarios/enums/rol.enum.js';

const beneficiarioId = 'b5dfec6f-573e-4e52-b0b0-2575f77afbcc';
const usuarioId = '87188952-42e4-453b-afa3-c4338579bb13';
const ruta = '/beneficiarios/' + beneficiarioId + '/consentimiento';
const consentimiento = {
  aceptado: true,
  versionTexto: 1,
  finalidad: 'ATENCION_ALIMENTARIA',
  metodo: 'HUELLA',
};
const alta = {
  nombres: 'Ana',
  apellidos: 'Pérez',
  fechaNacimiento: '1990-01-01',
  autorizaTratamientoDatos: true,
  consentimiento,
};
const voluntario = RolEnum.VOLUNTARIO;

describe('Consentimientos (HTTP)', () => {
  let app: INestApplication<App>;
  const registrar = vi.fn();
  const crear = vi.fn();

  beforeAll(async () => {
    const modulo = await Test.createTestingModule({
      controllers: [ConsentimientosController, BeneficiariosController],
      providers: [
        ConsentimientosService,
        { provide: CONSENTIMIENTO_REPOSITORY, useValue: { registrar } },
        { provide: BeneficiariosService, useValue: { create: crear } },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({
        canActivate(context: ExecutionContext) {
          const req = context
            .switchToHttp()
            .getRequest<{
              headers: { authorization?: string };
              user?: unknown;
            }>();
          if (!req.headers.authorization) throw new UnauthorizedException();
          req.user = {
            id: usuarioId,
            rol: { nombre: req.headers.authorization },
          };
          return true;
        },
      })
      .compile();
    app = modulo.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();
  });

  beforeEach(() => {
    registrar
      .mockReset()
      .mockImplementation((datos: unknown) =>
        Promise.resolve({ creado: true, consentimiento: datos }),
      );
    crear
      .mockReset()
      .mockResolvedValue({
        id: beneficiarioId,
        nombres: 'Ana',
        numeroDocumento: '123',
        tipoDocumento: 'CC',
        clasificacionSocioeconomica: 'A1',
      });
  });

  afterAll(async () => app?.close());

  it.each([
    [RolEnum.VOLUNTARIO, 'HUELLA'],
    [RolEnum.COORDINADORA, 'FIRMA_SIMPLE'],
    [RolEnum.VOLUNTARIO, 'VERBAL_CON_TESTIGO'],
  ])(
    'permite %s y registra el método %s con la identidad autenticada',
    async (rol, metodo) => {
      const respuesta = await request(app.getHttpServer())
        .post(ruta)
        .set('Authorization', rol)
        .send({
          ...consentimiento,
          metodo,
        })
        .expect(201);
      expect(respuesta.body).toEqual({
        ...consentimiento,
        metodo,
        id: expect.any(String),
        beneficiarioId,
        registradoPorId: usuarioId,
        registradoEn: expect.any(String),
      });
      expect(registrar).toHaveBeenCalledTimes(1);
    },
  );

  it.each([
    { aceptado: false },
    { aceptado: 'true' },
    { aceptado: undefined },
    { versionTexto: '1' },
    { versionTexto: 0 },
    { versionTexto: 1.5 },
    { versionTexto: 2147483648 },
    { finalidad: '' },
    { finalidad: 'USO_IMAGEN' },
    { metodo: 'OTRO' },
    { metodo: undefined },
    { registradoPorId: 'otro' },
    { registradoEn: '2000-01-01' },
    { huella: 'imagen' },
  ])('rechaza datos inválidos o no permitidos %j', async (cambio) => {
    await request(app.getHttpServer())
      .post(ruta)
      .set('Authorization', voluntario)
      .send({ ...consentimiento, ...cambio })
      .expect(400);
    expect(registrar).not.toHaveBeenCalled();
  });

  it('rechaza un UUID inválido antes de escribir', async () => {
    await request(app.getHttpServer())
      .post('/beneficiarios/invalido/consentimiento')
      .set('Authorization', voluntario)
      .send(consentimiento)
      .expect(400);
    expect(registrar).not.toHaveBeenCalled();
  });

  it('responde 404 para un beneficiario inexistente', async () => {
    registrar.mockResolvedValue(null);
    await request(app.getHttpServer())
      .post(ruta)
      .set('Authorization', voluntario)
      .send(consentimiento)
      .expect(404);
  });

  it('responde 200 y devuelve la evidencia original al repetir una versión', async () => {
    const original = {
      ...consentimiento,
      id: beneficiarioId,
      beneficiarioId,
      registradoPorId: usuarioId,
      registradoEn: '2026-11-22T12:00:00.000Z',
    };
    registrar.mockResolvedValue({ creado: false, consentimiento: original });
    await request(app.getHttpServer())
      .post(ruta)
      .set('Authorization', voluntario)
      .send(consentimiento)
      .expect(200, original);
  });

  it('requiere autenticación y restringe el registro a voluntarios y coordinadoras', async () => {
    await request(app.getHttpServer())
      .post(ruta)
      .send(consentimiento)
      .expect(401);
    for (const rol of [RolEnum.DONANTE, RolEnum.PRESIDENTE_JAC]) {
      await request(app.getHttpServer())
        .post(ruta)
        .set('Authorization', rol)
        .send(consentimiento)
        .expect(403);
    }
    expect(registrar).not.toHaveBeenCalled();
  });

  it.each([
    { consentimiento: undefined },
    { consentimiento: [] },
    { consentimiento: { ...consentimiento, aceptado: false } },
    { consentimiento: { ...consentimiento, registradoPorId: 'otro' } },
    { autorizaTratamientoDatos: false },
  ])('impide completar el alta con %j', async (cambio) => {
    await request(app.getHttpServer())
      .post('/beneficiarios')
      .set('Authorization', voluntario)
      .send({ ...alta, ...cambio })
      .expect(400);
    expect(crear).not.toHaveBeenCalled();
  });

  it('envía el consentimiento válido al servicio y excluye documento y Sisbén para un voluntario', async () => {
    await request(app.getHttpServer())
      .post('/beneficiarios')
      .set('Authorization', voluntario)
      .send(alta)
      .expect(201, { id: beneficiarioId, nombres: 'Ana' });
    expect(crear).toHaveBeenCalledExactlyOnceWith(
      expect.objectContaining(alta),
      usuarioId,
    );
  });

  it('impide alterar el consentimiento a través de PATCH de beneficiarios', async () => {
    await request(app.getHttpServer())
      .patch('/beneficiarios/' + beneficiarioId)
      .set('Authorization', voluntario)
      .send({ consentimiento, autorizaTratamientoDatos: false })
      .expect(400);
  });
});
