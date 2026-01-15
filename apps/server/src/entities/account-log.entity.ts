import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity()
export class AccountLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  user_id: string | null;

  @Column()
  action: string;

  @Column()
  entity_type: string;

  @Column({ nullable: true })
  entity_id: string | null;

  @Column({ type: 'simple-json', nullable: true })
  details: any;

  @CreateDateColumn()
  created_at: Date;
}

