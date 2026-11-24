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
      expect(body.consentimiento).toMatchObject({
        beneficiarioId,
        registradoPor: { id: actor.id, nombreCompleto: actor.nombreCompleto },
      });
      const evidencia = await db.manager.findOneByOrFail(
        consentimientoBeneficiarioSchema,
        { beneficiarioId },
      );
      expect(evidencia).toMatchObject({
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

    it('mantiene separadas las finalidades y proyecta la ficha con el consentimiento alimentario vigente', async () => {
      const numeroDocumento = 'RF19REVISION';
      const registro = await db.getRepository(Beneficiario).save({
        ...ficha,
        nombres: 'Ficha de revisión',
        tipoDocumento: 'CC',
        numeroDocumento,
        telefono: '3001234567',
        clasificacionSocioeconomica: 'C1',
        autorizaTratamientoDatos: false,
      });
      const detalle = '/beneficiarios/' + registro.id;
      const ruta = detalle + '/consentimiento';
      const imagen = {
        ...consentimiento,
        finalidad: 'USO_IMAGEN',
        versionTexto: 3,
      };
      const operador = { id: actor.id, nombreCompleto: actor.nombreCompleto };
      const resImagen = await http
        .post(ruta)
        .set('Authorization', auth)
        .send(imagen)
        .expect(201);
      expect(resImagen.body.registradoPor).toEqual(operador);
      await http
        .post(ruta)
        .set('Authorization', auth)
        .send(imagen)
        .expect(200, resImagen.body);

      const pendiente = await http
        .get(detalle)
        .set('Authorization', auth)
        .expect(200);
      expect(pendiente.body).toMatchObject({
        consentimiento: null,
        autorizaTratamientoDatos: false,
      });

      const original = await http
        .post(ruta)
        .set('Authorization', auth)
        .send({ ...consentimiento, versionTexto: 3 })
        .expect(201);
      expect(original.body.registradoPor).toEqual(operador);
      const actual = await http
        .post(ruta)
        .set('Authorization', auth)
        .send({ ...consentimiento, versionTexto: 4 })
        .expect(201);
      await http
        .post(ruta)
        .set('Authorization', auth)
        .send(consentimiento)
        .expect(201);

      const fichaDetalle = await http
        .get(detalle)
        .set('Authorization', auth)
        .expect(200);
      const listado = await http
        .get('/beneficiarios')
        .query({ search: numeroDocumento })
        .set('Authorization', auth)
        .expect(200);
      const actualizado = await http
        .patch(detalle)
        .set('Authorization', auth)
        .send({ barrio: 'Centro' })
        .expect(200);
      const validacion = await http
        .get('/beneficiarios/validar-documento/' + numeroDocumento)
        .set('Authorization', auth)
        .expect(200);

      for (const respuesta of [
        fichaDetalle.body,
        listado.body.data[0],
        actualizado.body,
        validacion.body.beneficiario,
      ]) {
        expect(respuesta).toMatchObject({
          id: registro.id,
          consentimiento: actual.body,
          autorizaTratamientoDatos: true,
        });
        for (const campo of [
          'tipoDocumento',
          'numeroDocumento',
          'telefono',
          'clasificacionSocioeconomica',
        ]) {
          expect(respuesta).not.toHaveProperty(campo);
        }
      }

      const rol = await db
        .getRepository(Rol)
        .findOneByOrFail({ nombre: RolEnum.COORDINADORA });
      const coordinadora = await db.getRepository(Usuario).save({
        email: 'rf19-coord@example.test',
        nombreCompleto: 'Coordinadora de prueba',
        password: 'fixture',
        rol,
      });
      const autorizacion =
        'Bearer ' +
        (await app!
          .get(JwtService)
          .signAsync({ sub: coordinadora.id, email: coordinadora.email }));
      const fichaCompleta = await http
        .get(detalle)
        .set('Authorization', autorizacion)
        .expect(200);
      expect(fichaCompleta.body).toMatchObject({
        tipoDocumento: 'CC',
        numeroDocumento,
        telefono: '3001234567',
        clasificacionSocioeconomica: 'C1',
        consentimiento: actual.body,
      });
    });

    describe('RF-20', () => {
      it('revierte y reaplica su migración antes de registrar revocaciones', async () => {
        const runner = db.createQueryRunner();
        try {
          await db.undoLastMigration();
          expect(
            await runner.hasColumn(
              'consentimientos_beneficiarios',
              'activaImagen',
            ),
          ).toBe(false);
        } finally {
          try {
            await db.runMigrations();
            expect(
              await runner.hasColumn(
                'consentimientos_beneficiarios',
                'activaImagen',
              ),
            ).toBe(true);
          } finally {
            await runner.release();
          }
        }
      });
      it('publica alta, revocación, historial y PUT en Swagger', () => {
        const spec = SwaggerModule.createDocument(
          app!,
          new DocumentBuilder().addBearerAuth().build(),
        );
        expect(
          spec.paths['/beneficiarios/{id}/consentimiento'].post?.responses,
        ).toHaveProperty('409');
        expect(
          spec.paths['/beneficiarios/{id}/consentimiento/revocacion'].post
            ?.responses,
        ).toHaveProperty('200');
        expect(
          spec.paths['/beneficiarios/{id}/consentimientos'].get?.responses,
        ).toHaveProperty('200');
        expect(
          spec.paths['/beneficiarios/{id}/consentimiento-imagen'].put
            ?.responses,
        ).toHaveProperty('200');
      });

      it('bloquea por defecto, mantiene una autorización vigente y conserva la evidencia al revocar y volver a autorizar', async () => {
        const { id } = await db
          .getRepository(Beneficiario)
          .save({ ...ficha, nombres: 'Imagen RF20' });
        const ruta = '/beneficiarios/' + id;
        const alta = { versionPolitica: 1, finalidad: 'USO_IMAGEN' };
        await http
          .post(ruta + '/consentimiento/revocacion')
          .set('Authorization', auth)
          .send({ finalidad: 'USO_IMAGEN' })
          .expect(404);
        const previa = await http
          .get(ruta)
          .set('Authorization', auth)
          .expect(200);
        expect(previa.body.consentimientoImagen).toBeNull();
        expect(previa.body.consentimiento).toBeNull();

        const respuestas = await Promise.all(
          [0, 1].map(() =>
            http
              .post(ruta + '/consentimiento')
              .set('Authorization', auth)
              .send(alta),
          ),
        );
        expect(
          respuestas.map(({ status }) => status).sort((a, b) => a - b),
        ).toEqual([200, 201]);
        const original = respuestas[0].body;
        expect(original).toEqual(respuestas[1].body);
        expect(original).toMatchObject({
          versionPolitica: 1,
          finalidad: 'USO_IMAGEN',
          metodo: 'VERBAL_CON_TESTIGO',
          vigente: true,
          registradoPor: { id: actor.id, nombreCompleto: actor.nombreCompleto },
          revocadoPor: null,
          revocadoEn: null,
        });
        const listado = await http
          .get('/beneficiarios')
          .query({ search: 'Imagen RF20' })
          .set('Authorization', auth)
          .expect(200);
        expect(listado.body.data[0].consentimientoImagen).toEqual(original);

        const revocado = await http
          .post(ruta + '/consentimiento/revocacion')
          .set('Authorization', auth)
          .send({ finalidad: 'USO_IMAGEN' })
          .expect(200);
        expect(revocado.body).toMatchObject({
          id: original.id,
          vigente: false,
          revocadoEn: expect.any(String),
          revocadoPor: { id: actor.id },
        });
        const posterior = await http
          .get(ruta)
          .set('Authorization', auth)
          .expect(200);
        expect(posterior.body.consentimientoImagen).toBeNull();

        const nueva = await http
          .put(ruta + '/consentimiento-imagen')
          .set('Authorization', auth)
          .send({ autorizado: true, versionPolitica: 1 })
          .expect(200);
        expect(nueva.body.id).not.toBe(original.id);
        const historial = await http
          .get(ruta + '/consentimientos')
          .query({ finalidad: 'USO_IMAGEN' })
          .set('Authorization', auth)
          .expect(200);
        expect(historial.body).toEqual([nueva.body, revocado.body]);
        await http
          .put(ruta + '/consentimiento-imagen')
          .set('Authorization', auth)
          .send({ autorizado: false })
          .expect(200);
        expect(
          (await db.getRepository(Beneficiario).findOneByOrFail({ id }))
            .autorizaTratamientoDatos,
        ).toBe(false);
      });

      it('rechaza los opt-in de menores en ambas rutas y bloquea imágenes si se corrige la edad', async () => {
        const fechaNacimiento = '2015-05-05';
        const menor = await db
          .getRepository(Beneficiario)
          .save({ ...ficha, fechaNacimiento, esMenorEdad: false });
        const ruta = '/beneficiarios/' + menor.id;
        const post = await http
          .post(ruta + '/consentimiento')
          .set('Authorization', auth)
          .send({ versionPolitica: 1, finalidad: 'USO_IMAGEN' })
          .expect(409);
        expect(post.body.code).toBe('REQUIERE_TUTOR');
        await http
          .put(ruta + '/consentimiento-imagen')
          .set('Authorization', auth)
          .send({ autorizado: true, versionPolitica: 1 })
          .expect(409);
        await http
          .get(ruta + '/consentimientos')
          .query({ finalidad: 'USO_IMAGEN' })
          .set('Authorization', auth)
          .expect(200, []);

        const adulto = await db.getRepository(Beneficiario).save({ ...ficha });
        const detalle = '/beneficiarios/' + adulto.id;
        await http
          .put(detalle + '/consentimiento-imagen')
          .set('Authorization', auth)
          .send({ autorizado: true, versionPolitica: 1 })
          .expect(200);
        const correccion = await http
          .patch(detalle)
          .set('Authorization', auth)
          .send({ fechaNacimiento })
          .expect(200);
        expect(correccion.body.consentimientoImagen).toBeNull();
      });

      it('procesa 150 altas de imagen en menos de 2 segundos por transacción', async () => {
        for (let i = 0; i < 150; i++) {
          const { id } = await db
            .getRepository(Beneficiario)
            .save({ ...ficha });
          const inicio = performance.now();
          await http
            .put('/beneficiarios/' + id + '/consentimiento-imagen')
            .set('Authorization', auth)
            .send({ autorizado: true, versionPolitica: 1 })
            .expect(200);
          expect(performance.now() - inicio).toBeLessThan(2000);
        }
      }, 30000);
    });

    it('revierte el alta si falla la escritura de evidencia', async () => {
      const antes = await db.manager.count(Beneficiario);
      const runner = db.createQueryRunner();
      try {
        await runner.query(
          'RENAME TABLE consentimientos_beneficiarios TO consentimientos_beneficiarios_prueba',
        );
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
          await runner.query(
            'RENAME TABLE consentimientos_beneficiarios_prueba TO consentimientos_beneficiarios',
          );
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
