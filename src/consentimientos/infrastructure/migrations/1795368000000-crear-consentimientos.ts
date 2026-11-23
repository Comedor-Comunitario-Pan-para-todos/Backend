import type { MigrationInterface, QueryRunner } from 'typeorm';

export class CrearConsentimientos1795368000000 implements MigrationInterface {
  async up(runner: QueryRunner): Promise<void> {
    await runner.query(`
      CREATE TABLE IF NOT EXISTS consentimientos_beneficiarios (
        id varchar(36) PRIMARY KEY,
        beneficiarioId varchar(36) NOT NULL,
        aceptado boolean NOT NULL CHECK (aceptado = 1),
        versionTexto int NOT NULL CHECK (versionTexto >= 1),
        finalidad varchar(255) NOT NULL,
        metodo enum('FIRMA_SIMPLE', 'HUELLA', 'VERBAL_CON_TESTIGO') NOT NULL,
        registradoPorId varchar(36) NOT NULL,
        registradoEn datetime(3) NOT NULL,
        UNIQUE KEY uq_consentimiento_version (beneficiarioId, finalidad, versionTexto)
      ) ENGINE=InnoDB
    `);
  }

  async down(runner: QueryRunner): Promise<void> {
    await runner.query('DROP TABLE IF EXISTS consentimientos_beneficiarios');
  }
}
