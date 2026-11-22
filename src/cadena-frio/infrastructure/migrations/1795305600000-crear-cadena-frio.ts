import type { MigrationInterface, QueryRunner } from 'typeorm';

export class CrearCadenaFrio1795305600000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS equipos_refrigeracion (
        id varchar(36) PRIMARY KEY,
        nombre varchar(120) NOT NULL,
        tipo enum('NEVERA', 'CONGELADOR') NOT NULL,
        activo boolean NOT NULL DEFAULT true
      ) ENGINE=InnoDB
    `);
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS incidentes_cadena_frio (
        id varchar(36) PRIMARY KEY,
        equipoId varchar(36) NOT NULL,
        temperaturaObservada double NOT NULL,
        minutosTranscurridos int NOT NULL,
        insumosAfectados json NOT NULL,
        accionCorrectiva varchar(1000) NOT NULL,
        reportadoPorId varchar(36) NOT NULL,
        registradoEn datetime(3) NOT NULL,
        CONSTRAINT fk_incidente_equipo_frio FOREIGN KEY (equipoId)
          REFERENCES equipos_refrigeracion (id)
      ) ENGINE=InnoDB
    `);
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS accesos_catalogo_frio (
        id varchar(36) PRIMARY KEY,
        usuarioId varchar(36) NOT NULL,
        consultadoEn datetime(3) NOT NULL
      ) ENGINE=InnoDB
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE IF EXISTS accesos_catalogo_frio');
    await queryRunner.query('DROP TABLE IF EXISTS incidentes_cadena_frio');
    await queryRunner.query('DROP TABLE IF EXISTS equipos_refrigeracion');
  }
}
