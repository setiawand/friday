import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { Board } from './board.entity';
import { Group } from './group.entity';
import { ColumnValue } from './column-value.entity';

@Entity()
export class Item {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  board_id: string;

  @ManyToOne(() => Board, (board) => board.items)
  @JoinColumn({ name: 'board_id' })
  board: Board;

  @Column()
  group_id: string;

  @ManyToOne(() => Group, (group) => group.items)
  @JoinColumn({ name: 'group_id' })
  group: Group;

  @Column()
  position: number;

  @Column()
  created_by: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ nullable: true })
  task_type: string | null;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @Column({ nullable: true })
  archived_at: Date;

  @OneToMany(() => ColumnValue, (columnValue) => columnValue.item, { cascade: true })
  column_values: ColumnValue[];

  @Column({ nullable: true })
  parent_item_id: string | null;

  @ManyToOne(() => Item, (item) => item.subitems)
  @JoinColumn({ name: 'parent_item_id' })
  parent: Item;

  @OneToMany(() => Item, (item) => item.parent)
  subitems: Item[];

  constructor(partial: Partial<Item>) {
    Object.assign(this, partial);
  }
}
