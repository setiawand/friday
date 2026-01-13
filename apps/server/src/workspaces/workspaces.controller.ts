import { Controller, Get, Post, Body } from '@nestjs/common';
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
}
