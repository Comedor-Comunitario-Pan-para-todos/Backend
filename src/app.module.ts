import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { AuthModule } from './auth/auth.module.js';
import { Rol } from './auth/entities/rol.entity.js';
import { Usuario } from './auth/entities/usuario.entity.js';

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
        database: configService.get<string>('DB_NAME', 'comedor_pan_para_todos'),
        entities: [Usuario, Rol],
        synchronize: true, // Sincroniza las entidades automáticamente creando las tablas en MySQL
      }),
    }),

    AuthModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }