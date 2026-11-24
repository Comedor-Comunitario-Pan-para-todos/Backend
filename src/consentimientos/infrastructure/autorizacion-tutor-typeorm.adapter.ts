import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { randomUUID } from 'node:crypto';
import { DataSource, In, type EntityManager } from 'typeorm';
import { Usuario } from '../../usuarios/entities/usuario.entity.js';
import type { AutorizacionTutorRepository } from '../domain/autorizacion-tutor-repository.port.js';
import {
  EstadoAutorizacionTutor,
  type AutorizacionTutor,
  type DatosTutor,
  type SoporteTutor,
} from '../domain/autorizacion-tutor.js';
import { clasificarEdad } from '../../beneficiarios/domain/edad-beneficiario.js';
import { autorizacionTutorSchema } from './autorizacion-tutor.schema.js';
import {
  bloquearFicha,
  buscarImagenActiva,
  retirarImagen,
} from './imagen-transaccion.js';

@Injectable()
export class AutorizacionTutorTypeOrmAdapter implements AutorizacionTutorRepository {
  private readonly logger = new Logger(AutorizacionTutorTypeOrmAdapter.name);

  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  registrar(
    beneficiarioId: string,
    datos: DatosTutor,
    soporte: SoporteTutor,
    actorId: string,
  ) {
    return this.transaccion('REGISTRAR', async (manager) => {
      const ficha = await bloquearFicha(manager, beneficiarioId);
      if (!ficha) return null;
      if (clasificarEdad(ficha.fechaNacimiento) !== 'menor')
        return 'edad-no-elegible' as const;
      if (
        await manager.existsBy(autorizacionTutorSchema, {
          beneficiarioId,
          estado: EstadoAutorizacionTutor.ACTIVA,
        })
      ) {
        return 'activa' as const;
      }
      const registro: AutorizacionTutor = {
        ...datos,
        id: randomUUID(),
        beneficiarioId,
        estado: EstadoAutorizacionTutor.ACTIVA,
        aprobadaPorId: actorId,
        fechaAprobacion: new Date(),
        soporteTipoMime: soporte.mimetype,
        soporteTamanoBytes: soporte.buffer.length,
        revocadaPorId: null,
        fechaRevocacion: null,
        motivoRevocacion: null,
      };
      await manager.insert(autorizacionTutorSchema, {
        ...registro,
        soporte: soporte.buffer,
      });
      const [respuesta] = await this.conOperadores(manager, [registro]);
      return respuesta;
    });
  }

  revocar(beneficiarioId: string, motivo: string, actorId: string) {
    return this.transaccion('REVOCAR', async (manager) => {
      if (!(await bloquearFicha(manager, beneficiarioId))) return null;
      const activa = await manager.findOneBy(autorizacionTutorSchema, {
        beneficiarioId,
        estado: EstadoAutorizacionTutor.ACTIVA,
      });
      if (!activa) return null;
      const cambios = {
        estado: EstadoAutorizacionTutor.REVOCADA,
        revocadaPorId: actorId,
        fechaRevocacion: new Date(),
        motivoRevocacion: motivo,
      };
      await manager.update(autorizacionTutorSchema, activa.id, cambios);

      const imagen = await buscarImagenActiva(manager, beneficiarioId);
      if (imagen?.autorizacionTutorId === activa.id) {
        await retirarImagen(manager, imagen, actorId, cambios.fechaRevocacion);
      }
      const [respuesta] = await this.conOperadores(manager, [
        { ...activa, ...cambios },
      ]);
      return respuesta;
    });
  }

  async buscarActivas(beneficiarioIds: string[]) {
    if (beneficiarioIds.length === 0) return [];
    try {
      const manager = this.dataSource.manager;
      const registros = await manager.findBy(autorizacionTutorSchema, {
        beneficiarioId: In(beneficiarioIds),
        estado: EstadoAutorizacionTutor.ACTIVA,
      });
      return await this.conOperadores(manager, registros);
    } catch {
      this.logger.error(
        'Error de persistencia al consultar autorizaciones de tutor',
      );
      throw new InternalServerErrorException(
        'No se pudieron consultar las autorizaciones',
      );
    }
  }

  private async transaccion<T>(
    operacion: string,
    trabajo: (manager: EntityManager) => Promise<T>,
  ) {
    try {
      return await this.dataSource.transaction(trabajo);
    } catch {
      this.logger.error(
        'Error de persistencia en autorización de tutor: ' + operacion,
      );
      throw new InternalServerErrorException(
        'No se pudo guardar la autorización del tutor',
      );
    }
  }

  private async conOperadores(
    manager: EntityManager,
    registros: AutorizacionTutor[],
  ) {
    if (registros.length === 0) return [];
    const ids = new Set<string>();
    for (const registro of registros) {
      ids.add(registro.aprobadaPorId);
      if (registro.revocadaPorId) ids.add(registro.revocadaPorId);
    }
    const usuarios = await manager.find(Usuario, {
      where: { id: In([...ids]) },
      select: { id: true, nombreCompleto: true },
      withDeleted: true,
    });
    const nombres = new Map(
      usuarios.map(({ id, nombreCompleto }) => [id, nombreCompleto]),
    );
    const operador = (id: string) => ({
      id,
      nombreCompleto: nombres.get(id) ?? null,
    });
    return registros.map((registro) => ({
      ...registro,
      aprobadaPor: operador(registro.aprobadaPorId),
      revocadaPor: registro.revocadaPorId
        ? operador(registro.revocadaPorId)
        : null,
    }));
  }
}
