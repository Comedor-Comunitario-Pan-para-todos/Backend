import {
  type ExecutionContext,
  type INestApplication,
  UnauthorizedException,
  ValidationPipe,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import type { App } from 'supertest/types.js';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { JwtAuthGuard } from '../src/auth/guards/jwt-auth.guard.js';
import { ReporteGestionService } from '../src/reportes/application/reporte-gestion.service.js';
import { REPORTE_GESTION_REPOSITORIO } from '../src/reportes/domain/reporte-gestion.js';
import { ReportesController } from '../src/reportes/reportes.controller.js';
import { RolEnum } from '../src/usuarios/enums/rol.enum.js';

const ruta = '/reportes/gestion';
const vacio = {
  periodo: '2026-11',
  turnosEmitidos: 0,
  turnosAtendidos: 0,
  diasAtencion: 0,
  descartesRegistrados: 0,
  actasAutorizadas: 0,
  asistenciaDiaria: [],
  descartesPorUnidad: [],
  fotos: [],
};

describe('Reporte de gestión (HTTP)', () => {
  let app: INestApplication<App>;
  const consultar = vi.fn().mockResolvedValue(vacio);
  beforeAll(async () => {
    const modulo = await Test.createTestingModule({
      controllers: [ReportesController],
      providers: [
        ReporteGestionService,
        { provide: REPORTE_GESTION_REPOSITORIO, useValue: { consultar } },
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
  afterAll(async () => app?.close());

  it.each([RolEnum.COORDINADORA, RolEnum.PRESIDENTE_JAC])(
    'permite a %s consultar un mes sin registros',
    async (rol) => {
      await request(app.getHttpServer())
        .get(ruta)
        .set('Authorization', rol)
        .query({ periodo: vacio.periodo })
        .expect('Cache-Control', 'no-store')
        .expect(200, vacio);
      expect(consultar).toHaveBeenLastCalledWith(vacio.periodo, 'operador');
    },
  );

  it.each([
    {},
    { periodo: '2026-00' },
    { periodo: '2026-13' },
    { periodo: '11-2026' },
    { periodo: '2026-11-01' },
    { periodo: '2026-11', campos: 'todos' },
  ])('valida el mes y el contrato %j', async (query) => {
    consultar.mockClear();
    await request(app.getHttpServer())
      .get(ruta)
      .set('Authorization', RolEnum.COORDINADORA)
      .query(query)
      .expect(400);
    expect(consultar).not.toHaveBeenCalled();
  });

  it('rechaza peticiones sin sesión y roles de Voluntario y Donante', async () => {
    consultar.mockClear();
    const http = request(app.getHttpServer());
    await http.get(ruta).query({ periodo: vacio.periodo }).expect(401);
    for (const rol of [RolEnum.VOLUNTARIO, RolEnum.DONANTE]) {
      await http
        .get(ruta)
        .query({ periodo: vacio.periodo })
        .set('Authorization', rol)
        .expect(403);
    }
    expect(consultar).not.toHaveBeenCalled();
  });
});
