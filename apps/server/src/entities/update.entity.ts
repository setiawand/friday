
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Item } from './item.entity';
import { User } from './user.entity';

@Entity()
export class Update {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('text')
  content: string;

  @Column()
  item_id: string;

  @Column({ nullable: true })
  user_id: string; // "creator"

  @CreateDateColumn()
  created_at: Date;

  @ManyToOne(() => Item, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'item_id' })
  item: Item;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;
}
