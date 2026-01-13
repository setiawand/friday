import { Entity, PrimaryGeneratedColumn, Column, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Item } from './item.entity';
import { Column as BoardColumn } from './column.entity';

@Entity()
export class ColumnValue {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  item_id: string;

  @ManyToOne(() => Item, (item) => item.column_values, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'item_id' })
  item: Item;

  @Column()
  column_id: string;

  @ManyToOne(() => BoardColumn, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'column_id' })
  column: BoardColumn;

  @Column({ type: 'jsonb', nullable: true })
  value: any;

  @UpdateDateColumn()
  updated_at: Date;

  constructor(partial: Partial<ColumnValue>) {
    Object.assign(this, partial);
  }
}
