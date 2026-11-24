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
import { AutorizacionTutorService } from '../src/consentimientos/application/autorizacion-tutor.service.js';
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
const operador = { id: usuarioId, nombreCompleto: 'Voluntario de Prueba' };

describe('Consentimientos (HTTP)', () => {
  let app: INestApplication<App>;
  const registrar = vi.fn();
  const crear = vi.fn();
  const buscarVigentes = vi.fn();
  const revocarImagen = vi.fn();
  const historialImagen = vi.fn();

  beforeAll(async () => {
    const modulo = await Test.createTestingModule({
      controllers: [ConsentimientosController, BeneficiariosController],
      providers: [
        ConsentimientosService,
        {
          provide: AutorizacionTutorService,
          useValue: { buscarActivas: vi.fn().mockResolvedValue([]) },
        },
        {
          provide: CONSENTIMIENTO_REPOSITORY,
          useValue: {
            registrar,
            buscarVigentes,
            buscarImagenesVigentes: vi.fn().mockResolvedValue([]),
            revocarImagen,
            historialImagen,
          },
        },
        { provide: BeneficiariosService, useValue: { create: crear } },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({
        canActivate(context: ExecutionContext) {
          const req = context.switchToHttp().getRequest<{
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
    buscarVigentes.mockReset().mockResolvedValue([]);
    registrar.mockReset().mockImplementation((datos: object) =>
      Promise.resolve({
        creado: true,
        consentimiento: { ...datos, registradoPor: operador },
      }),
    );
    crear.mockReset().mockResolvedValue({
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
        registradoPor: operador,
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
    { finalidad: 'REPORTE_NO_VALIDO' },
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
      registradoPor: operador,
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
    { consentimiento: { ...consentimiento, finalidad: 'USO_IMAGEN' } },
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
      .expect(201, {
        id: beneficiarioId,
        nombres: 'Ana',
        consentimiento: null,
        consentimientoImagen: null,
        autorizacionTutor: null,
        esMenorEdad: false,
      });
    expect(crear).toHaveBeenCalledExactlyOnceWith(
      expect.objectContaining(alta),
      usuarioId,
    );
  });

  it('acepta el uso de imagen en la ruta de consentimiento', async () => {
    await request(app.getHttpServer())
      .post(ruta)
      .set('Authorization', voluntario)
      .send({ ...consentimiento, finalidad: 'USO_IMAGEN' })
      .expect(201);
    expect(registrar).toHaveBeenCalledWith(
      expect.objectContaining({ finalidad: 'USO_IMAGEN' }),
      false,
    );
  });

  it('normaliza nivel y clasificación estructurada para el alta', async () => {
    await request(app.getHttpServer())
      .post('/beneficiarios')
      .set('Authorization', voluntario)
      .send({
        ...alta,
        nivel: 'EXTENDIDO',
        clasificacion: { sistema: 'sisben', grupo: ' c1 ' },
      })
      .expect(201);
    expect(crear).toHaveBeenCalledWith(
      expect.objectContaining({
        nivelRegistro: 'EXTENDIDO',
        clasificacionSocioeconomica: 'C1',
      }),
      usuarioId,
    );
  });

  it('acepta RUI sin grupo y lo guarda como RUI', async () => {
    await request(app.getHttpServer())
      .post('/beneficiarios')
      .set('Authorization', voluntario)
      .send({ ...alta, nivel: 'EXTENDIDO', clasificacion: { sistema: 'RUI' } })
      .expect(201);
    expect(crear).toHaveBeenCalledWith(
      expect.objectContaining({ clasificacionSocioeconomica: 'RUI' }),
      usuarioId,
    );
  });

  it.each([
    { nivel: 'EXTENDIDO', nivelRegistro: 'BASICO' },
    { clasificacion: { sistema: 'SISBEN' } },
    {
      clasificacion: { sistema: 'SISBEN', grupo: 'C1' },
      clasificacionSocioeconomica: 'D1',
    },
  ])(
    'rechaza variantes contradictorias o incompletas del alta %j',
    async (datos) => {
      await request(app.getHttpServer())
        .post('/beneficiarios')
        .set('Authorization', voluntario)
        .send({ ...alta, ...datos })
        .expect(400);
      expect(crear).not.toHaveBeenCalled();
    },
  );

  it('valida el contrato de imagen y atribuye las operaciones al JWT', async () => {
    const http = request(app.getHttpServer());
    const detalle = '/beneficiarios/' + beneficiarioId;
    const put = detalle + '/consentimiento-imagen';
    const baja = detalle + '/consentimiento/revocacion';
    const historial = detalle + '/consentimientos';
    const decision = { finalidad: 'USO_IMAGEN' };
    revocarImagen.mockReset().mockResolvedValue(decision);
    historialImagen.mockReset().mockResolvedValue([decision]);

    await http
      .post(ruta)
      .set('Authorization', voluntario)
      .send({ ...decision, versionPolitica: 1 })
      .expect(201);
    expect(registrar).toHaveBeenCalledWith(
      expect.objectContaining({
        versionTexto: 1,
        metodo: 'VERBAL_CON_TESTIGO',
        registradoPorId: usuarioId,
      }),
      false,
    );
    for (const payload of [
      { autorizado: 'true' },
      { autorizado: true },
      { autorizado: true, versionPolitica: 1, tutorAutorizo: true },
      { autorizado: true, versionPolitica: 1, foto: 'archivo' },
    ]) {
      await http
        .put(put)
        .set('Authorization', voluntario)
        .send(payload)
        .expect(400);
    }
    await http
      .put(put)
      .set('Authorization', RolEnum.DONANTE)
      .send({ autorizado: false })
      .expect(403);
    await http.get(historial).query(decision).expect(401);
    await http
      .get(historial)
      .set('Authorization', voluntario)
      .query({ finalidad: 'ATENCION_ALIMENTARIA' })
      .expect(400);
    await http
      .get(historial)
      .set('Authorization', voluntario)
      .query(decision)
      .expect(200, [decision]);
    expect(historialImagen).toHaveBeenCalledExactlyOnceWith(beneficiarioId);
    await http
      .post(baja)
      .set('Authorization', voluntario)
      .send(decision)
      .expect(200, decision);
    expect(revocarImagen).toHaveBeenCalledExactlyOnceWith(
      beneficiarioId,
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
