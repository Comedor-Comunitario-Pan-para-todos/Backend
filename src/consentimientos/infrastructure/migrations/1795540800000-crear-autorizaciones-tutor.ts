import type { MigrationInterface, QueryRunner } from 'typeorm';

export class CrearAutorizacionesTutor1795540800000 implements MigrationInterface {
  async up(runner: QueryRunner): Promise<void> {
    await runner.query(`
      CREATE TABLE IF NOT EXISTS autorizaciones_tutor (
        id varchar(36) PRIMARY KEY,
        beneficiarioId varchar(36) NOT NULL,
        nombreTutor varchar(150) NOT NULL,
        tipoDocumentoTutor varchar(10) NOT NULL,
        numeroDocumentoTutor varchar(30) NOT NULL,
        parentesco varchar(20) NOT NULL,
        telefonoTutor varchar(20) NOT NULL,
        estado enum('ACTIVA', 'REVOCADA') NOT NULL,
        aprobadaPorId varchar(36) NOT NULL,
        fechaAprobacion datetime(3) NOT NULL,
        soporte mediumblob NOT NULL,
        soporteTipoMime varchar(50) NOT NULL,
        soporteTamanoBytes int unsigned NOT NULL,
        revocadaPorId varchar(36) NULL,
        fechaRevocacion datetime(3) NULL,
        motivoRevocacion varchar(255) NULL,
        beneficiarioActivoId varchar(36) GENERATED ALWAYS AS (IF(estado = 'ACTIVA', beneficiarioId, NULL)) STORED,
        UNIQUE KEY uq_tutor_activa (beneficiarioActivoId),
        INDEX ix_tutor_ficha_estado (beneficiarioId, estado)
      ) ENGINE=InnoDB
    `);
    if (
      !(await runner.hasColumn(
        'consentimientos_beneficiarios',
        'autorizacionTutorId',
      ))
    ) {
      await runner.query(
        'ALTER TABLE consentimientos_beneficiarios ADD COLUMN autorizacionTutorId varchar(36) NULL',
      );
    }
  }

  async down(runner: QueryRunner): Promise<void> {
    // El esquema previo trataría un permiso del tutor como una autorización del adulto.
    const autorizaciones: unknown[] = await runner.query(
      'SELECT 1 FROM autorizaciones_tutor LIMIT 1',
    );
    if (autorizaciones.length > 0) {
      throw new Error(
        'El esquema anterior no conserva la evidencia de autorizaciones del tutor',
      );
    }
    await runner.query(
      'ALTER TABLE consentimientos_beneficiarios DROP COLUMN autorizacionTutorId',
    );
    await runner.query('DROP TABLE autorizaciones_tutor');
  }
}
