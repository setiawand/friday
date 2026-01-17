import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { TeamsService } from './teams.service';

@Controller('workspaces/:workspaceId/teams')
export class TeamsController {
  constructor(private readonly teamsService: TeamsService) {}

  @Get()
  getTeams(@Param('workspaceId') workspaceId: string) {
    return this.teamsService.getTeamsForWorkspace(workspaceId);
  }

  @Post()
  createTeam(@Param('workspaceId') workspaceId: string, @Body() body: any) {
    return this.teamsService.createTeam(workspaceId, body.name);
  }

  @Get(':teamId/members')
  getMembers(@Param('teamId') teamId: string) {
    return this.teamsService.getMembers(teamId);
  }

  @Post(':teamId/members')
  addMember(
    @Param('teamId') teamId: string,
    @Body() body: { userId: string; role?: string },
  ) {
    return this.teamsService.addMember(teamId, body.userId, body.role);
  }

  @Delete(':teamId/members/:memberId')
  removeMember(@Param('memberId') memberId: string) {
    return this.teamsService.removeMember(memberId);
  }

  @Delete(':teamId')
  deleteTeam(@Param('teamId') teamId: string) {
    return this.teamsService.deleteTeam(teamId);
  }
}
