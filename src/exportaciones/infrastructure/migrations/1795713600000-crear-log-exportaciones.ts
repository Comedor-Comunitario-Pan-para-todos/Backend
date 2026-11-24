import type { MigrationInterface, QueryRunner } from 'typeorm';

export class CrearLogExportaciones1795713600000 implements MigrationInterface {
  async up(runner: QueryRunner): Promise<void> {
    await runner.query(`
      CREATE TABLE IF NOT EXISTS log_exportaciones_beneficiarios (
        id varchar(36) PRIMARY KEY,
        usuarioId varchar(36) NOT NULL,
        registradoEn datetime(3) NOT NULL,
        total int unsigned NOT NULL,
        desde date NULL,
        hasta date NULL
      ) ENGINE=InnoDB
    `);
    await this.versiones(
      runner,
      "finalidad <> 'USO_IMAGEN' AND (finalidad <> 'REPORTE_ALCALDIA' OR revocadoEn IS NULL)",
    );
  }

  async down(runner: QueryRunner): Promise<void> {
    const logs: unknown[] = await runner.query(
      'SELECT 1 FROM log_exportaciones_beneficiarios LIMIT 1',
    );
    if (logs.length)
      throw new Error('La reversión eliminaría la auditoría de exportaciones');
    await this.versiones(runner, "finalidad <> 'USO_IMAGEN'");
    await runner.query('DROP TABLE IF EXISTS log_exportaciones_beneficiarios');
  }

  private async versiones(runner: QueryRunner, condicion: string) {
    await runner.query(`
      ALTER TABLE consentimientos_beneficiarios
      DROP INDEX uq_consentimiento_alimentario,
      MODIFY COLUMN versionAlimentaria int GENERATED ALWAYS AS (
        CASE WHEN ${condicion} THEN versionTexto ELSE NULL END
      ) STORED,
      ADD UNIQUE KEY uq_consentimiento_alimentario (beneficiarioId, finalidad, versionAlimentaria)
    `);
  }
}
