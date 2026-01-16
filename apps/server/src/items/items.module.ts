import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ItemsController } from './items.controller';
import { ItemsService } from './items.service';
import { Item } from '../entities/item.entity';
import { ColumnValue } from '../entities/column-value.entity';
import { ItemDependency } from '../entities/item-dependency.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Item, ColumnValue, ItemDependency])],
  controllers: [ItemsController],
  providers: [ItemsService],
  exports: [ItemsService],
})
export class ItemsModule {}
