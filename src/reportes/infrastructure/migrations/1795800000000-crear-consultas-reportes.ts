import type { MigrationInterface, QueryRunner } from 'typeorm';

export class CrearConsultasReportes1795800000000 implements MigrationInterface {
  async up(runner: QueryRunner): Promise<void> {
    await runner.query(`
      CREATE TABLE IF NOT EXISTS consultas_reportes_gestion (
        id varchar(36) PRIMARY KEY,
        periodo varchar(7) NOT NULL,
        usuarioId varchar(36) NOT NULL,
        consultadoEn datetime(3) NOT NULL,
        INDEX ix_consultas_reportes_periodo (periodo, consultadoEn)
      ) ENGINE=InnoDB
    `);
  }

  async down(runner: QueryRunner): Promise<void> {
    const filas: unknown[] = await runner.query(
      'SELECT 1 FROM consultas_reportes_gestion LIMIT 1',
    );
    if (filas.length)
      throw new Error('La reversión descartaría la auditoría de reportes');
    await runner.query('DROP TABLE IF EXISTS consultas_reportes_gestion');
  }
}
