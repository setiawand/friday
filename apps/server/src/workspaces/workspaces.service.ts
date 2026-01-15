import { Injectable, OnModuleInit, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Workspace } from '../entities/workspace.entity';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class WorkspacesService implements OnModuleInit {
  constructor(
    @InjectRepository(Workspace)
    private workspaceRepo: Repository<Workspace>,
    private eventEmitter: EventEmitter2,
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
    const saved = await this.workspaceRepo.save(workspace);
    this.eventEmitter.emit('workspace.created', saved);
    return saved;
  }

  async updateWorkspace(id: string, data: Partial<Workspace>) {
    const workspace = await this.workspaceRepo.findOne({ where: { id } });
    if (!workspace) {
      throw new NotFoundException('Workspace not found');
    }
    const updated = {
      ...workspace,
      ...data,
    };
    const saved = await this.workspaceRepo.save(updated);
    this.eventEmitter.emit('workspace.updated', saved);
    return saved;
  }

  async getAllWorkspaces() {
    return this.workspaceRepo.find();
  }
}
