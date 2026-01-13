import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToMany } from 'typeorm';
import { Board } from './board.entity';

@Entity()
export class Workspace {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column()
  owner_id: string;

  @CreateDateColumn()
  created_at: Date;

  @Column({ default: true })
  is_active: boolean;

  @OneToMany(() => Board, (board) => board.workspace)
  boards: Board[];

  constructor(partial: Partial<Workspace>) {
    Object.assign(this, partial);
  }
}
