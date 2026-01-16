import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn } from 'typeorm';
import { Item } from './item.entity';

@Entity()
export class ItemDependency {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  from_item_id: string;

  @Column()
  to_item_id: string;

  @Column({ default: 'blocks' })
  type: string;

  @CreateDateColumn()
  created_at: Date;

  @ManyToOne(() => Item)
  from_item: Item;

  @ManyToOne(() => Item)
  to_item: Item;
}

