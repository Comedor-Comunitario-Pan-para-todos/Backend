import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Rol } from '../usuarios/entities/rol.entity.js';
import { Usuario } from '../usuarios/entities/usuario.entity.js';
import { LoginUseCase } from './application/use-cases/login.use-case.js';
import { RegisterUseCase } from './application/use-cases/register.use-case.js';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { PASSWORD_HASHER_PORT } from './domain/ports/password-hasher.port.js';
import { TOKEN_SERVICE_PORT } from './domain/ports/token-service.port.js';
import { JwtAuthGuard } from './guards/jwt-auth.guard.js';
import { RolesGuard } from './guards/roles.guard.js';
import { BcryptPasswordHasherAdapter } from './infrastructure/adapters/out/bcrypt-password-hasher.adapter.js';
import { JwtTokenAdapter } from './infrastructure/adapters/out/jwt-token.adapter.js';
import { JwtStrategy } from './strategies/jwt.strategy.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([Usuario, Rol]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret:
          configService.get<string>('JWT_SECRET') ||
          'super_clave_secreta_comedor_2026',
        signOptions: {
          expiresIn: configService.get<string>('JWT_EXPIRES_IN', '24h') as any,
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    LoginUseCase,
    RegisterUseCase,
    JwtStrategy,
    JwtAuthGuard,
    RolesGuard,
    // Vinculación de Puertos con sus Adaptadores
    {
      provide: PASSWORD_HASHER_PORT,
      useClass: BcryptPasswordHasherAdapter,
    },
    {
      provide: TOKEN_SERVICE_PORT,
      useClass: JwtTokenAdapter,
    },
  ],
  exports: [
    AuthService,
    JwtAuthGuard,
    RolesGuard,
    PassportModule,
    JwtModule,
    PASSWORD_HASHER_PORT,
  ],
})
export class AuthModule {}
