import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, In, type EntityManager } from 'typeorm';
import { Beneficiario } from '../../beneficiarios/entities/beneficiario.entity.js';
import { Usuario } from '../../usuarios/entities/usuario.entity.js';
import type { ConsentimientoRepository } from '../domain/consentimiento-repository.port.js';
import { requiereTutorParaImagen } from '../domain/consentimiento-imagen.js';
import {
  FINALIDAD_CONSENTIMIENTO,
  FINALIDAD_USO_IMAGEN,
  type ConsentimientoBeneficiario,
} from '../domain/consentimiento.js';
import {
  consentimientoBeneficiarioSchema,
  type ConsentimientoPersistido,
} from './consentimiento.schema.js';

@Injectable()
export class ConsentimientoTypeOrmAdapter implements ConsentimientoRepository {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  async registrar(consentimiento: ConsentimientoBeneficiario) {
    const { beneficiarioId, finalidad, versionTexto } = consentimiento;
    return this.dataSource.transaction(async (manager) => {
      const ficha = await this.bloquearFicha(manager, beneficiarioId);
      if (!ficha) return null;

      if (finalidad === FINALIDAD_USO_IMAGEN) {
        if (requiereTutorParaImagen(ficha.fechaNacimiento))
          return 'requiere-tutor' as const;

        const vigente = await manager.findOneBy(
          consentimientoBeneficiarioSchema,
          { beneficiarioId, finalidad, activaImagen: true },
        );
        if (vigente) {
          const [evidencia] = await this.conOperadores(manager, [vigente]);
          return { creado: false, consentimiento: evidencia };
        }
        await manager.insert(consentimientoBeneficiarioSchema, {
          ...consentimiento,
          activaImagen: true,
        });
      } else {
        const existente = await manager.findOneBy(
          consentimientoBeneficiarioSchema,
          { beneficiarioId, finalidad, versionTexto },
        );
        if (existente) {
          const [evidencia] = await this.conOperadores(manager, [existente]);
          return { creado: false, consentimiento: evidencia };
        }
        await manager.insert(consentimientoBeneficiarioSchema, consentimiento);
        await manager.update(Beneficiario, beneficiarioId, {
          autorizaTratamientoDatos: true,
        });
      }

      const [evidencia] = await this.conOperadores(manager, [
        {
          ...consentimiento,
          activaImagen: finalidad === FINALIDAD_USO_IMAGEN ? true : null,
        },
      ]);
      return { creado: true, consentimiento: evidencia };
    });
  }

  async revocarImagen(beneficiarioId: string, revocadoPorId: string) {
    return this.dataSource.transaction(async (manager) => {
      if (!(await this.bloquearFicha(manager, beneficiarioId))) return null;
      const vigente = await manager.findOneBy(
        consentimientoBeneficiarioSchema,
        {
          beneficiarioId,
          finalidad: FINALIDAD_USO_IMAGEN,
          activaImagen: true,
        },
      );
      if (!vigente) return null;

      const actualizacion = {
        activaImagen: null,
        revocadoPorId,
        revocadoEn: new Date(),
      };
      await manager.update(
        consentimientoBeneficiarioSchema,
        vigente.id,
        actualizacion,
      );
      const [evidencia] = await this.conOperadores(manager, [
        { ...vigente, ...actualizacion },
      ]);
      return evidencia;
    });
  }

  async historialImagen(beneficiarioId: string) {
    return this.dataSource.transaction(async (manager) => {
      const ficha = await manager.findOne(Beneficiario, {
        select: { id: true, fechaNacimiento: true },
        where: { id: beneficiarioId },
      });
      if (!ficha) return null;
      const registros = await manager
        .createQueryBuilder(consentimientoBeneficiarioSchema, 'historial')
        .where({ beneficiarioId, finalidad: FINALIDAD_USO_IMAGEN })
        .orderBy('historial.ordenConsentimiento', 'DESC')
        .getMany();
      const verificables = requiereTutorParaImagen(ficha.fechaNacimiento)
        ? registros.map((registro) => ({ ...registro, activaImagen: null }))
        : registros;
      return this.conOperadores(manager, verificables);
    });
  }

  async buscarImagenesVigentes(beneficiarioIds: string[]) {
    if (beneficiarioIds.length === 0) return [];
    const manager = this.dataSource.manager;
    const vigentes = await manager.findBy(consentimientoBeneficiarioSchema, {
      beneficiarioId: In(beneficiarioIds),
      finalidad: FINALIDAD_USO_IMAGEN,
      activaImagen: true,
    });
    return this.conOperadores(manager, vigentes);
  }

  async buscarVigentes(beneficiarioIds: string[]) {
    if (beneficiarioIds.length === 0) return [];

    const repository = this.dataSource.getRepository(
      consentimientoBeneficiarioSchema,
    );
    const vigentes = await repository
      .createQueryBuilder('actual')
      .where({
        beneficiarioId: In(beneficiarioIds),
        finalidad: FINALIDAD_CONSENTIMIENTO,
      })
      .andWhere((query) => {
        const posterior = query
          .subQuery()
          .select('1')
          .from(consentimientoBeneficiarioSchema, 'posterior')
          .where('posterior.beneficiarioId = actual.beneficiarioId')
          .andWhere('posterior.finalidad = actual.finalidad')
          .andWhere('posterior.versionTexto > actual.versionTexto')
          .getQuery();
        return 'NOT EXISTS ' + posterior;
      })
      .getMany();
    return this.conOperadores(this.dataSource.manager, vigentes);
  }

  private bloquearFicha(manager: EntityManager, id: string) {
    return manager.findOne(Beneficiario, {
      select: { id: true, fechaNacimiento: true },
      where: { id },
      lock: { mode: 'pessimistic_write' },
    });
  }

  private async conOperadores(
    manager: EntityManager,
    consentimientos: ConsentimientoPersistido[],
  ) {
    if (consentimientos.length === 0) return [];

    const ids = new Set<string>();
    for (const registro of consentimientos) {
      ids.add(registro.registradoPorId);
      if (registro.revocadoPorId) ids.add(registro.revocadoPorId);
    }
    const usuarios = await manager.find(Usuario, {
      select: { id: true, nombreCompleto: true },
      where: { id: In([...ids]) },
      withDeleted: true,
    });
    const nombres = new Map(
      usuarios.map(({ id, nombreCompleto }) => [id, nombreCompleto]),
    );
    const operador = (id: string) => ({
      id,
      nombreCompleto: nombres.get(id) ?? null,
    });
    return consentimientos.map(
      ({
        activaImagen: _activa,
        revocadoPorId,
        revocadoEn,
        ...consentimiento
      }) => ({
        ...consentimiento,
        registradoPor: operador(consentimiento.registradoPorId),
        ...(consentimiento.finalidad === FINALIDAD_USO_IMAGEN
          ? {
              versionPolitica: consentimiento.versionTexto,
              createdAt: consentimiento.registradoEn,
              revocadoPor: revocadoPorId ? operador(revocadoPorId) : null,
              revocadoEn: revocadoEn ?? null,
              vigente: _activa === true,
            }
          : {}),
      }),
    );
  }
}
