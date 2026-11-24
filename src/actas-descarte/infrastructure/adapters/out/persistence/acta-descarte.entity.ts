import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { EstadoActaEnum, TipoDonanteEnum } from '../../../../dto/crear-acta-descarte.dto.js';

@Entity('actas_descarte')
export class ActaDescarte {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index({ unique: true })
  @Column({ length: 50 })
  numeroActa: string;

  @Index()
  @Column({ length: 100 })
  donacionOrigenId: string;

  @Index()
  @Column({ length: 150 })
  insumo: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  cantidad: number;

  @Column({ length: 20 })
  unidadMedida: string;

  @Column({ type: 'enum', enum: TipoDonanteEnum })
  tipoDonante: TipoDonanteEnum;

  @Column({ type: 'text' })
  motivo: string;

  @Column({ type: 'enum', enum: EstadoActaEnum, default: EstadoActaEnum.PENDIENTE })
  estado: EstadoActaEnum;

  @Column({ type: 'json', nullable: true })
  evidencias: { id: string; url: string; mimeType: string; descripcion?: string }[];

  @Index()
  @Column({ length: 36 })
  generadaPorId: string;

  @Index()
  @Column({ length: 36, nullable: true })
  autorizadaPorId?: string;

  @Column({ type: 'datetime', nullable: true })
  fechaAutorizacion?: Date;

  @Column({ type: 'text', nullable: true })
  observaciones?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
