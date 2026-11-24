import type { EntityManager } from 'typeorm';
import { Beneficiario } from '../../beneficiarios/entities/beneficiario.entity.js';
import { FINALIDAD_USO_IMAGEN } from '../domain/consentimiento.js';
import {
  consentimientoBeneficiarioSchema,
  type ConsentimientoPersistido,
} from './consentimiento.schema.js';

export function bloquearFicha(manager: EntityManager, id: string) {
  return manager.findOne(Beneficiario, {
    select: { id: true, fechaNacimiento: true },
    where: { id },
    lock: { mode: 'pessimistic_write' },
  });
}

export function buscarImagenActiva(
  manager: EntityManager,
  beneficiarioId: string,
) {
  return manager.findOneBy(consentimientoBeneficiarioSchema, {
    beneficiarioId,
    finalidad: FINALIDAD_USO_IMAGEN,
    activaImagen: true,
  });
}

export async function retirarImagen(
  manager: EntityManager,
  vigente: ConsentimientoPersistido,
  revocadoPorId: string,
  revocadoEn = new Date(),
) {
  const cambios = { activaImagen: null, revocadoPorId, revocadoEn };
  await manager.update(consentimientoBeneficiarioSchema, vigente.id, cambios);
  return { ...vigente, ...cambios };
}
