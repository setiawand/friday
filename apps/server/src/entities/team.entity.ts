import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany } from 'typeorm';
import { Workspace } from './workspace.entity';
import { TeamMember } from './team-member.entity';

@Entity()
export class Team {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column()
  workspace_id: string;

  @ManyToOne(() => Workspace, (workspace) => workspace.teams)
  workspace: Workspace;

  @OneToMany(() => TeamMember, (member) => member.team)
  members: TeamMember[];
}

