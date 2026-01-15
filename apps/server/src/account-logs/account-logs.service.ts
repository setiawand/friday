import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OnEvent } from '@nestjs/event-emitter';
import { AccountLog } from '../entities/account-log.entity';

@Injectable()
export class AccountLogsService {
  constructor(
    @InjectRepository(AccountLog)
    private accountLogRepo: Repository<AccountLog>,
  ) {}

  async getLogs(limit: number = 100) {
    return this.accountLogRepo.find({
      order: { created_at: 'DESC' },
      take: limit,
    });
  }

  async createLog(data: Partial<AccountLog>) {
    const log = this.accountLogRepo.create(data);
    return this.accountLogRepo.save(log);
  }

  @OnEvent('workspace.created')
  async handleWorkspaceCreated(workspace: any) {
    await this.createLog({
      user_id: workspace.owner_id || null,
      action: 'workspace_created',
      entity_type: 'workspace',
      entity_id: workspace.id,
      details: { name: workspace.name },
    });
  }

  @OnEvent('workspace.updated')
  async handleWorkspaceUpdated(workspace: any) {
    await this.createLog({
      user_id: workspace.owner_id || null,
      action: 'workspace_updated',
      entity_type: 'workspace',
      entity_id: workspace.id,
      details: { name: workspace.name, is_active: workspace.is_active },
    });
  }

  @OnEvent('board.created')
  async handleBoardCreated(board: any) {
    await this.createLog({
      user_id: board.created_by || null,
      action: 'board_created',
      entity_type: 'board',
      entity_id: board.id,
      details: { name: board.name, workspace_id: board.workspace_id },
    });
  }

  @OnEvent('user.registered')
  async handleUserRegistered(user: any) {
    await this.createLog({
      user_id: user.id,
      action: 'user_registered',
      entity_type: 'user',
      entity_id: user.id,
      details: { email: user.email },
    });
  }

  @OnEvent('user.logged_in')
  async handleUserLoggedIn(user: any) {
    await this.createLog({
      user_id: user.id,
      action: 'user_logged_in',
      entity_type: 'user',
      entity_id: user.id,
      details: { email: user.email },
    });
  }
}
