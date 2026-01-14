
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Update } from '../entities/update.entity';
import { Item } from '../entities/item.entity';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class UpdatesService {
  constructor(
    @InjectRepository(Update)
    private updateRepo: Repository<Update>,
    @InjectRepository(Item)
    private itemRepo: Repository<Item>,
    private eventEmitter: EventEmitter2,
  ) {}

  async createUpdate(itemId: string, content: string, userId: string) {
    const update = this.updateRepo.create({
      item_id: itemId,
      content,
      user_id: userId,
    });
    const savedUpdate = await this.updateRepo.save(update);

    this.eventEmitter.emit('update.created', {
      ...savedUpdate,
      board_id: await this.getBoardIdByItemId(itemId),
    });

    return savedUpdate;
  }

  async getUpdates(itemId: string) {
    return this.updateRepo.find({
      where: { item_id: itemId },
      relations: ['user'],
      order: { created_at: 'DESC' },
    });
  }

  private async getBoardIdByItemId(itemId: string): Promise<string | null> {
    const item = await this.itemRepo.findOne({ where: { id: itemId } });
    return item ? item.board_id : null;
  }
}
