import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Item } from '../entities/item.entity';
import { ColumnValue } from '../entities/column-value.entity';

@Injectable()
export class ItemsService {
  constructor(
    @InjectRepository(Item)
    private itemRepo: Repository<Item>,
    @InjectRepository(ColumnValue)
    private columnValueRepo: Repository<ColumnValue>,
    private eventEmitter: EventEmitter2
  ) {}

  async getItemsByBoard(boardId: string) {
    return this.itemRepo.find({
      where: { board_id: boardId },
      relations: ['column_values'],
      order: { position: 'ASC' },
    });
  }

  async createItem(data: Partial<Item>) {
    // Calculate position
    const count = await this.itemRepo.count({ where: { group_id: data.group_id } });
    
    const newItem = this.itemRepo.create({
      ...data,
      position: count,
      created_at: new Date(),
      updated_at: new Date(),
    });
    
    await this.itemRepo.save(newItem);
    
    this.eventEmitter.emit('item.created', newItem);
    
    return newItem;
  }

  async updateColumnValue(itemId: string, columnId: string, value: any) {
    let cv = await this.columnValueRepo.findOne({
      where: { item_id: itemId, column_id: columnId },
      relations: ['item'],
    });

    let isNew = false;
    
    if (cv) {
      cv.value = value;
      // cv.updated_at is auto-updated by @UpdateDateColumn
    } else {
      isNew = true;
      cv = this.columnValueRepo.create({
        item_id: itemId,
        column_id: columnId,
        value,
      });
      // We need to fetch the item to get the board_id for the event
      cv.item = await this.itemRepo.findOne({ where: { id: itemId } });
    }

    await this.columnValueRepo.save(cv);

    this.eventEmitter.emit('column_value.updated', {
      board_id: cv.item?.board_id,
      item_id: itemId,
      column_id: columnId,
      value,
      is_new: isNew
    });

    return cv;
  }

  async archiveItem(itemId: string) {
    const item = await this.itemRepo.findOne({ where: { id: itemId } });
    if (item) {
      item.archived_at = new Date();
      await this.itemRepo.save(item);
      this.eventEmitter.emit('item.archived', item);
    }
    return item;
  }

  async deleteItem(itemId: string) {
    const item = await this.itemRepo.findOne({ where: { id: itemId } });
    if (!item) {
       // Optional: throw new NotFoundException('Item not found');
       return { success: false }; 
    }
    
    // We might need the board_id for the event before we delete it
    const boardId = item.board_id;
    const deletedId = item.id;

    await this.itemRepo.remove(item);
    
    this.eventEmitter.emit('item.deleted', {
      id: deletedId,
      board_id: boardId
    });
    
    return { success: true };
  }
}
