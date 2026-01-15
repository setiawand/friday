import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { Board } from './board.entity';
import { User } from './user.entity';

@Entity()
export class BoardMember {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  board_id: string;

  @Column()
  user_id: string;

  @Column({ default: 'editor' })
  role: string;

  @ManyToOne(() => Board, (board) => board.members)
  board: Board;

  @ManyToOne(() => User)
  user: User;
}

