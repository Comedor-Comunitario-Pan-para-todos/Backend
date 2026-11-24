import type { MigrationInterface, QueryRunner } from 'typeorm';

export class GestionarConsentimientoImagen1795454400000 implements MigrationInterface {
  async up(runner: QueryRunner): Promise<void> {
    await runner.query(`
      ALTER TABLE consentimientos_beneficiarios
      ADD COLUMN activaImagen tinyint NULL,
      ADD COLUMN ordenConsentimiento bigint unsigned NOT NULL AUTO_INCREMENT UNIQUE,
      ADD COLUMN revocadoPorId varchar(36) NULL,
      ADD COLUMN revocadoEn datetime(3) NULL,
      ADD COLUMN versionAlimentaria int GENERATED ALWAYS AS (
        CASE WHEN finalidad <> 'USO_IMAGEN' THEN versionTexto ELSE NULL END
      ) STORED,
      ADD UNIQUE KEY uq_consentimiento_alimentario (beneficiarioId, finalidad, versionAlimentaria),
      ADD UNIQUE KEY uq_imagen_activa (beneficiarioId, finalidad, activaImagen),
      ADD CONSTRAINT ck_imagen_activa CHECK (activaImagen IS NULL OR (activaImagen = 1 AND finalidad = 'USO_IMAGEN')),
      DROP INDEX uq_consentimiento_version
    `);
  }

  async down(runner: QueryRunner): Promise<void> {
    const revocaciones: unknown[] = await runner.query(
      'SELECT 1 FROM consentimientos_beneficiarios WHERE revocadoEn IS NOT NULL LIMIT 1',
    );
    if (revocaciones.length > 0)
      throw new Error(
        'Exporte las revocaciones antes de volver al esquema anterior; este no conserva la evidencia de revocación',
      );
    const duplicados: unknown[] = await runner.query(`
      SELECT 1 FROM consentimientos_beneficiarios
      GROUP BY beneficiarioId, finalidad, versionTexto
      HAVING COUNT(*) > 1 LIMIT 1
    `);
    if (duplicados.length > 0) {
      throw new Error(
        'La versión anterior no admite el historial de imagen con versiones repetidas',
      );
    }
    await runner.query(`
      ALTER TABLE consentimientos_beneficiarios
      ADD UNIQUE KEY uq_consentimiento_version (beneficiarioId, finalidad, versionTexto),
      DROP INDEX uq_consentimiento_alimentario,
      DROP INDEX uq_imagen_activa,
      DROP CONSTRAINT ck_imagen_activa,
      DROP COLUMN ordenConsentimiento,
      DROP COLUMN versionAlimentaria,
      DROP COLUMN revocadoEn,
      DROP COLUMN revocadoPorId,
      DROP COLUMN activaImagen
    `);
  }
}
