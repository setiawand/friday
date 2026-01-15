import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { Team } from './team.entity';
import { User } from './user.entity';

@Entity()
export class TeamMember {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  team_id: string;

  @Column()
  user_id: string;

  @Column({ default: 'member' })
  role: string;

  @ManyToOne(() => Team, (team) => team.members)
  team: Team;

  @ManyToOne(() => User)
  user: User;
}

