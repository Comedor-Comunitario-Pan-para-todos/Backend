import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RolEnum } from '../../../../enums/rol.enum.js';
import { RolModel, UsuarioModel } from '../../../../domain/models/usuario.model.js';
import {
  PaginatedResult,
  PaginationOptions,
  UsuarioRepositoryPort,
} from '../../../../domain/ports/usuario-repository.port.js';
import { Rol } from '../../../../entities/rol.entity.js';
import { Usuario } from '../../../../entities/usuario.entity.js';

@Injectable()
export class UsuarioTypeOrmAdapter implements UsuarioRepositoryPort {
  constructor(
    @InjectRepository(Usuario)
    private readonly usuarioRepo: Repository<Usuario>,
    @InjectRepository(Rol)
    private readonly rolRepo: Repository<Rol>,
  ) {}

  private mapRolToModel(rol: Rol): RolModel {
    return new RolModel(rol.id, rol.nombre, rol.descripcion);
  }

  private mapUsuarioToModel(usuario: Usuario): UsuarioModel {
    return new UsuarioModel(
      usuario.id,
      usuario.email,
      usuario.nombreCompleto,
      usuario.activo,
      usuario.rol ? this.mapRolToModel(usuario.rol) : (null as any),
      (usuario as any).password,
      usuario.createdAt,
      usuario.updatedAt,
    );
  }

  async findById(id: string): Promise<UsuarioModel | null> {
    const usuario = await this.usuarioRepo.findOne({
      where: { id },
      relations: { rol: true },
    });
    return usuario ? this.mapUsuarioToModel(usuario) : null;
  }

  async findByEmail(email: string, includePassword = false): Promise<UsuarioModel | null> {
    const qb = this.usuarioRepo
      .createQueryBuilder('usuario')
      .leftJoinAndSelect('usuario.rol', 'rol')
      .where('usuario.email = :email', { email });

    if (includePassword) {
      qb.addSelect('usuario.password');
    }

    const usuario = await qb.getOne();
    return usuario ? this.mapUsuarioToModel(usuario) : null;
  }

  async findAndPaginate(options: PaginationOptions): Promise<PaginatedResult<UsuarioModel>> {
    const { pagina, limite, rol, activo, busqueda } = options;

    const qb = this.usuarioRepo
      .createQueryBuilder('usuario')
      .leftJoinAndSelect('usuario.rol', 'rol');

    if (rol) {
      qb.andWhere('rol.nombre = :rol', { rol });
    }

    if (activo !== undefined) {
      qb.andWhere('usuario.activo = :activo', { activo });
    }

    if (busqueda) {
      qb.andWhere(
        '(LOWER(usuario.nombreCompleto) LIKE :busqueda OR LOWER(usuario.email) LIKE :busqueda)',
        { busqueda: `%${busqueda.toLowerCase()}%` },
      );
    }

    qb.orderBy('usuario.createdAt', 'DESC')
      .skip((pagina - 1) * limite)
      .take(limite);

    const [data, total] = await qb.getManyAndCount();

    return {
      data: data.map((u) => this.mapUsuarioToModel(u)),
      meta: {
        total,
        pagina,
        limite,
        totalPaginas: Math.ceil(total / limite),
      },
    };
  }

  async save(
    usuarioData: Partial<UsuarioModel> & { password?: string; rol: RolModel },
  ): Promise<UsuarioModel> {
    const rolEntity = await this.rolRepo.findOne({
      where: { id: usuarioData.rol.id },
    });

    const entidad = this.usuarioRepo.create({
      id: usuarioData.id,
      email: usuarioData.email,
      nombreCompleto: usuarioData.nombreCompleto,
      activo: usuarioData.activo,
      password: usuarioData.password,
      rol: rolEntity!,
    });

    const guardado = await this.usuarioRepo.save(entidad);
    return this.mapUsuarioToModel(guardado);
  }

  async countCoordinadorasActivas(): Promise<number> {
    return this.usuarioRepo
      .createQueryBuilder('usuario')
      .leftJoin('usuario.rol', 'rol')
      .where('rol.nombre = :rol', { rol: RolEnum.COORDINADORA })
      .andWhere('usuario.activo = true')
      .getCount();
  }

  async findRolByNombre(nombre: RolEnum): Promise<RolModel | null> {
    const rol = await this.rolRepo.findOne({ where: { nombre } });
    return rol ? this.mapRolToModel(rol) : null;
  }
}
