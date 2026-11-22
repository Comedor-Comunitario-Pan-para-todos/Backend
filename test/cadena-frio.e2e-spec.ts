import {
  type INestApplication,
  type ExecutionContext,
  UnauthorizedException,
  ValidationPipe,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import type { App } from 'supertest/types.js';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { JwtAuthGuard } from '../src/auth/guards/jwt-auth.guard.js';
import { CadenaFrioService } from '../src/cadena-frio/application/cadena-frio.service.js';
import { CadenaFrioController } from '../src/cadena-frio/cadena-frio.controller.js';
import {
  TipoEquipoRefrigeracion,
  type ReporteIncidente,
} from '../src/cadena-frio/domain/cadena-frio.js';
import { CADENA_FRIO_REPOSITORY } from '../src/cadena-frio/domain/ports/cadena-frio-repository.port.js';
import { RolEnum } from '../src/usuarios/enums/rol.enum.js';

const equipo = {
  id: '87188952-42e4-453b-afa3-c4338579bb13',
  nombre: 'Nevera cocina',
  tipo: TipoEquipoRefrigeracion.NEVERA,
  activo: true,
};
const reporte = {
  equipoId: equipo.id,
  temperaturaObservada: 12.5,
  minutosTranscurridos: 30,
  insumosAfectados: ['Leche'],
  accionCorrectiva: 'Trasladar los insumos',
};
const voluntarioId = 'b5dfec6f-573e-4e52-b0b0-2575f77afbcc';
const registradoEn = new Date('2026-11-22T13:00:00.000Z');

describe('Cadena de frío (HTTP)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      controllers: [CadenaFrioController],
      providers: [
        CadenaFrioService,
        {
          provide: CADENA_FRIO_REPOSITORY,
          useValue: {
            listarEquipos: vi.fn().mockResolvedValue([equipo]),
            registrar: vi.fn((datos: ReporteIncidente, actor: string) =>
              datos.equipoId === equipo.id
                ? {
                    ...datos,
                    id: 'reporte-1',
                    reportadoPorId: actor,
                    registradoEn,
                  }
                : null,
            ),
          },
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({
        canActivate(context: ExecutionContext) {
          const req = context.switchToHttp().getRequest<{
            headers: { authorization?: string };
            user?: unknown;
          }>();
          if (!req.headers.authorization) {
            throw new UnauthorizedException();
          }
          req.user = {
            id: voluntarioId,
            rol: { nombre: req.headers.authorization },
          };
          return true;
        },
      })
      .compile();

    app = module.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();
  });

  afterAll(async () => {
    await app?.close();
  });

  it('lista equipos para un voluntario en menos de dos segundos', async () => {
    const inicio = performance.now();
    await request(app.getHttpServer())
      .get('/equipos-refrigeracion')
      .set('Authorization', RolEnum.VOLUNTARIO)
      .expect(200, [equipo]);
    expect(performance.now() - inicio).toBeLessThan(2000);
  });

  it('crea un incidente con la identidad autenticada en menos de dos segundos', async () => {
    const inicio = performance.now();
    await request(app.getHttpServer())
      .post('/incidentes-cadena-frio')
      .set('Authorization', RolEnum.VOLUNTARIO)
      .send(reporte)
      .expect(201, {
        ...reporte,
        id: 'reporte-1',
        reportadoPorId: voluntarioId,
        registradoEn: registradoEn.toISOString(),
      });
    expect(performance.now() - inicio).toBeLessThan(2000);
  });

  it.each([
    ['equipo ausente', { equipoId: undefined }],
    ['equipo con ID inválido', { equipoId: 'nevera-1' }],
    ['temperatura ausente', { temperaturaObservada: undefined }],
    ['temperatura en texto', { temperaturaObservada: '12.5' }],
    ['temperatura nula', { temperaturaObservada: null }],
    ['tiempo ausente', { minutosTranscurridos: undefined }],
    ['tiempo negativo', { minutosTranscurridos: -1 }],
    ['tiempo fraccionario', { minutosTranscurridos: 1.5 }],
    [
      'tiempo fuera del rango persistible',
      { minutosTranscurridos: 2147483648 },
    ],
    ['insumos ausentes', { insumosAfectados: undefined }],
    ['insumos en texto', { insumosAfectados: 'Leche' }],
    ['insumo vacío', { insumosAfectados: [''] }],
    ['insumo numérico', { insumosAfectados: [20] }],
    [
      'nombre de insumo demasiado largo',
      { insumosAfectados: ['a'.repeat(256)] },
    ],
    [
      'demasiados insumos',
      { insumosAfectados: Array.from({ length: 101 }, () => 'Leche') },
    ],
    ['acción correctiva ausente', { accionCorrectiva: undefined }],
    ['acción correctiva en blanco', { accionCorrectiva: '  ' }],
    [
      'acción correctiva demasiado larga',
      { accionCorrectiva: 'a'.repeat(1001) },
    ],
    ['actor inyectado', { reportadoPorId: 'otro-usuario' }],
    ['fecha inyectada', { registradoEn: registradoEn.toISOString() }],
  ])('rechaza el reporte con %s', async (_caso, cambio) => {
    await request(app.getHttpServer())
      .post('/incidentes-cadena-frio')
      .set('Authorization', RolEnum.VOLUNTARIO)
      .send({ ...reporte, ...cambio })
      .expect(400);
  });

  it('acepta temperatura negativa, cero minutos e insumos vacíos', async () => {
    const datos = {
      ...reporte,
      temperaturaObservada: -18.5,
      minutosTranscurridos: 0,
      insumosAfectados: [],
    };
    await request(app.getHttpServer())
      .post('/incidentes-cadena-frio')
      .set('Authorization', RolEnum.VOLUNTARIO)
      .send(datos)
      .expect(201, {
        ...datos,
        id: 'reporte-1',
        reportadoPorId: voluntarioId,
        registradoEn: registradoEn.toISOString(),
      });
  });

  it('rechaza un equipo no disponible', async () => {
    await request(app.getHttpServer())
      .post('/incidentes-cadena-frio')
      .set('Authorization', RolEnum.VOLUNTARIO)
      .send({ ...reporte, equipoId: voluntarioId })
      .expect(404);
  });

  it('permite consultar el catálogo a la coordinadora', async () => {
    await request(app.getHttpServer())
      .get('/equipos-refrigeracion')
      .set('Authorization', RolEnum.COORDINADORA)
      .expect(200, [equipo]);
  });

  it('requiere autenticación en las dos rutas', async () => {
    await request(app.getHttpServer())
      .get('/equipos-refrigeracion')
      .expect(401);
    await request(app.getHttpServer())
      .post('/incidentes-cadena-frio')
      .send(reporte)
      .expect(401);
  });

  it.each([RolEnum.DONANTE, RolEnum.PRESIDENTE_JAC])(
    'prohíbe ambas operaciones al rol %s',
    async (rol) => {
      await request(app.getHttpServer())
        .get('/equipos-refrigeracion')
        .set('Authorization', rol)
        .expect(403);
      await request(app.getHttpServer())
        .post('/incidentes-cadena-frio')
        .set('Authorization', rol)
        .send(reporte)
        .expect(403);
    },
  );

  it('prohíbe reportar incidentes a la coordinadora', async () => {
    await request(app.getHttpServer())
      .post('/incidentes-cadena-frio')
      .set('Authorization', RolEnum.COORDINADORA)
      .send(reporte)
      .expect(403);
  });
});
