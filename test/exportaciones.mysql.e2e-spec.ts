import { type INestApplication, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { randomUUID } from 'node:crypto';
import request from 'supertest';
import type { App } from 'supertest/types.js';
import ExcelJS from 'exceljs';
import { DataSource } from 'typeorm';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { AppModule } from '../src/app.module.js';
import { Beneficiario } from '../src/beneficiarios/entities/beneficiario.entity.js';
import { consentimientoBeneficiarioSchema } from '../src/consentimientos/infrastructure/consentimiento.schema.js';
import {
  FINALIDAD_REPORTE_ALCALDIA,
  MetodoConsentimiento,
} from '../src/consentimientos/domain/consentimiento.js';
import { logExportacionSchema } from '../src/exportaciones/infrastructure/log-exportacion.schema.js';
import { Rol } from '../src/usuarios/entities/rol.entity.js';
import { Usuario } from '../src/usuarios/entities/usuario.entity.js';
import { RolEnum } from '../src/usuarios/enums/rol.enum.js';

describe.skipIf(process.env.RF18_MYSQL_E2E !== '1')(
  'Exportaciones (MariaDB y JWT)',
  () => {
    const database = 'rf18_test_' + randomUUID().replaceAll('-', '');
    let admin: DataSource | undefined;
    let creada = false;
    let app: INestApplication<App> | undefined;
    let db: DataSource;
    let http: ReturnType<typeof request>;
    let auth: string;
    let coord: string;
    let presidenteId: string;
    const ficha = {
      apellidos: 'Prueba',
      fechaNacimiento: '1990-01-01',
      telefono: '1234567',
    };

    beforeAll(async () => {
      const host = process.env.DB_HOST || 'localhost';
      if (!['localhost', '127.0.0.1', '::1'].includes(host))
        throw new Error('RF18_MYSQL_E2E requiere una base local');
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
      const jwt = app.get(JwtService);
      const usuario = async (nombre: RolEnum) => {
        const rol = await db.getRepository(Rol).findOneByOrFail({ nombre });
        return db.getRepository(Usuario).save({
          email: nombre + '@example.test',
          nombreCompleto: nombre,
          password: 'fixture',
          rol,
        });
      };
      const presidente = await usuario(RolEnum.PRESIDENTE_JAC);
      presidenteId = presidente.id;
      const coordinadora = await usuario(RolEnum.COORDINADORA);
      auth =
        'Bearer ' +
        (await jwt.signAsync({ sub: presidente.id, email: presidente.email }));
      coord =
        'Bearer ' +
        (await jwt.signAsync({
          sub: coordinadora.id,
          email: coordinadora.email,
        }));
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

    async function descargar(filtros = {}) {
      const respuesta = await http
        .get('/exportaciones/beneficiarios.xlsx')
        .set('Authorization', auth)
        .query(filtros)
        .buffer(true)
        .parse((stream, callback) => {
          const partes: Buffer[] = [];
          stream.on('data', (parte: Buffer) => partes.push(parte));
          stream.on('end', () => callback(null, Buffer.concat(partes)));
          stream.on('error', callback);
        })
        .expect(200);
      const libro = new ExcelJS.Workbook();
      await libro.xlsx.load(respuesta.body);
      return libro.getWorksheet('Beneficiarios')!;
    }

    it('revierte y reaplica la migración antes de que exista auditoría', async () => {
      const runner = db.createQueryRunner();
      try {
        await db.undoLastMigration();
        expect(await runner.hasTable('log_exportaciones_beneficiarios')).toBe(
          false,
        );
        await db.runMigrations();
        expect(await runner.hasTable('log_exportaciones_beneficiarios')).toBe(
          true,
        );
      } finally {
        await runner.release();
      }
    });

    it('exige autorización específica, excluye fichas desactivadas, audita y respeta revocación y reautorización', async () => {
      const repo = db.getRepository(Beneficiario);
      const autorizada = await repo.save({ ...ficha, nombres: 'Autorizada' });
      const sinPermiso = await repo.save({
        ...ficha,
        nombres: 'Sin permiso',
        autorizaTratamientoDatos: true,
      });
      const desactivada = await repo.save({ ...ficha, nombres: 'Desactivada' });
      const payload = {
        aceptado: true,
        versionTexto: 1,
        metodo: 'VERBAL_CON_TESTIGO',
        finalidad: 'REPORTE_ALCALDIA',
      };
      const consentimiento =
        '/beneficiarios/' + autorizada.id + '/consentimiento';
      await http
        .post('/beneficiarios/' + sinPermiso.id + '/consentimiento')
        .set('Authorization', coord)
        .send({ ...payload, finalidad: 'ATENCION_ALIMENTARIA' })
        .expect(201);
      const primera = await http
        .post(consentimiento)
        .set('Authorization', coord)
        .send(payload)
        .expect(201);
      await http
        .post(consentimiento)
        .set('Authorization', coord)
        .send({ ...payload, versionTexto: 2 })
        .expect(201);
      await http
        .post('/beneficiarios/' + desactivada.id + '/consentimiento')
        .set('Authorization', coord)
        .send(payload)
        .expect(201);
      await repo.softDelete(desactivada.id);
      const fecha = new Intl.DateTimeFormat('sv-SE', {
        timeZone: 'America/Bogota',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      }).format(new Date());
      const hoja = await descargar({ desde: fecha, hasta: fecha });
      expect(hoja.rowCount).toBe(2);
      expect([hoja.getCell('A2').value, hoja.getCell('B2').value]).toEqual([
        'Autorizada',
        'Prueba',
      ]);
      expect(
        (await repo.findOneByOrFail({ id: autorizada.id }))
          .autorizaTratamientoDatos,
      ).toBe(false);
      expect(
        await db.manager.findOneBy(logExportacionSchema, {
          usuarioId: presidenteId,
          desde: fecha,
          hasta: fecha,
        }),
      ).toMatchObject({ total: 1 });
      expect((await descargar({ hasta: '2000-01-01' })).rowCount).toBe(1);

      await http
        .post(consentimiento + '/revocacion')
        .set('Authorization', coord)
        .send({ finalidad: 'REPORTE_ALCALDIA' })
        .expect(200);
      expect((await descargar()).rowCount).toBe(1);
      const nuevo = await http
        .post(consentimiento)
        .set('Authorization', coord)
        .send(payload)
        .expect(201);
      expect(nuevo.body.id).not.toBe(primera.body.id);
      expect((await descargar()).rowCount).toBe(2);
    });

    it('exporta al menos 150 fichas y audita el total por debajo de dos segundos', async () => {
      const fichas = Array.from({ length: 150 }, (_, i) => ({
        ...ficha,
        id: randomUUID(),
        nombres: 'Medición ' + i,
      }));
      await db.manager.insert(
        Beneficiario,
        fichas.map((registro) => ({ ...registro })),
      );
      await db.manager.insert(
        consentimientoBeneficiarioSchema,
        fichas.map(({ id }) => ({
          id: randomUUID(),
          beneficiarioId: id,
          aceptado: true as const,
          versionTexto: 1,
          finalidad: FINALIDAD_REPORTE_ALCALDIA,
          metodo: MetodoConsentimiento.VERBAL_CON_TESTIGO,
          registradoPorId: presidenteId,
          registradoEn: new Date(),
        })),
      );
      const inicio = performance.now();
      const hoja = await descargar();
      expect(performance.now() - inicio).toBeLessThan(2000);
      expect(hoja.rowCount).toBe(152);
      expect(
        await db.manager.findOneBy(logExportacionSchema, {
          usuarioId: presidenteId,
          total: 151,
        }),
      ).not.toBeNull();
    });
  },
);
