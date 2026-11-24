import { Injectable, Inject } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { randomUUID } from 'node:crypto';
import { DataSource, In, type EntityManager } from 'typeorm';
import {
  PASSWORD_HASHER_PORT,
  type PasswordHasherPort,
} from '../../auth/domain/ports/password-hasher.port.js';
import { Usuario } from '../../usuarios/entities/usuario.entity.js';
import { RolEnum } from '../../usuarios/enums/rol.enum.js';
import {
  EventoRetencion,
  type BitacoraRetencion,
  type PlazosRetencion,
  type PoliticaRetencion,
  type RetencionRepositorio,
} from '../domain/retencion.js';
import {
  bitacoraRetencionSchema,
  politicaRetencionSchema,
} from './retencion.schemas.js';

const DIA_MS = 86_400_000;

@Injectable()
export class RetencionTypeOrmAdapter implements RetencionRepositorio {
  constructor(
    @InjectDataSource() private readonly db: DataSource,
    @Inject(PASSWORD_HASHER_PORT) private readonly hasher: PasswordHasherPort,
  ) {}

  consultar(actorId: string) {
    return this.db.transaction(async (manager) => {
      const politica = await this.leerPolitica(manager);
      const historial = await manager.find(bitacoraRetencionSchema, {
        where: {
          evento: In([
            EventoRetencion.CAMBIO_POLITICA,
            EventoRetencion.VERIFICACION,
          ]),
        },
        order: { registradoEn: 'DESC', id: 'DESC' },
        take: 100,
      });
      await this.auditar(
        manager,
        EventoRetencion.CONSULTA,
        actorId,
        new Date(),
      );
      return { politica, historial };
    });
  }

  actualizar(plazos: PlazosRetencion, actorId: string, password: string) {
    return this.db.transaction(async (manager) => {
      const operador = await manager
        .createQueryBuilder(Usuario, 'usuario')
        .innerJoin('usuario.rol', 'rol')
        .select('usuario.id')
        .addSelect('usuario.password')
        .where(
          'usuario.id = :actorId AND usuario.activo = true AND rol.nombre = :rol',
          { actorId, rol: RolEnum.COORDINADORA },
        )
        .getOne();
      if (
        !operador ||
        !(await this.hasher.compare(password, operador.password))
      )
        return null;

      const anterior = await this.leerPolitica(manager, true);
      const actualizadaEn = new Date();
      const politica = { ...plazos, actualizadaPorId: actorId, actualizadaEn };
      await manager.update(politicaRetencionSchema, 1, politica);
      await manager.query('DELETE FROM retencion_pendiente_verificacion');
      await this.auditar(
        manager,
        EventoRetencion.CAMBIO_POLITICA,
        actorId,
        actualizadaEn,
        {
          anterior: anterior && {
            diasBasicos: anterior.diasBasicos,
            diasSensibles: anterior.diasSensibles,
          },
          vigente: plazos,
        },
      );
      return politica;
    });
  }

  verificar(ahora: Date) {
    return this.db.transaction(async (manager) => {
      const politica = await this.leerPolitica(manager, true);
      if (!politica) return;

      const limiteBasico = new Date(
        ahora.getTime() - politica.diasBasicos * DIA_MS,
      );
      const limiteSensible = new Date(
        ahora.getTime() - politica.diasSensibles * DIA_MS,
      );

      // La tabla derivada se reemplaza en una transacción; ningún expediente se modifica.
      await manager.query('DELETE FROM retencion_pendiente_verificacion');
      await manager.query(
        `
        INSERT INTO retencion_pendiente_verificacion (beneficiarioId, datosBasicos, datosSensibles, verificadoEn)
        SELECT id, basicos, sensibles, ?
        FROM (
          SELECT id,
            ultimaActividad <= ? AS basicos,
            (tieneSensibles AND ultimaActividad <= ?) AS sensibles
          FROM (
            SELECT b.id,
              GREATEST(b.updatedAt, COALESCE(b.deletedAt, b.updatedAt),
                COALESCE(t.actividad, b.updatedAt), COALESCE(c.actividad, b.updatedAt),
                COALESCE(a.actividad, b.updatedAt)) AS ultimaActividad,
              (b.numeroDocumento IS NOT NULL OR b.tipoDocumento IS NOT NULL OR
                b.telefono IS NOT NULL OR b.clasificacionSocioeconomica IS NOT NULL) AS tieneSensibles
            FROM beneficiarios b
            LEFT JOIN (
              SELECT t.beneficiarioId, MAX(GREATEST(t.updatedAt, COALESCE(e.updatedAt, t.updatedAt))) AS actividad
              FROM turnos_atencion t LEFT JOIN excepciones_entrega e ON e.turnoId = t.id
              GROUP BY t.beneficiarioId
            ) t ON t.beneficiarioId = b.id
            LEFT JOIN (
              SELECT beneficiarioId, MAX(GREATEST(registradoEn, COALESCE(revocadoEn, registradoEn))) AS actividad
              FROM consentimientos_beneficiarios GROUP BY beneficiarioId
            ) c ON c.beneficiarioId = b.id
            LEFT JOIN (
              SELECT beneficiarioId, MAX(GREATEST(fechaAprobacion, COALESCE(fechaRevocacion, fechaAprobacion))) AS actividad
              FROM autorizaciones_tutor GROUP BY beneficiarioId
            ) a ON a.beneficiarioId = b.id
          ) actividad
        ) vencidos
        WHERE basicos OR sensibles
      `,
        [ahora, limiteBasico, limiteSensible],
      );
      const [totales] = await manager.query<
        { basicos: string | null; sensibles: string | null }[]
      >(
        'SELECT SUM(datosBasicos) AS basicos, SUM(datosSensibles) AS sensibles FROM retencion_pendiente_verificacion',
      );
      await this.auditar(manager, EventoRetencion.VERIFICACION, null, ahora, {
        vigente: {
          diasBasicos: politica.diasBasicos,
          diasSensibles: politica.diasSensibles,
        },
        basicosPendientes: Number(totales.basicos ?? 0),
        sensiblesPendientes: Number(totales.sensibles ?? 0),
      });
    });
  }

  private async leerPolitica(
    manager: EntityManager,
    bloquear = false,
  ): Promise<PoliticaRetencion | null> {
    const { diasBasicos, diasSensibles, actualizadaEn, actualizadaPorId } =
      await manager.findOneOrFail(politicaRetencionSchema, {
        where: { id: 1 },
        lock: bloquear ? { mode: 'pessimistic_write' } : undefined,
      });
    return diasBasicos !== null &&
      diasSensibles !== null &&
      actualizadaEn &&
      actualizadaPorId
      ? { diasBasicos, diasSensibles, actualizadaEn, actualizadaPorId }
      : null;
  }

  private async auditar(
    manager: EntityManager,
    evento: EventoRetencion,
    operadorId: string | null,
    registradoEn: Date,
    detalles: Partial<
      Pick<
        BitacoraRetencion,
        'anterior' | 'vigente' | 'basicosPendientes' | 'sensiblesPendientes'
      >
    > = {},
  ) {
    await manager.insert(bitacoraRetencionSchema, {
      id: randomUUID(),
      evento,
      operadorId,
      registradoEn,
      anterior: null,
      vigente: null,
      basicosPendientes: null,
      sensiblesPendientes: null,
      ...detalles,
    });
  }
}
