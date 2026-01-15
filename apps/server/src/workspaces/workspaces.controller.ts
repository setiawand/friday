import { Body, Controller, Get, Post, Put, Param } from '@nestjs/common';
import { WorkspacesService } from './workspaces.service';
import { Workspace } from '../entities/workspace.entity';

@Controller('workspaces')
export class WorkspacesController {
  constructor(private readonly workspacesService: WorkspacesService) {}

  @Get()
  getAllWorkspaces() {
    return this.workspacesService.getAllWorkspaces();
  }

  @Post()
  createWorkspace(@Body() data: Partial<Workspace>) {
    return this.workspacesService.createWorkspace(data);
  }

  @Put(':id')
  updateWorkspace(@Param('id') id: string, @Body() data: Partial<Workspace>) {
    return this.workspacesService.updateWorkspace(id, data);
  }
}
