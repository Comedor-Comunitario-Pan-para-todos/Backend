import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { RolEnum } from '../enums/rol.enum.js';

@Entity('roles')
export class Rol {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'enum', enum: RolEnum, unique: true })
    nombre: RolEnum;

    @Column({ nullable: true })
    descripcion: string;
}