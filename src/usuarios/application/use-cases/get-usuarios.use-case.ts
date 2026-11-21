import { Inject, Injectable } from '@nestjs/common';
import {
  USUARIO_REPOSITORY_PORT,
  type UsuarioRepositoryPort,
} from '../../domain/ports/usuario-repository.port.js';
import { QueryUsuariosDto } from '../../dto/query-usuarios.dto.js';

@Injectable()
export class GetUsuariosUseCase {
  constructor(
    @Inject(USUARIO_REPOSITORY_PORT)
    private readonly usuarioRepo: UsuarioRepositoryPort,
  ) {}

  async execute(queryDto: QueryUsuariosDto) {
    const pagina = queryDto.page ? Number(queryDto.page) : 1;
    const limite = queryDto.limit ? Number(queryDto.limit) : 10;

    return this.usuarioRepo.findAndPaginate({
      pagina,
      limite,
      rol: queryDto.rol,
      activo: queryDto.activo,
      busqueda: queryDto.search,
    });
  }

  async executeFindById(id: string) {
    return this.usuarioRepo.findById(id);
  }
}
