import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  Index,
} from 'typeorm';
import { NivelRegistroEnum } from '../enums/nivel-registro.enum.js';

@Entity('beneficiarios')
export class Beneficiario {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: NivelRegistroEnum,
    default: NivelRegistroEnum.BASICO,
  })
  nivelRegistro: NivelRegistroEnum;

  @Column({ length: 20, nullable: true })
  tipoDocumento?: string; // CC, TI, RC, PPT

  @Column({ length: 50, unique: true, nullable: true })
  numeroDocumento?: string;

  @Index()
  @Column({ length: 100 })
  nombres: string;

  @Index()
  @Column({ length: 100 })
  apellidos: string;

  @Column({ type: 'date' })
  fechaNacimiento: string;

  @Column({ default: false })
  esMenorEdad: boolean;

  @Column({ length: 100, nullable: true })
  barrio?: string;

  @Column({ length: 20, nullable: true })
  telefono?: string;

  @Column({ length: 50, nullable: true })
  clasificacionSocioeconomica?: string; // Sisbén IV (A1-D21) o RUI

  @Column({ default: false })
  autorizaTratamientoDatos: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date;
}
