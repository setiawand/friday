import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Workspace } from '../entities/workspace.entity';

@Injectable()
export class WorkspacesService implements OnModuleInit {
  constructor(
    @InjectRepository(Workspace)
    private workspaceRepo: Repository<Workspace>,
  ) {}

  async onModuleInit() {
    const count = await this.workspaceRepo.count();
    if (count === 0) {
      await this.createWorkspace({
        name: 'Default Workspace',
        owner_id: 'system',
        is_active: true,
      });
      console.log('Seeded default workspace');
    }
  }

  async createWorkspace(data: Partial<Workspace>) {
    const workspace = this.workspaceRepo.create({
      ...data,
      created_at: new Date(),
    });
    return this.workspaceRepo.save(workspace);
  }

  async getAllWorkspaces() {
    return this.workspaceRepo.find();
  }
}
