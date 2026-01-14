import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DashboardsController } from './dashboards.controller';
import { DashboardsService } from './dashboards.service';
import { Column } from '../entities/column.entity';
import { ColumnValue } from '../entities/column-value.entity';
import { Board } from '../entities/board.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Column, ColumnValue, Board]),
  ],
  controllers: [DashboardsController],
  providers: [DashboardsService],
})
export class DashboardsModule {}
