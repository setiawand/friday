import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { BoardsModule } from './boards/boards.module';
import { ItemsModule } from './items/items.module';
import { AutomationsModule } from './automations/automations.module';
import { WorkspacesModule } from './workspaces/workspaces.module';
import { EventsModule } from './events/events.module';
import { Board } from './entities/board.entity';
import { Column } from './entities/column.entity';
import { Group } from './entities/group.entity';
import { Item } from './entities/item.entity';
import { ColumnValue } from './entities/column-value.entity';
import { Workspace } from './entities/workspace.entity';
import { Automation } from './entities/automation.entity';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'localhost',
      port: 5432,
      username: 'friday_user',
      password: 'friday_password',
      database: 'friday_db',
      entities: [Board, Column, Group, Item, ColumnValue, Workspace, Automation],
      synchronize: true, // Auto-create tables (dev only)
    }),
    EventEmitterModule.forRoot(),
    BoardsModule,
    ItemsModule,
    AutomationsModule,
    WorkspacesModule,
    EventsModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
