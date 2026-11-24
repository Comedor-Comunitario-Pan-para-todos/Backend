import { type INestApplication, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { randomUUID } from 'node:crypto';
import { hash } from 'bcrypt';
import request from 'supertest';
import type { App } from 'supertest/types.js';
import { DataSource } from 'typeorm';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { CrearRetencion1795627200000 } from '../src/retencion/infrastructure/migrations/1795627200000-crear-retencion.js';
import { AppModule } from '../src/app.module.js';
import { Beneficiario } from '../src/beneficiarios/entities/beneficiario.entity.js';
import { RetencionService } from '../src/retencion/application/retencion.service.js';
import { TurnoAtencion } from '../src/turnos/entities/turno-atencion.entity.js';
import { Rol } from '../src/usuarios/entities/rol.entity.js';
import { Usuario } from '../src/usuarios/entities/usuario.entity.js';
import { RolEnum } from '../src/usuarios/enums/rol.enum.js';

describe.skipIf(process.env.RF22_MYSQL_E2E !== '1')(
  'Retención (MariaDB y JWT)',
  () => {
    const database = 'rf22_test_' + randomUUID().replaceAll('-', '');
    const password = 'Clave-coord-prueba';
    let admin: DataSource | undefined;
    let creada = false;
    let app: INestApplication<App> | undefined;
    let db: DataSource;
    let http: ReturnType<typeof request>;
    let operador: Usuario;
    let auth: string;

    beforeAll(async () => {
      const host = process.env.DB_HOST || 'localhost';
      if (!['localhost', '127.0.0.1', '::1'].includes(host))
        throw new Error('RF22_MYSQL_E2E requiere una base local');
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
      db = app.get(DataSource);
      http = request(app.getHttpServer());
      const rol = await db
        .getRepository(Rol)
        .findOneByOrFail({ nombre: RolEnum.COORDINADORA });
      operador = await db.getRepository(Usuario).save({
        email: 'rf22@example.test',
        nombreCompleto: 'Coordinadora RF22',
        password: await hash(password, 10),
        rol,
      });
      auth =
        'Bearer ' +
        (await app
          .get(JwtService)
          .signAsync({ sub: operador.id, email: operador.email }));
    }, 20000);

    afterAll(async () => {
      try {
        await app?.close();
      } finally {
        try {
          if (creada) await admin?.query('DROP DATABASE ' + database);
        } finally {
          if (admin?.isInitialized) await admin.destroy();
          vi.unstubAllEnvs();
        }
      }
    }, 10000);

    it('publica el contrato y permite revertir la migración antes de guardar bitácora', async () => {
      const doc = SwaggerModule.createDocument(
        app!,
        new DocumentBuilder().addBearerAuth().build(),
      );
      expect(doc.paths['/retencion'].get?.responses).toHaveProperty('200');
      expect(doc.paths['/retencion'].put?.responses).toHaveProperty('403');
      expect(doc.components?.schemas?.ActualizarRetencionDto).toMatchObject({
        required: expect.arrayContaining([
          'diasBasicos',
          'diasSensibles',
          'password',
        ]),
      });
      const runner = db.createQueryRunner();
      try {
        await new CrearRetencion1795627200000().down(runner);
        expect(await runner.hasTable('politica_retencion')).toBe(false);
        await new CrearRetencion1795627200000().up(runner);
        expect(await runner.hasTable('retencion_pendiente_verificacion')).toBe(
          true,
        );
      } finally {
        await runner.release();
      }
      await app!.get(RetencionService).verificar();
      const eventos = await db.query('SELECT id FROM bitacora_retencion');
      expect(eventos).toEqual([]);
      await http
        .get('/retencion')
        .set('Authorization', auth)
        .expect(200, { politica: null, historial: [] });
    });

    it('confirma la contraseña y registra consultas y cambios con operador y valores', async () => {
      const inicio = performance.now();
      const primera = await http
        .put('/retencion')
        .set('Authorization', auth)
        .send({ diasBasicos: 60, diasSensibles: 30, password })
        .expect(200);
      expect(performance.now() - inicio).toBeLessThan(2000);
      expect(primera.body).toMatchObject({
        diasBasicos: 60,
        diasSensibles: 30,
        actualizadaPorId: operador.id,
      });
      expect(primera.body).not.toHaveProperty('password');
      await http
        .put('/retencion')
        .set('Authorization', auth)
        .send({ diasBasicos: 1, diasSensibles: 1, password: 'incorrecta' })
        .expect(403);
      await http
        .put('/retencion')
        .set('Authorization', auth)
        .send({ diasBasicos: -1, diasSensibles: 4, password })
        .expect(400);
      const intacta = await http
        .get('/retencion')
        .set('Authorization', auth)
        .expect(200);
      expect(intacta.body.politica).toEqual(primera.body);
      expect(intacta.body.historial).toHaveLength(1);
      await http
        .put('/retencion')
        .set('Authorization', auth)
        .send({ diasBasicos: 100, diasSensibles: 20, password })
        .expect(200);
      const consulta = await http
        .get('/retencion')
        .set('Authorization', auth)
        .expect(200);
      expect(consulta.body.historial[0]).toMatchObject({
        evento: 'CAMBIO_POLITICA',
        operadorId: operador.id,
        anterior: { diasBasicos: 60, diasSensibles: 30 },
        vigente: { diasBasicos: 100, diasSensibles: 20 },
      });
      const lecturas = await db.query(
        'SELECT operadorId FROM bitacora_retencion WHERE evento = ?',
        ['CONSULTA'],
      );
      expect(lecturas).toEqual(
        Array.from({ length: 3 }, () => ({ operadorId: operador.id })),
      );
    });

    it('marca plazos independientes, incluye desactivados, respeta actividad reciente y conserva datos', async () => {
      const dia = 86_400_000;
      const hoy = new Date();
      const beneficiarios = db.getRepository(Beneficiario);
      const ficha = {
        nombres: 'Prueba',
        apellidos: 'RF22',
        fechaNacimiento: '1990-01-01',
      };
      const antigua = new Date(hoy.getTime() - 130 * dia);
      const soloSensible = await beneficiarios.save({
        ...ficha,
        telefono: '1234567',
        updatedAt: new Date(hoy.getTime() - 40 * dia),
      });
      const soloBasico = await beneficiarios.save({
        ...ficha,
        updatedAt: antigua,
      });
      const desactivado = await beneficiarios.save({
        ...ficha,
        numeroDocumento: 'RF22-1',
        updatedAt: antigua,
        deletedAt: antigua,
      });
      const activo = await beneficiarios.save({
        ...ficha,
        numeroDocumento: 'RF22-2',
        updatedAt: antigua,
      });
      await db.getRepository(TurnoAtencion).save({
        beneficiarioId: activo.id,
        emitidoPorUsuarioId: operador.id,
        fecha: hoy.toISOString().slice(0, 10),
        horaLlegada: '11:00:00',
        numeroTurno: 1,
      });

      await app!.get(RetencionService).verificar(hoy);
      const marcas = await db.query(
        'SELECT beneficiarioId, datosBasicos, datosSensibles FROM retencion_pendiente_verificacion',
      );
      expect(marcas).toHaveLength(3);
      expect(marcas).toEqual(
        expect.arrayContaining([
          {
            beneficiarioId: soloSensible.id,
            datosBasicos: 0,
            datosSensibles: 1,
          },
          { beneficiarioId: soloBasico.id, datosBasicos: 1, datosSensibles: 0 },
          {
            beneficiarioId: desactivado.id,
            datosBasicos: 1,
            datosSensibles: 1,
          },
        ]),
      );
      expect(await beneficiarios.count({ withDeleted: true })).toBe(4);
      expect(
        (await beneficiarios.findOneByOrFail({ id: soloSensible.id })).telefono,
      ).toBe('1234567');
      const consulta = await http
        .get('/retencion')
        .set('Authorization', auth)
        .expect(200);
      const verificacion = consulta.body.historial.find(
        ({ evento }: { evento: string }) => evento === 'VERIFICACION',
      );
      expect(verificacion).toMatchObject({
        basicosPendientes: 2,
        sensiblesPendientes: 2,
        operadorId: null,
      });
      expect(JSON.stringify(verificacion)).not.toContain(soloSensible.id);
      await http
        .put('/retencion')
        .set('Authorization', auth)
        .send({ diasBasicos: 200, diasSensibles: 200, password })
        .expect(200);
      expect(
        await db.query(
          'SELECT beneficiarioId FROM retencion_pendiente_verificacion',
        ),
      ).toEqual([]);
      await app!.get(RetencionService).verificar(hoy);
      expect(
        await db.query(
          'SELECT beneficiarioId FROM retencion_pendiente_verificacion',
        ),
      ).toEqual([]);
    });

    it('responde a 150 consultas auditadas por debajo de dos segundos cada una', async () => {
      for (let indice = 0; indice < 150; indice++) {
        const inicio = performance.now();
        await http.get('/retencion').set('Authorization', auth).expect(200);
        expect(performance.now() - inicio).toBeLessThan(2000);
      }
    }, 30000);
  },
);
