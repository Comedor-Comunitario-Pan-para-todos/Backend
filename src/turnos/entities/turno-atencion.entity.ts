import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import { EstadoTurnoEnum } from '../enums/estado-turno.enum.js';
import { Beneficiario } from '../../beneficiarios/entities/beneficiario.entity.js';
import { Usuario } from '../../usuarios/entities/usuario.entity.js';

@Entity('turnos_atencion')
@Unique(['beneficiarioId', 'fecha']) // Restricción crítica: 1 turno por beneficiario por fecha (HU-27)
@Index(['fecha', 'numeroTurno'])
export class TurnoAtencion {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ type: 'date' })
  fecha: string; // Formato AAAA-MM-DD

  @Column({ type: 'int' })
  numeroTurno: number; // Consecutivo diario (1, 2, 3...)

  @Column({ type: 'varchar', length: 36 })
  beneficiarioId: string;

  @ManyToOne(() => Beneficiario, { eager: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'beneficiarioId' })
  beneficiario: Beneficiario;

  @Column({ type: 'varchar', length: 36 })
  emitidoPorUsuarioId: string;

  @ManyToOne(() => Usuario, { eager: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'emitidoPorUsuarioId' })
  emitidoPorUsuario: Usuario;

  @Column({ type: 'time' })
  horaLlegada: string; // Hora exacta de ingreso a la fila

  @Column({ type: 'time', nullable: true })
  horaAtencion?: string; // Hora en que pasó a recibir la ración

  @Column({
    type: 'enum',
    enum: EstadoTurnoEnum,
    default: EstadoTurnoEnum.EN_ESPERA,
  })
  estado: EstadoTurnoEnum;

  @Column({ type: 'varchar', length: 255, nullable: true })
  motivoCancelacion?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
