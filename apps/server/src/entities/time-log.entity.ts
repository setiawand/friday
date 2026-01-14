import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Item } from './item.entity';
import { User } from './user.entity';

@Entity()
export class TimeLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  item_id: string;

  @ManyToOne(() => Item, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'item_id' })
  item: Item;

  @Column()
  user_id: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'datetime' })
  start_time: Date;

  @Column({ type: 'datetime', nullable: true })
  end_time: Date | null;

  @Column({ type: 'integer', default: 0 })
  duration_seconds: number;

  @Column({ default: false })
  is_running: boolean;

  @CreateDateColumn()
  created_at: Date;

  constructor(partial: Partial<TimeLog>) {
    Object.assign(this, partial);
  }
}

