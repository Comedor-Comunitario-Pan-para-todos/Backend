import { Test, TestingModule } from '@nestjs/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { RolEnum } from './enums/rol.enum.js';

describe('AuthController', () => {
  let controller: AuthController;

  const mockAuthService = {
    login: (dto: any) =>
      Promise.resolve({
        accessToken: 'token-prueba',
        usuario: { email: dto.email, rol: RolEnum.COORDINADORA },
      }),
    register: (dto: any) =>
      Promise.resolve({
        id: '1',
        email: dto.email,
        nombreCompleto: dto.nombreCompleto,
        rol: dto.rol,
      }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  it('debe estar definido el controlador de autenticación', () => {
    expect(controller).toBeDefined();
  });

  it('debe responder el perfil de usuario en /auth/me', () => {
    const mockReq = {
      user: {
        id: 'uuid-1',
        email: 'coordinadora@comedor.org',
        nombreCompleto: 'Ana María',
        rol: { nombre: RolEnum.COORDINADORA },
        activo: true,
      },
    };

    const perfil = controller.getProfile(mockReq);
    expect(perfil.email).toBe('coordinadora@comedor.org');
    expect(perfil.rol).toBe(RolEnum.COORDINADORA);
  });
});