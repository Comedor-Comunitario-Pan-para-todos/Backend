import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { beforeEach, describe, expect, it } from 'vitest';
import { Rol } from '../usuarios/entities/rol.entity.js';
import { LoginUseCase } from './application/use-cases/login.use-case.js';
import { RegisterUseCase } from './application/use-cases/register.use-case.js';
import { AuthService } from './auth.service.js';

describe('AuthService', () => {
  let service: AuthService;

  const mockRolRepository = {
    findOne: () => Promise.resolve(null),
    create: (dto: any) => dto,
    save: (entity: any) => Promise.resolve({ id: 1, ...entity }),
  };

  const mockLoginUseCase = {
    execute: () => Promise.resolve({ accessToken: 'token' }),
  };

  const mockRegisterUseCase = {
    execute: () => Promise.resolve({ id: '1' }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: getRepositoryToken(Rol),
          useValue: mockRolRepository,
        },
        {
          provide: LoginUseCase,
          useValue: mockLoginUseCase,
        },
        {
          provide: RegisterUseCase,
          useValue: mockRegisterUseCase,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('debe estar definido el servicio de autenticación', () => {
    expect(service).toBeDefined();
  });
});
