import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity()
export class Automation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  board_id: string;

  @Column()
  trigger: string;

  @Column({ type: 'jsonb', default: {} })
  conditions: Record<string, any>;

  @Column()
  action: string;

  @Column({ type: 'jsonb', default: {} })
  action_params: Record<string, any>;

  @Column({ default: true })
  is_active: boolean;

  @CreateDateColumn()
  created_at: Date;

  constructor(partial: Partial<Automation>) {
    Object.assign(this, partial);
  }
}
