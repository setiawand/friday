import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OnEvent } from '@nestjs/event-emitter';
import { ActivityLog } from '../entities/activity-log.entity';

@Injectable()
export class ActivityLogsService {
  private readonly logger = new Logger(ActivityLogsService.name);

  constructor(
    @InjectRepository(ActivityLog)
    private logRepo: Repository<ActivityLog>,
  ) {}

  async getLogs(boardId: string, limit: number = 50) {
    return this.logRepo.find({
      where: { board_id: boardId },
      order: { created_at: 'DESC' },
      take: limit,
    });
  }

  async getItemLogs(itemId: string, limit: number = 50) {
    return this.logRepo.find({
      where: { item_id: itemId },
      order: { created_at: 'DESC' },
      take: limit,
    });
  }

  @OnEvent('item.created')
  async handleItemCreated(item: any) {
    await this.createLog({
      board_id: item.board_id,
      item_id: item.id,
      user_id: item.created_by || 'system',
      action: 'create_item',
      entity_type: 'item',
      entity_id: item.id,
      details: { name: 'Item' }
    });
  }

  @OnEvent('column_value.updated')
  async handleValueUpdated(payload: any) {
    await this.createLog({
      board_id: payload.board_id,
      item_id: payload.item_id,
      user_id: payload.user_id || 'system',
      action: 'update_value',
      entity_type: 'item',
      entity_id: payload.item_id,
      details: {
        column_id: payload.column_id,
        value: payload.value,
        previous_value: payload.previous_value,
        is_new: payload.is_new
      }
    });
  }

  @OnEvent('item.archived')
  async handleItemArchived(item: any) {
    await this.createLog({
      board_id: item.board_id,
      item_id: item.id,
      user_id: item.user_id || 'system',
      action: 'archive_item',
      entity_type: 'item',
      entity_id: item.id,
      details: {}
    });
  }

  @OnEvent('item.deleted')
  async handleItemDeleted(payload: any) {
     await this.createLog({
      board_id: payload.board_id,
      item_id: payload.id,
      user_id: payload.user_id || 'system',
      action: 'delete_item',
      entity_type: 'item',
      entity_id: payload.id,
      details: {}
    });
  }

  @OnEvent('item.updated')
  async handleItemUpdated(payload: any) {
    if (!payload.changes) {
      return;
    }

    if (payload.changes.description) {
      await this.createLog({
        board_id: payload.board_id,
        item_id: payload.id,
        user_id: payload.user_id || 'system',
        action: 'update_description',
        entity_type: 'item',
        entity_id: payload.id,
        details: {
          field: 'description',
          previous: payload.changes.description.previous,
          current: payload.changes.description.current,
        },
      });
    }

    if (payload.changes.task_type) {
      await this.createLog({
        board_id: payload.board_id,
        item_id: payload.id,
        user_id: payload.user_id || 'system',
        action: 'update_task_type',
        entity_type: 'item',
        entity_id: payload.id,
        details: {
          field: 'task_type',
          previous: payload.changes.task_type.previous,
          current: payload.changes.task_type.current,
        },
      });
    }
  }

  private async createLog(data: Partial<ActivityLog>) {
    try {
      const log = this.logRepo.create(data);
      await this.logRepo.save(log);
    } catch (e) {
      this.logger.error('Failed to create activity log', e);
    }
  }
}
