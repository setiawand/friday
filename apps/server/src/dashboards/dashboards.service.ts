import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Column as BoardColumn, ColumnType } from '../entities/column.entity';
import { ColumnValue } from '../entities/column-value.entity';
import { Board } from '../entities/board.entity';

@Injectable()
export class DashboardsService {
  constructor(
    @InjectRepository(BoardColumn)
    private columnRepo: Repository<BoardColumn>,
    @InjectRepository(ColumnValue)
    private columnValueRepo: Repository<ColumnValue>,
    @InjectRepository(Board)
    private boardRepo: Repository<Board>,
  ) {}

  async getStats() {
    // 1. Get all status columns
    const statusColumns = await this.columnRepo.find({
      where: { type: ColumnType.STATUS }
    });

    if (statusColumns.length === 0) {
      return { 
        statusCounts: {}, 
        totalItems: 0,
        totalBoards: await this.boardRepo.count()
      };
    }

    const columnIds = statusColumns.map(c => c.id);

    // 2. Get all values for these columns
    // We only care about values that are not null/undefined
    const values = await this.columnValueRepo.find({
      where: { column_id: In(columnIds) }
    });

    // 3. Aggregate
    const statusCounts: Record<string, number> = {};
    let totalItems = 0;

    values.forEach(v => {
      // The value is stored as JSONB. For status columns, it's a string.
      // But sometimes it might be null or empty string.
      const val = v.value;
      
      if (val && typeof val === 'string') {
        statusCounts[val] = (statusCounts[val] || 0) + 1;
        totalItems++;
      }
    });

    // 4. Also get total boards count
    const totalBoards = await this.boardRepo.count();

    return {
      statusCounts,
      totalItems,
      totalBoards
    };
  }
}
