import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import {
  EstadoLoteEnum,
  UnidadMedidaInsumoEnum,
} from '../../../../domain/models/lote-inventario.model.js';

@Entity('lotes_inventario')
export class LoteInventarioEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index({ unique: true })
  @Column({ length: 60 })
  codigoLote: string;

  @Index()
  @Column({ length: 150 })
  nombreInsumo: string;

  @Index()
  @Column({ length: 80 })
  categoria: string;

  @Column('decimal', { precision: 12, scale: 3 })
  cantidadInicial: number;

  @Column('decimal', { precision: 12, scale: 3 })
  cantidadActual: number;

  @Column({
    type: 'enum',
    enum: UnidadMedidaInsumoEnum,
    default: UnidadMedidaInsumoEnum.UNIDAD,
  })
  unidadMedida: UnidadMedidaInsumoEnum;

  @Index()
  @Column({ type: 'datetime' })
  fechaRecepcion: Date;

  @Index()
  @Column({ type: 'datetime' })
  fechaVencimiento: Date;

  @Index()
  @Column({
    type: 'enum',
    enum: EstadoLoteEnum,
    default: EstadoLoteEnum.DISPONIBLE,
  })
  estado: EstadoLoteEnum;

  @Index()
  @Column({ length: 100, nullable: true })
  donacionOrigenId: string | null;

  @Column({ length: 150, nullable: true })
  nombreDonante: string | null;

  @Column({ type: 'text', nullable: true })
  observaciones: string | null;

  @Column({ length: 100, nullable: true })
  registradoPorId: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
