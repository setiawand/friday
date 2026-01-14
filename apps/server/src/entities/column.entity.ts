import { Entity, PrimaryGeneratedColumn, Column as DbColumn, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Board } from './board.entity';

export enum ColumnType {
  TEXT = 'text',
  STATUS = 'status',
  DATE = 'date',
  PERSON = 'person',
  NUMBERS = 'numbers',
  FILES = 'files',
}

@Entity()
export class Column {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @DbColumn()
  board_id: string;

  @ManyToOne(() => Board, (board) => board.columns)
  @JoinColumn({ name: 'board_id' })
  board: Board;

  @DbColumn({ type: 'enum', enum: ColumnType })
  type: ColumnType;

  @DbColumn()
  title: string;

  @DbColumn({ type: 'jsonb', default: {} })
  settings: Record<string, any>;

  @DbColumn()
  position: number;

  @CreateDateColumn()
  created_at: Date;

  constructor(partial: Partial<Column>) {
    Object.assign(this, partial);
  }
}
