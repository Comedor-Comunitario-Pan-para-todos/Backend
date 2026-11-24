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
import { ActaDescarte } from '../src/actas-descarte/infrastructure/adapters/out/persistence/acta-descarte.entity.js';
import {
  EstadoActaEnum,
  TipoDonanteEnum,
} from '../src/actas-descarte/dto/crear-acta-descarte.dto.js';
import { Beneficiario } from '../src/beneficiarios/entities/beneficiario.entity.js';
import { Descarte } from '../src/descartes/infrastructure/adapters/out/persistence/descarte.entity.js';
import { consultaReporteSchema } from '../src/reportes/infrastructure/consulta-reporte.schema.js';
import { TurnoAtencion } from '../src/turnos/entities/turno-atencion.entity.js';
import { EstadoTurnoEnum } from '../src/turnos/enums/estado-turno.enum.js';
import { Rol } from '../src/usuarios/entities/rol.entity.js';
import { Usuario } from '../src/usuarios/entities/usuario.entity.js';
import { RolEnum } from '../src/usuarios/enums/rol.enum.js';

describe.skipIf(process.env.RF16_MYSQL_E2E !== '1')(
  'Reporte de gestión (MariaDB y JWT)',
  () => {
    const database = 'rf16_test_' + randomUUID().replaceAll('-', '');
    let admin: DataSource | undefined;
    let creada = false;
    let app: INestApplication<App> | undefined;
    let db: DataSource;
    let http: ReturnType<typeof request>;
    let auth: string;
    let operador: Usuario;

    beforeAll(async () => {
      const host = process.env.DB_HOST || 'localhost';
      if (!['localhost', '127.0.0.1', '::1'].includes(host))
        throw new Error('RF16_MYSQL_E2E requiere una base local');
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
        .findOneByOrFail({ nombre: RolEnum.PRESIDENTE_JAC });
      operador = await db
        .getRepository(Usuario)
        .save({
          email: 'rf16@example.test',
          nombreCompleto: 'Presidente de prueba',
          password: 'fixture',
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

    it('publica el contrato y revierte y reaplica la migración antes de guardar la bitácora', async () => {
      const doc = SwaggerModule.createDocument(
        app!,
        new DocumentBuilder().addBearerAuth().build(),
      );
      expect(doc.paths['/reportes/gestion'].get?.responses).toHaveProperty(
        '200',
      );
      expect(doc.paths['/reportes/gestion'].get?.parameters).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            name: 'periodo',
            in: 'query',
            required: true,
          }),
        ]),
      );
      const runner = db.createQueryRunner();
      try {
        await db.undoLastMigration();
        expect(await runner.hasTable('consultas_reportes_gestion')).toBe(false);
        await db.runMigrations();
        expect(await runner.hasTable('consultas_reportes_gestion')).toBe(true);
      } finally {
        await runner.release();
      }
    });

    it('agrega 152 turnos y descarta fuentes identificables en menos de 2 segundos', async () => {
      const ids = Array.from({ length: 150 }, () => randomUUID());
      await db.manager.insert(
        Beneficiario,
        ids.map((id) => ({
          id,
          nombres: 'Nombre reservado',
          apellidos: 'Prueba',
          fechaNacimiento: '1990-01-01',
        })),
      );
      await db.manager.insert(TurnoAtencion, [
        ...ids.map((id, i) => ({
          beneficiarioId: id,
          emitidoPorUsuarioId: operador.id,
          fecha: '2026-11-01',
          numeroTurno: i + 1,
          horaLlegada: '11:00:00',
          estado: EstadoTurnoEnum.ATENDIDO,
        })),
        {
          beneficiarioId: ids[0],
          emitidoPorUsuarioId: operador.id,
          fecha: '2026-11-02',
          numeroTurno: 1,
          horaLlegada: '11:00:00',
          estado: EstadoTurnoEnum.EN_ESPERA,
        },
        {
          beneficiarioId: ids[0],
          emitidoPorUsuarioId: operador.id,
          fecha: '2026-12-01',
          numeroTurno: 1,
          horaLlegada: '11:00:00',
          estado: EstadoTurnoEnum.ATENDIDO,
        },
      ]);
      const descarte = {
        alimento: 'Marca reservada',
        cantidad: 2.5,
        motivo: 'Motivo privado',
        evaluadoPor: 'Operadora privada',
        autorizadoPorId: operador.id,
      };
      await db.manager.insert(Descarte, [
        {
          ...descarte,
          unidadMedida: 'kg',
          fecha: new Date('2026-11-01T05:00:00Z'),
        },
        {
          ...descarte,
          unidadMedida: 'Etiqueta personal',
          fecha: new Date('2026-11-12T10:00:00Z'),
        },
        {
          ...descarte,
          unidadMedida: 'KG',
          fecha: new Date('2026-11-01T04:59:59Z'),
        },
      ]);
      const acta = {
        numeroActa: 'RF16-A',
        donacionOrigenId: 'Origen privado',
        insumo: 'Insumo privado',
        cantidad: 1,
        unidadMedida: 'KG',
        tipoDonante: TipoDonanteEnum.CORPORATIVO,
        estado: EstadoActaEnum.AUTORIZADA,
        motivo: 'Motivo privado',
        generadaPorId: operador.id,
        evidencias: [
          {
            id: randomUUID(),
            url: 'https://example.test/privada.jpg',
            mimeType: 'image/jpeg',
          },
        ],
      };
      await db.manager.insert(ActaDescarte, [
        { ...acta, fechaAutorizacion: new Date('2026-11-20T12:00:00Z') },
        {
          ...acta,
          numeroActa: 'RF16-B',
          fechaAutorizacion: new Date('2026-12-01T05:00:00Z'),
        },
      ]);

      const inicio = performance.now();
      await http
        .get('/reportes/gestion')
        .query({ periodo: '2026-11' })
        .set('Authorization', auth)
        .expect(200, {
          periodo: '2026-11',
          turnosEmitidos: 151,
          turnosAtendidos: 150,
          diasAtencion: 1,
          descartesRegistrados: 2,
          actasAutorizadas: 1,
          asistenciaDiaria: [
            { fecha: '2026-11-01', turnosEmitidos: 150, turnosAtendidos: 150 },
            { fecha: '2026-11-02', turnosEmitidos: 1, turnosAtendidos: 0 },
          ],
          descartesPorUnidad: [{ unidadMedida: 'KG', cantidad: 2.5 }],
          fotos: [],
        });
      expect(performance.now() - inicio).toBeLessThan(2000);
      expect(
        await db.manager.findOneBy(consultaReporteSchema, {
          periodo: '2026-11',
          usuarioId: operador.id,
        }),
      ).toMatchObject({ consultadoEn: expect.any(Date) });
    });
  },
);
