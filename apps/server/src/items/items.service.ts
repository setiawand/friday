import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Item } from '../entities/item.entity';
import { ColumnValue } from '../entities/column-value.entity';
import { ItemDependency } from '../entities/item-dependency.entity';

@Injectable()
export class ItemsService {
  constructor(
    @InjectRepository(Item)
    private itemRepo: Repository<Item>,
    @InjectRepository(ColumnValue)
    private columnValueRepo: Repository<ColumnValue>,
    @InjectRepository(ItemDependency)
    private dependencyRepo: Repository<ItemDependency>,
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

  async updateItem(itemId: string, data: Partial<Item>, userId?: string) {
    const existing = await this.itemRepo.findOne({ where: { id: itemId } });
    await this.itemRepo.update(itemId, data);
    const updatedItem = await this.itemRepo.findOne({ where: { id: itemId } });

    if (!updatedItem) {
      return null;
    }

    const changes: Record<string, any> = {};

    if (Object.prototype.hasOwnProperty.call(data, 'description')) {
      changes.description = {
        previous: existing?.description ?? null,
        current: updatedItem.description,
      };
    }

    if (Object.prototype.hasOwnProperty.call(data, 'task_type')) {
      changes.task_type = {
        previous: existing?.task_type ?? null,
        current: updatedItem.task_type,
      };
    }

    this.eventEmitter.emit('item.updated', {
      board_id: updatedItem.board_id,
      id: updatedItem.id,
      description: updatedItem.description,
      task_type: updatedItem.task_type,
      user_id: userId || updatedItem.created_by,
      changes,
    });

    return updatedItem;
  }

  async getSubitems(parentItemId: string) {
    return this.itemRepo.find({
      where: { parent_item_id: parentItemId },
      relations: ['column_values'],
      order: { created_at: 'ASC' },
    });
  }

  async getDependencies(itemId: string) {
    return this.dependencyRepo.find({
      where: [{ from_item_id: itemId }, { to_item_id: itemId }],
      order: { created_at: 'ASC' },
    });
  }

  async addDependency(fromItemId: string, toItemId: string, type: string = 'blocks') {
    const dep = this.dependencyRepo.create({
      from_item_id: fromItemId,
      to_item_id: toItemId,
      type,
    });
    return this.dependencyRepo.save(dep);
  }

  async removeDependency(depId: string) {
    await this.dependencyRepo.delete(depId);
    return { success: true };
  }

  async updateColumnValue(itemId: string, columnId: string, value: any, userId?: string) {
    let cv = await this.columnValueRepo.findOne({
      where: { item_id: itemId, column_id: columnId },
      relations: ['item'],
    });

    let isNew = false;
    let previousValue: any = null;

    if (cv) {
      previousValue = cv.value;
      cv.value = value;
    } else {
      isNew = true;
      cv = this.columnValueRepo.create({
        item_id: itemId,
        column_id: columnId,
        value,
      });
      cv.item = await this.itemRepo.findOne({ where: { id: itemId } });
    }

    await this.columnValueRepo.save(cv);

    this.eventEmitter.emit('column_value.updated', {
      board_id: cv.item?.board_id,
      item_id: itemId,
      column_id: columnId,
      value,
      previous_value: previousValue,
      is_new: isNew,
      user_id: userId || null
    });

    return cv;
  }

  async archiveItem(itemId: string, userId?: string) {
    const item = await this.itemRepo.findOne({ where: { id: itemId } });
    if (item) {
      item.archived_at = new Date();
      await this.itemRepo.save(item);
      this.eventEmitter.emit('item.archived', {
        ...item,
        user_id: userId || null
      });
    }
    return item;
  }

  async deleteItem(itemId: string, userId?: string) {
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
      board_id: boardId,
      user_id: userId || null
    });
    
    return { success: true };
  }
}
