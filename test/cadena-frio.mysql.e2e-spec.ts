import { CrearCadenaFrio1795305600000 } from '../src/cadena-frio/infrastructure/migrations/1795305600000-crear-cadena-frio.js';
import { type INestApplication, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { randomUUID } from 'node:crypto';
import request from 'supertest';
import type { App } from 'supertest/types.js';
import { DataSource } from 'typeorm';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { AppModule } from '../src/app.module.js';
import {
  accesoCatalogoSchema,
  equipoRefrigeracionSchema,
  incidenteCadenaFrioSchema,
} from '../src/cadena-frio/infrastructure/adapters/out/persistence/cadena-frio.schemas.js';
import { TipoEquipoRefrigeracion } from '../src/cadena-frio/domain/cadena-frio.js';
import { Rol } from '../src/usuarios/entities/rol.entity.js';
import { Usuario } from '../src/usuarios/entities/usuario.entity.js';
import { RolEnum } from '../src/usuarios/enums/rol.enum.js';

describe.skipIf(process.env.RF10_MYSQL_E2E !== '1')(
  'Cadena de frío (MySQL y JWT)',
  () => {
    const database = 'rf10_test_' + randomUUID().replaceAll('-', '');
    const nevera = {
      id: randomUUID(),
      nombre: 'Nevera',
      tipo: TipoEquipoRefrigeracion.NEVERA,
      activo: true,
    };
    const congelador = {
      id: randomUUID(),
      nombre: 'Congelador',
      tipo: TipoEquipoRefrigeracion.CONGELADOR,
      activo: false,
    };
    const reporte = {
      equipoId: nevera.id,
      temperaturaObservada: -3.25,
      minutosTranscurridos: 0,
      insumosAfectados: ['Leche', 'Queso'],
      accionCorrectiva: 'Trasladar insumos',
    };
    let admin: DataSource | undefined;
    let creada = false;
    let app: INestApplication<App> | undefined;
    let db: DataSource;
    let http: ReturnType<typeof request>;
    let usuario: Usuario;
    let auth: string;

    beforeAll(async () => {
      const host = process.env.DB_HOST || 'localhost';
      if (!['localhost', '127.0.0.1', '::1'].includes(host)) {
        throw new Error('RF10_MYSQL_E2E requiere una base MySQL local.');
      }
      admin = new DataSource({
        type: 'mysql',
        host,
        port: Number(process.env.DB_PORT || 3306),
        username: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
      });
      await admin.initialize();
      await admin.query('CREATE DATABASE ' + database);
      creada = true;
      vi.stubEnv('DB_NAME', database);
      app = await NestFactory.create<INestApplication<App>>(AppModule, {
        logger: false,
        abortOnError: false,
      });
      app.useGlobalPipes(
        new ValidationPipe({
          whitelist: true,
          forbidNonWhitelisted: true,
          transform: true,
        }),
      );
      await app.init();
      http = request(app.getHttpServer());
      db = app.get(DataSource);
      const rol = await db
        .getRepository(Rol)
        .findOneByOrFail({ nombre: RolEnum.VOLUNTARIO });
      usuario = await db.getRepository(Usuario).save({
        email: 'rf10@example.test',
        nombreCompleto: 'Voluntario de prueba',
        password: 'fixture',
        rol,
      });
      auth =
        'Bearer ' +
        (await app
          .get(JwtService)
          .signAsync({ sub: usuario.id, email: usuario.email }));
      await db.manager.insert(equipoRefrigeracionSchema, { ...nevera });
      await db.manager.insert(equipoRefrigeracionSchema, { ...congelador });
    }, 20000);

    afterAll(async () => {
      try {
        await app?.close();
      } finally {
        try {
          if (creada) {
            await admin?.query('DROP DATABASE ' + database);
          }
        } finally {
          if (admin?.isInitialized) {
            await admin.destroy();
          }
          vi.unstubAllEnvs();
        }
      }
    }, 10000);

    it('publica ambas operaciones y el esquema del reporte en Swagger', () => {
      const document = SwaggerModule.createDocument(
        app!,
        new DocumentBuilder().addBearerAuth().build(),
      );
      expect(
        document.paths['/equipos-refrigeracion'].get?.responses,
      ).toHaveProperty('200');
      expect(
        document.paths['/incidentes-cadena-frio'].post?.responses,
      ).toHaveProperty('201');
      expect(document.components?.schemas?.CrearIncidenteDto).toMatchObject({
        required: expect.arrayContaining([
          'equipoId',
          'temperaturaObservada',
          'minutosTranscurridos',
          'insumosAfectados',
          'accionCorrectiva',
        ]),
      });
    });

    it('ordena el catálogo, incluye el estado de los equipos y persiste la auditoría de cada acceso', async () => {
      const inicio = Date.now();
      for (let acceso = 0; acceso < 2; acceso++) {
        await http
          .get('/equipos-refrigeracion')
          .set('Authorization', auth)
          .expect(200, [congelador, nevera]);
      }
      const auditoria = await db.manager.findBy(accesoCatalogoSchema, {
        usuarioId: usuario.id,
      });
      expect(auditoria).toHaveLength(2);
      expect(new Set(auditoria.map(({ id }) => id)).size).toBe(2);
      for (const acceso of auditoria) {
        expect(acceso.consultadoEn.getTime()).toBeGreaterThanOrEqual(inicio);
        expect(acceso.consultadoEn.getTime()).toBeLessThanOrEqual(Date.now());
      }
    });

    it('persiste el reporte con el actor autenticado y la fecha generada por el servidor', async () => {
      const inicio = Date.now();
      const { body } = await http
        .post('/incidentes-cadena-frio')
        .set('Authorization', auth)
        .send({ ...reporte, accionCorrectiva: '  Trasladar insumos  ' })
        .expect(201);
      expect(body).toEqual({
        ...reporte,
        id: expect.any(String),
        reportadoPorId: usuario.id,
        registradoEn: expect.any(String),
      });
      const registradoEn = new Date(body.registradoEn as string);
      expect(registradoEn.getTime()).toBeGreaterThanOrEqual(inicio);
      expect(registradoEn.getTime()).toBeLessThanOrEqual(Date.now());
      await expect(
        db.manager.findOneByOrFail(incidenteCadenaFrioSchema, {
          id: body.id as string,
        }),
      ).resolves.toEqual({
        ...reporte,
        id: body.id,
        reportadoPorId: usuario.id,
        registradoEn,
      });
    });

    it('rechaza equipos inactivos y desconocidos sin insertar incidentes', async () => {
      const antes = await db.manager.count(incidenteCadenaFrioSchema);
      for (const equipoId of [congelador.id, randomUUID()]) {
        await http
          .post('/incidentes-cadena-frio')
          .set('Authorization', auth)
          .send({ ...reporte, equipoId })
          .expect(404);
      }
      expect(await db.manager.count(incidenteCadenaFrioSchema)).toBe(antes);
    });

    it('rechaza JWT inválidos y usuarios inactivos sin auditar un acceso exitoso', async () => {
      const antes = await db.manager.count(accesoCatalogoSchema);
      await http
        .get('/equipos-refrigeracion')
        .set('Authorization', 'Bearer inválido')
        .expect(401);
      await db.getRepository(Usuario).update(usuario.id, { activo: false });
      try {
        await http
          .get('/equipos-refrigeracion')
          .set('Authorization', auth)
          .expect(401);
        await http
          .post('/incidentes-cadena-frio')
          .set('Authorization', auth)
          .send(reporte)
          .expect(401);
        expect(await db.manager.count(accesoCatalogoSchema)).toBe(antes);
      } finally {
        await db.getRepository(Usuario).update(usuario.id, { activo: true });
      }
    });

    it('guarda 150 incidentes en una sola instancia con menos de dos segundos por transacción', async () => {
      const antes = await db.manager.count(incidenteCadenaFrioSchema);
      const inicioConsulta = performance.now();
      await http
        .get('/equipos-refrigeracion')
        .set('Authorization', auth)
        .expect(200);
      expect(performance.now() - inicioConsulta).toBeLessThan(2000);
      for (let registro = 0; registro < 150; registro++) {
        const inicio = performance.now();
        await http
          .post('/incidentes-cadena-frio')
          .set('Authorization', auth)
          .send(reporte)
          .expect(201);
        expect(performance.now() - inicio).toBeLessThan(2000);
      }
      expect(await db.manager.count(incidenteCadenaFrioSchema)).toBe(
        antes + 150,
      );
    }, 30000);

    it('revierte y reaplica la migración del módulo', async () => {
      const runner = db.createQueryRunner();
      const tablas = [
        'equipos_refrigeracion',
        'incidentes_cadena_frio',
        'accesos_catalogo_frio',
      ];
      try {
        const migration = new CrearCadenaFrio1795305600000();
        await migration.down(runner);
        for (const tabla of tablas) {
          expect(await runner.hasTable(tabla)).toBe(false);
        }
        await migration.up(runner);
        for (const tabla of tablas) {
          expect(await runner.hasTable(tabla)).toBe(true);
        }
      } finally {
        await runner.release();
      }
    });
  },
);
