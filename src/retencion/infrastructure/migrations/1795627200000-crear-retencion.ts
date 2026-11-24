import type { MigrationInterface, QueryRunner } from 'typeorm';

export class CrearRetencion1795627200000 implements MigrationInterface {
  async up(runner: QueryRunner): Promise<void> {
    await runner.query(`
      CREATE TABLE IF NOT EXISTS politica_retencion (
        id tinyint PRIMARY KEY CHECK (id = 1),
        diasBasicos int NULL CHECK (diasBasicos BETWEEN 1 AND 36500),
        diasSensibles int NULL CHECK (diasSensibles BETWEEN 1 AND 36500),
        actualizadaPorId varchar(36) NULL,
        actualizadaEn datetime(3) NULL
      ) ENGINE=InnoDB
    `);
    await runner.query('INSERT IGNORE INTO politica_retencion (id) VALUES (1)');
    await runner.query(`
      CREATE TABLE IF NOT EXISTS bitacora_retencion (
        id varchar(36) PRIMARY KEY,
        evento enum('CONSULTA', 'CAMBIO_POLITICA', 'VERIFICACION') NOT NULL,
        operadorId varchar(36) NULL,
        registradoEn datetime(3) NOT NULL,
        anterior text NULL,
        vigente text NULL,
        basicosPendientes int NULL,
        sensiblesPendientes int NULL,
        INDEX ix_retencion_historial (evento, registradoEn)
      ) ENGINE=InnoDB
    `);
    await runner.query(`
      CREATE TABLE IF NOT EXISTS retencion_pendiente_verificacion (
        beneficiarioId varchar(36) PRIMARY KEY,
        datosBasicos boolean NOT NULL,
        datosSensibles boolean NOT NULL,
        verificadoEn datetime(3) NOT NULL
      ) ENGINE=InnoDB
    `);
  }

  async down(runner: QueryRunner): Promise<void> {
    const eventos: unknown[] = await runner.query(
      'SELECT 1 FROM bitacora_retencion LIMIT 1',
    );
    if (eventos.length)
      throw new Error('La reversión eliminaría la bitácora de retención');
    await runner.query('DROP TABLE IF EXISTS retencion_pendiente_verificacion');
    await runner.query('DROP TABLE IF EXISTS bitacora_retencion');
    await runner.query('DROP TABLE IF EXISTS politica_retencion');
  }
}
