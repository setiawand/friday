import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Team } from '../entities/team.entity';
import { TeamMember } from '../entities/team-member.entity';
import { UsersService } from '../users/users.service';

@Injectable()
export class TeamsService {
  constructor(
    @InjectRepository(Team)
    private teamRepo: Repository<Team>,
    @InjectRepository(TeamMember)
    private memberRepo: Repository<TeamMember>,
    private usersService: UsersService,
  ) {}

  async createTeam(workspaceId: string, name: string) {
    const team = this.teamRepo.create({ workspace_id: workspaceId, name });
    return this.teamRepo.save(team);
  }

  async getTeamsForWorkspace(workspaceId: string) {
    return this.teamRepo.find({
      where: { workspace_id: workspaceId },
    });
  }

  async addMember(teamId: string, userId: string, role: string = 'member') {
    const team = await this.teamRepo.findOne({ where: { id: teamId } });
    if (!team) {
      throw new NotFoundException('Team not found');
    }
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    const existing = await this.memberRepo.findOne({
      where: { team_id: teamId, user_id: userId },
    });
    if (existing) {
      existing.role = role;
      return this.memberRepo.save(existing);
    }
    const member = this.memberRepo.create({ team_id: teamId, user_id: userId, role });
    return this.memberRepo.save(member);
  }

  async getMembers(teamId: string) {
    return this.memberRepo.find({
      where: { team_id: teamId },
      relations: ['user'],
    });
  }

  async removeMember(memberId: string) {
    const existing = await this.memberRepo.findOne({ where: { id: memberId } });
    if (!existing) {
      throw new NotFoundException('Team member not found');
    }
    await this.memberRepo.remove(existing);
    return { success: true };
  }

  async deleteTeam(teamId: string) {
    const team = await this.teamRepo.findOne({ where: { id: teamId } });
    if (!team) {
      throw new NotFoundException('Team not found');
    }
    await this.memberRepo.delete({ team_id: teamId });
    await this.teamRepo.delete(teamId);
    return { success: true };
  }
}
