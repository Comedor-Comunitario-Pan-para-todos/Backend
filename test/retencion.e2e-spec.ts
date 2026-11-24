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
import { RetencionService } from '../src/retencion/application/retencion.service.js';
import { RETENCION_REPOSITORIO } from '../src/retencion/domain/retencion.js';
import { RetencionController } from '../src/retencion/retencion.controller.js';
import { RolEnum } from '../src/usuarios/enums/rol.enum.js';

const plazos = { diasBasicos: 180, diasSensibles: 90 };
const payload = { ...plazos, password: 'clave' };

describe('Retención (HTTP)', () => {
  let app: INestApplication<App>;
  const repositorio = { consultar: vi.fn(), actualizar: vi.fn() };

  beforeAll(async () => {
    const modulo = await Test.createTestingModule({
      controllers: [RetencionController],
      providers: [
        RetencionService,
        { provide: RETENCION_REPOSITORIO, useValue: repositorio },
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
            id: 'operador',
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
    vi.resetAllMocks();
  });
  afterAll(async () => app?.close());

  it('devuelve una política nula e historial vacío antes de la primera configuración', async () => {
    const resultado = { politica: null, historial: [] };
    repositorio.consultar.mockResolvedValue(resultado);
    await request(app.getHttpServer())
      .get('/retencion')
      .set('Authorization', RolEnum.COORDINADORA)
      .expect(200, resultado);
    expect(repositorio.consultar).toHaveBeenCalledExactlyOnceWith('operador');
  });

  it('devuelve solo la política persistida al actualizar', async () => {
    const politica = {
      ...plazos,
      actualizadaPorId: 'operador',
      actualizadaEn: '2026-11-24T12:00:00.000Z',
    };
    repositorio.actualizar.mockResolvedValue(politica);
    await request(app.getHttpServer())
      .put('/retencion')
      .set('Authorization', RolEnum.COORDINADORA)
      .send(payload)
      .expect(200, politica);
    expect(repositorio.actualizar).toHaveBeenCalledExactlyOnceWith(
      plazos,
      'operador',
      'clave',
    );
  });

  it.each([
    { diasBasicos: undefined },
    { diasBasicos: null },
    { diasBasicos: 0 },
    { diasBasicos: -1 },
    { diasSensibles: '90' },
    { diasSensibles: 1.5 },
    { diasSensibles: 36501 },
    { password: undefined },
    { password: 1 },
    { actualizadaPorId: 'otro' },
  ])('rechaza el cuerpo inválido sin escribir %j', async (cambio) => {
    await request(app.getHttpServer())
      .put('/retencion')
      .set('Authorization', RolEnum.COORDINADORA)
      .send({ ...payload, ...cambio })
      .expect(400);
    expect(repositorio.actualizar).not.toHaveBeenCalled();
  });

  it('rechaza una credencial incorrecta', async () => {
    repositorio.actualizar.mockResolvedValue(null);
    await request(app.getHttpServer())
      .put('/retencion')
      .set('Authorization', RolEnum.COORDINADORA)
      .send(payload)
      .expect(403);
  });

  it('requiere JWT y restringe ambas rutas a la Coordinadora', async () => {
    const http = request(app.getHttpServer());
    await http.get('/retencion').expect(401);
    await http.put('/retencion').send(payload).expect(401);
    for (const rol of [
      RolEnum.VOLUNTARIO,
      RolEnum.PRESIDENTE_JAC,
      RolEnum.DONANTE,
    ]) {
      await http.get('/retencion').set('Authorization', rol).expect(403);
      await http
        .put('/retencion')
        .set('Authorization', rol)
        .send(payload)
        .expect(403);
    }
    expect(repositorio.actualizar).not.toHaveBeenCalled();
    expect(repositorio.consultar).not.toHaveBeenCalled();
  });
});
