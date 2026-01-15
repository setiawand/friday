import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { Workspace } from './workspace.entity';
import { Group } from './group.entity';
import { Item } from './item.entity';
import { Column as BoardColumn } from './column.entity';
import { BoardMember } from './board-member.entity';

@Entity()
export class Board {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  workspace_id: string;

  @ManyToOne(() => Workspace, (workspace) => workspace.boards)
  @JoinColumn({ name: 'workspace_id' })
  workspace: Workspace;

  @Column()
  name: string;

  @Column({ nullable: true })
  description: string;

  @Column()
  created_by: string;

  @CreateDateColumn()
  created_at: Date;

  @Column({ nullable: true })
  archived_at: Date;

  @OneToMany(() => Group, (group) => group.board)
  groups: Group[];

  @OneToMany(() => Item, (item) => item.board)
  items: Item[];

  @OneToMany(() => BoardColumn, (column) => column.board)
  columns: BoardColumn[];

  @OneToMany(() => BoardMember, (member) => member.board)
  members: BoardMember[];

  constructor(partial: Partial<Board>) {
    Object.assign(this, partial);
  }
}
