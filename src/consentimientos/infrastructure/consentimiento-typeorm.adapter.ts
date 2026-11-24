import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, In, type EntityManager } from 'typeorm';
import { Beneficiario } from '../../beneficiarios/entities/beneficiario.entity.js';
import { Usuario } from '../../usuarios/entities/usuario.entity.js';
import type { ConsentimientoRepository } from '../domain/consentimiento-repository.port.js';
import { imagenAplicaParaEdad } from '../domain/consentimiento-imagen.js';
import { clasificarEdad } from '../../beneficiarios/domain/edad-beneficiario.js';
import { EstadoAutorizacionTutor } from '../domain/autorizacion-tutor.js';
import { autorizacionTutorSchema } from './autorizacion-tutor.schema.js';
import {
  bloquearFicha,
  buscarImagenActiva,
  retirarImagen,
} from './imagen-transaccion.js';
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

  async registrar(
    consentimiento: ConsentimientoBeneficiario,
    puedeAutorizarMenor: boolean,
  ) {
    const { beneficiarioId, finalidad, versionTexto } = consentimiento;
    return this.dataSource.transaction(async (manager) => {
      const ficha = await bloquearFicha(manager, beneficiarioId);
      if (!ficha) return null;

      let autorizacionTutorId: string | null = null;
      if (finalidad === FINALIDAD_USO_IMAGEN) {
        const edad = clasificarEdad(ficha.fechaNacimiento);
        if (edad !== 'adulto') {
          if (!puedeAutorizarMenor) return 'requiere-coordinadora' as const;
          const tutor =
            edad === 'menor'
              ? await this.buscarTutorActivo(manager, beneficiarioId)
              : null;
          if (!tutor) return 'requiere-tutor' as const;
          autorizacionTutorId = tutor.id;
        }
        const vigente = await buscarImagenActiva(manager, beneficiarioId);
        if (
          vigente &&
          imagenAplicaParaEdad(
            ficha.fechaNacimiento,
            vigente.autorizacionTutorId,
            autorizacionTutorId ?? undefined,
          )
        ) {
          const [evidencia] = await this.conOperadores(manager, [vigente]);
          return { creado: false, consentimiento: evidencia };
        }
        if (vigente)
          await retirarImagen(manager, vigente, consentimiento.registradoPorId);
        await manager.insert(consentimientoBeneficiarioSchema, {
          ...consentimiento,
          autorizacionTutorId,
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
          autorizacionTutorId,
        },
      ]);
      return { creado: true, consentimiento: evidencia };
    });
  }

  async revocarImagen(beneficiarioId: string, revocadoPorId: string) {
    return this.dataSource.transaction(async (manager) => {
      if (!(await bloquearFicha(manager, beneficiarioId))) return null;
      const vigente = await buscarImagenActiva(manager, beneficiarioId);
      if (!vigente) return null;

      const revocado = await retirarImagen(manager, vigente, revocadoPorId);
      const [evidencia] = await this.conOperadores(manager, [revocado]);
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
      const tutor =
        clasificarEdad(ficha.fechaNacimiento) === 'menor'
          ? await this.buscarTutorActivo(manager, beneficiarioId)
          : null;
      const verificables = registros.map((registro) =>
        imagenAplicaParaEdad(
          ficha.fechaNacimiento,
          registro.autorizacionTutorId,
          tutor?.id,
        )
          ? registro
          : { ...registro, activaImagen: null },
      );
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

  private buscarTutorActivo(manager: EntityManager, beneficiarioId: string) {
    return manager.findOne(autorizacionTutorSchema, {
      select: { id: true },
      where: { beneficiarioId, estado: EstadoAutorizacionTutor.ACTIVA },
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
        autorizacionTutorId,
        revocadoPorId,
        revocadoEn,
        ...consentimiento
      }) => ({
        ...consentimiento,
        registradoPor: operador(consentimiento.registradoPorId),
        ...(consentimiento.finalidad === FINALIDAD_USO_IMAGEN
          ? {
              autorizacionTutorId: autorizacionTutorId ?? null,
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
