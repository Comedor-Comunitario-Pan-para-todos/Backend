import {
    Column,
    CreateDateColumn,
    Entity,
    ManyToOne,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from 'typeorm';
import { Rol } from './rol.entity.js';

@Entity('usuarios')
export class Usuario {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ unique: true })
    email: string;

    @Column({ select: false }) // 'select: false' evita que la contraseña viaje por accidente en las consultas
    password: string;

    @Column()
    nombreCompleto: string;

    @Column({ default: true })
    activo: boolean;

    @ManyToOne(() => Rol, { eager: true })
    rol: Rol;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}