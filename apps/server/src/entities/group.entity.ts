import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { Board } from './board.entity';
import { Item } from './item.entity';

@Entity('board_group') // 'group' is a reserved keyword in some databases
export class Group {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  board_id: string;

  @ManyToOne(() => Board, (board) => board.groups)
  @JoinColumn({ name: 'board_id' })
  board: Board;

  @Column()
  name: string;

  @Column()
  position: number;

  @OneToMany(() => Item, (item) => item.group)
  items: Item[];

  constructor(partial: Partial<Group>) {
    Object.assign(this, partial);
  }
}
