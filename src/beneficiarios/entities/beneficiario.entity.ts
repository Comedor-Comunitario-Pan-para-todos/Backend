import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  Index,
} from 'typeorm';

@Entity('beneficiarios')
export class Beneficiario {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 20 })
  tipoDocumento: string; // Ej: CC, TI, RC, PPT

  @Column({ length: 50, unique: true })
  numeroDocumento: string;

  @Index()
  @Column({ length: 100 })
  nombres: string;

  @Index()
  @Column({ length: 100 })
  apellidos: string;

  @Column({ type: 'date' })
  fechaNacimiento: string;

  @Column({ length: 100, nullable: true })
  barrio: string;

  @Column({ length: 20, nullable: true })
  telefono: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date;
}
