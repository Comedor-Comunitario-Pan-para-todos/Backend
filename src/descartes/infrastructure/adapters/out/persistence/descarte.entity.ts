import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('descartes')
export class Descarte {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ length: 150 })
  alimento: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  cantidad: number;

  @Column({ length: 20 })
  unidadMedida: string;

  @Column({ type: 'text' })
  motivo: string;

  @Index()
  @Column({ type: 'datetime' })
  fecha: Date;

  @Column({ length: 150 })
  evaluadoPor: string;

  @Index()
  @Column({ length: 36 })
  autorizadoPorId: string;

  @Index()
  @Column({ length: 100, nullable: true })
  loteId?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
