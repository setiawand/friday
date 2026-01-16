import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Column as BoardColumn, ColumnType } from '../entities/column.entity';
import { ColumnValue } from '../entities/column-value.entity';
import { Board } from '../entities/board.entity';
import { Item } from '../entities/item.entity';

@Injectable()
export class DashboardsService {
  constructor(
    @InjectRepository(BoardColumn)
    private columnRepo: Repository<BoardColumn>,
    @InjectRepository(ColumnValue)
    private columnValueRepo: Repository<ColumnValue>,
    @InjectRepository(Board)
    private boardRepo: Repository<Board>,
    @InjectRepository(Item)
    private itemRepo: Repository<Item>,
  ) {}

  async getStats() {
    // Status distribution
    const statusColumns = await this.columnRepo.find({
      where: { type: ColumnType.STATUS },
    });

    let statusCounts: Record<string, number> = {};
    let totalItems = 0;

    if (statusColumns.length > 0) {
      const columnIds = statusColumns.map((c) => c.id);

      const values = await this.columnValueRepo.find({
        where: { column_id: In(columnIds) },
      });

      values.forEach((v) => {
        const val = v.value;

        if (val && typeof val === 'string') {
          statusCounts[val] = (statusCounts[val] || 0) + 1;
          totalItems++;
        }
      });
    }

    // Task type distribution
    const items = await this.itemRepo.find();
    const taskTypeCounts: Record<string, number> = {};
    items.forEach((item) => {
      if (item.task_type) {
        taskTypeCounts[item.task_type] = (taskTypeCounts[item.task_type] || 0) + 1;
      }
    });

    // Workload by person (assignee)
    const personColumns = await this.columnRepo.find({
      where: { type: ColumnType.PERSON },
    });
    const personWorkload: Record<string, number> = {};

    if (personColumns.length > 0) {
      const personColumnIds = personColumns.map((c) => c.id);
      const personValues = await this.columnValueRepo.find({
        where: { column_id: In(personColumnIds) },
      });

      personValues.forEach((v) => {
        const val = v.value;
        if (val && typeof val === 'string') {
          personWorkload[val] = (personWorkload[val] || 0) + 1;
        }
      });
    }

    const totalBoards = await this.boardRepo.count();

    return {
      statusCounts,
      totalItems,
      totalBoards,
      taskTypeCounts,
      personWorkload,
    };
  }
}
