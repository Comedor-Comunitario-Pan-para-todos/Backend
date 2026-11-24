import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { TipoExcepcionEnum } from '../enums/tipo-excepcion.enum.js';
import { TurnoAtencion } from '../../turnos/entities/turno-atencion.entity.js';
import { Usuario } from '../../usuarios/entities/usuario.entity.js';

@Entity('excepciones_entrega')
export class ExcepcionEntrega {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 36, unique: true })
  turnoId: string;

  @OneToOne(() => TurnoAtencion, { eager: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'turnoId' })
  turno: TurnoAtencion;

  @Column({ type: 'varchar', length: 36 })
  autorizadoPorUsuarioId: string;

  @ManyToOne(() => Usuario, { eager: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'autorizadoPorUsuarioId' })
  autorizadoPorUsuario: Usuario;

  @Column({
    type: 'enum',
    enum: TipoExcepcionEnum,
  })
  tipoExcepcion: TipoExcepcionEnum;

  @Column({ type: 'varchar', length: 255 })
  justificacion: string;

  @Column({ type: 'int', default: 1 })
  cantidadRaciones: number;

  @CreateDateColumn({ type: 'timestamp', name: 'fecha_hora' })
  fechaHora: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
