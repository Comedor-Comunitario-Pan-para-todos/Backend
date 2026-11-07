import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { beforeEach, describe, expect, it } from 'vitest';
import { AuthService } from './auth.service.js';
import { Rol } from './entities/rol.entity.js';
import { Usuario } from './entities/usuario.entity.js';

describe('AuthService', () => {
  let service: AuthService;

  const mockUsuarioRepository = {
    findOne: () => Promise.resolve(null),
    create: (dto: any) => dto,
    save: (entity: any) => Promise.resolve({ id: 'uuid-123', ...entity }),
    createQueryBuilder: () => ({
      addSelect: function () {
        return this;
      },
      leftJoinAndSelect: function () {
        return this;
      },
      where: function () {
        return this;
      },
      getOne: () => Promise.resolve(null),
    }),
  };

  const mockRolRepository = {
    findOne: () => Promise.resolve(null),
    create: (dto: any) => dto,
    save: (entity: any) => Promise.resolve({ id: 1, ...entity }),
  };

  const mockJwtService = {
    sign: () => 'fake-jwt-token',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: getRepositoryToken(Usuario),
          useValue: mockUsuarioRepository,
        },
        {
          provide: getRepositoryToken(Rol),
          useValue: mockRolRepository,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('debe estar definido el servicio de autenticación', () => {
    expect(service).toBeDefined();
  });
});