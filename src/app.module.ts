import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { AuthModule } from './auth/auth.module.js';
import { Rol } from './usuarios/entities/rol.entity.js';
import { Usuario } from './usuarios/entities/usuario.entity.js';
import { UsuariosModule } from './usuarios/usuarios.module.js';
import { BeneficiariosModule } from './beneficiarios/beneficiarios.module.js';
import { Beneficiario } from './beneficiarios/entities/beneficiario.entity.js';
import { CadenaFrioModule } from './cadena-frio/cadena-frio.module.js';
import {
  accesoCatalogoSchema,
  equipoRefrigeracionSchema,
  incidenteCadenaFrioSchema,
} from './cadena-frio/infrastructure/adapters/out/persistence/cadena-frio.schemas.js';
import { CrearCadenaFrio1795305600000 } from './cadena-frio/infrastructure/migrations/1795305600000-crear-cadena-frio.js';
import { TurnosModule } from './turnos/turnos.module.js';
import { TurnoAtencion } from './turnos/entities/turno-atencion.entity.js';
import { DescartesModule } from './descartes/descartes.module.js';
import { Descarte } from './descartes/infrastructure/adapters/out/persistence/descarte.entity.js';
import { ActasDescartesModule } from './actas-descarte/actas-descarte.module.js';
import { ActaDescarte } from './actas-descarte/infrastructure/adapters/out/persistence/acta-descarte.entity.js';
import { ExcepcionesEntregaModule } from './excepciones-entrega/excepciones-entrega.module.js';
import { ExcepcionEntrega } from './excepciones-entrega/entities/excepcion-entrega.entity.js';

import { ConsentimientosModule } from './consentimientos/consentimientos.module.js';
import { consentimientoBeneficiarioSchema } from './consentimientos/infrastructure/consentimiento.schema.js';
import { CrearConsentimientos1795368000000 } from './consentimientos/infrastructure/migrations/1795368000000-crear-consentimientos.js';

import { GestionarConsentimientoImagen1795454400000 } from './consentimientos/infrastructure/migrations/1795454400000-gestionar-consentimiento-imagen.js';

import { autorizacionTutorSchema } from './consentimientos/infrastructure/autorizacion-tutor.schema.js';
import { CrearAutorizacionesTutor1795540800000 } from './consentimientos/infrastructure/migrations/1795540800000-crear-autorizaciones-tutor.js';

import { ExportacionesModule } from './exportaciones/exportaciones.module.js';
import { logExportacionSchema } from './exportaciones/infrastructure/log-exportacion.schema.js';
import { CrearLogExportaciones1795713600000 } from './exportaciones/infrastructure/migrations/1795713600000-crear-log-exportaciones.js';

@Module({
  imports: [
    // 1. Carga las variables de entorno de .env globalmente
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    // 2. Conexión asíncrona a MySQL con TypeORM
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'mysql',
        host: configService.get<string>('DB_HOST', 'localhost'),
        port: configService.get<number>('DB_PORT', 3306),
        username: configService.get<string>('DB_USER', 'root'),
        password: configService.get<string>('DB_PASSWORD', ''),
        database: configService.get<string>(
          'DB_NAME',
          'comedor_pan_para_todos',
        ),
        entities: [
          Usuario,
          Rol,
          Beneficiario,
          TurnoAtencion,
          Descarte,
          ActaDescarte,
          ExcepcionEntrega,
          equipoRefrigeracionSchema,
          incidenteCadenaFrioSchema,
          accesoCatalogoSchema,
          consentimientoBeneficiarioSchema,
          autorizacionTutorSchema,
          logExportacionSchema,
        ],
        migrations: [
          CrearCadenaFrio1795305600000,
          CrearConsentimientos1795368000000,
          GestionarConsentimientoImagen1795454400000,
          CrearAutorizacionesTutor1795540800000,
          CrearLogExportaciones1795713600000,
        ],
        migrationsRun: true,
        synchronize: true, // Sincroniza las entidades automáticamente creando las tablas en MySQL
      }),
    }),

    AuthModule,

    UsuariosModule,

    BeneficiariosModule,
    TurnosModule,
    CadenaFrioModule,
    ConsentimientosModule,
    DescartesModule,
    ActasDescartesModule,
    ExcepcionesEntregaModule,
    ExportacionesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
