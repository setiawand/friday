
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity()
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string; // In real app, this should be hashed

  @Column()
  name: string;

  @Column({ default: '#6366f1' }) // Default indigo color
  color: string;

  @Column({ default: false })
  is_admin: boolean;

  @CreateDateColumn()
  created_at: Date;
}
