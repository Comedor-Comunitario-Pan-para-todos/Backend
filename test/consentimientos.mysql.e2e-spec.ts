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
import { Beneficiario } from '../src/beneficiarios/entities/beneficiario.entity.js';
import { consentimientoBeneficiarioSchema } from '../src/consentimientos/infrastructure/consentimiento.schema.js';
import { Rol } from '../src/usuarios/entities/rol.entity.js';
import { Usuario } from '../src/usuarios/entities/usuario.entity.js';
import { RolEnum } from '../src/usuarios/enums/rol.enum.js';

const consentimiento = {
  aceptado: true,
  versionTexto: 1,
  finalidad: 'ATENCION_ALIMENTARIA',
  metodo: 'FIRMA_SIMPLE',
};
const ficha = {
  nombres: 'Ana',
  apellidos: 'Pérez',
  fechaNacimiento: '1990-01-01',
};

describe.skipIf(process.env.RF19_MYSQL_E2E !== '1')(
  'Consentimientos (MySQL y JWT)',
  () => {
    const database = 'rf19_test_' + randomUUID().replaceAll('-', '');
    let admin: DataSource | undefined;
    let creada = false;
    let app: INestApplication<App> | undefined;
    let db: DataSource;
    let http: ReturnType<typeof request>;
    let actor: Usuario;
    let auth: string;

    beforeAll(async () => {
      const host = process.env.DB_HOST || 'localhost';
      if (!['localhost', '127.0.0.1', '::1'].includes(host))
        throw new Error('RF19_MYSQL_E2E requiere MySQL local');
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
        .findOneByOrFail({ nombre: RolEnum.VOLUNTARIO });
      actor = await db.getRepository(Usuario).save({
        email: 'rf19@example.test',
        nombreCompleto: 'Operador de prueba',
        password: 'fixture',
        rol,
      });
      auth =
        'Bearer ' +
        (await app
          .get(JwtService)
          .signAsync({ sub: actor.id, email: actor.email }));
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

    it('publica la evidencia y la aceptación inicial en OpenAPI', () => {
      const documento = SwaggerModule.createDocument(
        app!,
        new DocumentBuilder().addBearerAuth().build(),
      );
      expect(
        documento.paths['/beneficiarios/{id}/consentimiento'].post?.responses,
      ).toHaveProperty('201');
      expect(
        documento.components?.schemas?.CreateBeneficiarioDto,
      ).toMatchObject({ required: expect.arrayContaining(['consentimiento']) });
    });

    it('rechaza un alta sin evidencia y guarda ficha y evidencia cuando se acepta', async () => {
      const antes = await db.manager.count(Beneficiario);
      await http
        .post('/beneficiarios')
        .set('Authorization', auth)
        .send({ ...ficha, autorizaTratamientoDatos: true })
        .expect(400);
      expect(await db.manager.count(Beneficiario)).toBe(antes);

      const inicio = Date.now();
      const { body } = await http
        .post('/beneficiarios')
        .set('Authorization', auth)
        .send({ ...ficha, autorizaTratamientoDatos: true, consentimiento })
        .expect(201);
      const beneficiarioId = body.id as string;
      const evidencia = await db.manager.findOneByOrFail(
        consentimientoBeneficiarioSchema,
        { beneficiarioId },
      );
      expect(evidencia).toEqual({
        ...consentimiento,
        id: expect.any(String),
        beneficiarioId,
        registradoPorId: actor.id,
        registradoEn: expect.any(Date),
      });
      expect(evidencia.registradoEn.getTime()).toBeGreaterThanOrEqual(inicio);
      expect(evidencia.registradoEn.getTime()).toBeLessThanOrEqual(Date.now());
    });

    it('registra una sola vez ante dos solicitudes simultáneas y actualiza la autorización anterior', async () => {
      const { id } = await db
        .getRepository(Beneficiario)
        .save({ ...ficha, autorizaTratamientoDatos: false });
      const ruta = '/beneficiarios/' + id + '/consentimiento';
      const respuestas = await Promise.all(
        [0, 1].map(() =>
          http.post(ruta).set('Authorization', auth).send(consentimiento),
        ),
      );
      expect(
        respuestas.map(({ status }) => status).sort((a, b) => a - b),
      ).toEqual([200, 201]);
      expect(respuestas[0].body).toEqual(respuestas[1].body);
      expect(
        await db.manager.countBy(consentimientoBeneficiarioSchema, {
          beneficiarioId: id,
        }),
      ).toBe(1);
      expect(
        (await db.getRepository(Beneficiario).findOneByOrFail({ id }))
          .autorizaTratamientoDatos,
      ).toBe(true);
    });

    it('conserva la evidencia anterior al registrar una nueva versión', async () => {
      const { id } = await db.getRepository(Beneficiario).save({ ...ficha });
      const ruta = '/beneficiarios/' + id + '/consentimiento';
      const primera = await http
        .post(ruta)
        .set('Authorization', auth)
        .send(consentimiento)
        .expect(201);
      const nueva = await http
        .post(ruta)
        .set('Authorization', auth)
        .send({ ...consentimiento, versionTexto: 2 })
        .expect(201);
      expect(nueva.body.id).not.toBe(primera.body.id);
      await http
        .post(ruta)
        .set('Authorization', auth)
        .send(consentimiento)
        .expect(200, primera.body);
      expect(
        await db.manager.countBy(consentimientoBeneficiarioSchema, {
          beneficiarioId: id,
        }),
      ).toBe(2);
    });

    it('rechaza fichas desactivadas, inexistentes y peticiones con JWT inválido', async () => {
      const { id } = await db.getRepository(Beneficiario).save({ ...ficha });
      await db.getRepository(Beneficiario).softDelete(id);
      const ruta = '/beneficiarios/' + id + '/consentimiento';
      await http
        .post(ruta)
        .set('Authorization', auth)
        .send(consentimiento)
        .expect(404);
      await http
        .post('/beneficiarios/' + randomUUID() + '/consentimiento')
        .set('Authorization', auth)
        .send(consentimiento)
        .expect(404);
      await http
        .post(ruta)
        .set('Authorization', 'Bearer inválido')
        .send(consentimiento)
        .expect(401);
      expect(
        await db.manager.countBy(consentimientoBeneficiarioSchema, {
          beneficiarioId: id,
        }),
      ).toBe(0);
    });

    it('registra 150 consentimientos en una instancia en menos de 2 segundos por solicitud', async () => {
      const antes = await db.manager.count(consentimientoBeneficiarioSchema);
      for (let indice = 0; indice < 150; indice++) {
        const { id } = await db.getRepository(Beneficiario).save({ ...ficha });
        const inicio = performance.now();
        await http
          .post('/beneficiarios/' + id + '/consentimiento')
          .set('Authorization', auth)
          .send(consentimiento)
          .expect(201);
        expect(performance.now() - inicio).toBeLessThan(2000);
      }
      expect(await db.manager.count(consentimientoBeneficiarioSchema)).toBe(
        antes + 150,
      );
    }, 30000);

    it('revierte el alta si falla la escritura de evidencia y reaplica la migración', async () => {
      const antes = await db.manager.count(Beneficiario);
      const runner = db.createQueryRunner();
      try {
        await db.undoLastMigration();
        expect(await runner.hasTable('consentimientos_beneficiarios')).toBe(
          false,
        );
        await http
          .post('/beneficiarios')
          .set('Authorization', auth)
          .send({
            ...ficha,
            nombres: 'Nombre distinto',
            autorizaTratamientoDatos: true,
            consentimiento,
          })
          .expect(500);
        expect(await db.manager.count(Beneficiario)).toBe(antes);
      } finally {
        try {
          await db.runMigrations();
          expect(await runner.hasTable('consentimientos_beneficiarios')).toBe(
            true,
          );
        } finally {
          await runner.release();
        }
      }
    });
  },
);
