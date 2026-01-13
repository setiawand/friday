import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OnEvent } from '@nestjs/event-emitter';
import { Automation } from '../entities/automation.entity';
import { ItemsService } from '../items/items.service';

@Injectable()
export class AutomationsService implements OnModuleInit {
  private readonly logger = new Logger(AutomationsService.name);

  constructor(
    @InjectRepository(Automation)
    private automationRepo: Repository<Automation>,
    private readonly itemsService: ItemsService
  ) {}

  async onModuleInit() {
    // Optional: Seed default automations if none exist
    const count = await this.automationRepo.count();
    if (count === 0) {
        this.logger.log('No automations found. Skipping default seeding to avoid board_id conflicts.');
    }
  }

  async createAutomation(data: Partial<Automation>) {
    const automation = this.automationRepo.create({
      ...data,
      is_active: true,
    });
    return this.automationRepo.save(automation);
  }
  
  async getAutomationsByBoard(boardId: string) {
      return this.automationRepo.find({ where: { board_id: boardId } });
  }

  @OnEvent('item.created')
  async handleItemCreated(payload: any) {
    this.logger.log(`Item created: ${payload.id}`);
    await this.processAutomations('item_created', payload);
  }

  @OnEvent('column_value.updated')
  async handleColumnValueUpdated(payload: any) {
    this.logger.log(`Column value updated: ${payload.item_id}, col: ${payload.column_id}, val: ${payload.value}`);
    await this.processAutomations('column_value_changed', payload);
  }

  private async processAutomations(trigger: string, payload: any) {
    // In a real app, we should filter by board_id efficiently
    const boardId = payload.board_id;
    if (!boardId) return;

    const relevantAutomations = await this.automationRepo.find({
      where: { 
        trigger, 
        is_active: true,
        board_id: boardId 
      }
    });

    for (const automation of relevantAutomations) {
      if (this.checkConditions(automation, payload)) {
        await this.executeAction(automation, payload);
      }
    }
  }

  private checkConditions(automation: Automation, payload: any): boolean {
    if (automation.trigger === 'column_value_changed') {
      if (automation.conditions.column_id && automation.conditions.column_id !== payload.column_id) {
        return false;
      }
      // Strict equality for now. Could be regex, contains, etc.
      if (automation.conditions.value !== undefined && automation.conditions.value !== payload.value) {
        return false;
      }
    }
    return true;
  }

  private async executeAction(automation: Automation, payload: any) {
    this.logger.log(`Executing action ${automation.action} for automation ${automation.id}`);
    
    switch (automation.action) {
      case 'archive_item':
        const itemId = payload.item_id || payload.id;
        this.logger.log(`Archiving item ${itemId}`);
        await this.itemsService.archiveItem(itemId);
        break;
      case 'create_item':
          // Example: Create an item in another group
          break;
      default:
          this.logger.warn(`Unknown action: ${automation.action}`);
    }
  }
}
