import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { BoardsModule } from './boards/boards.module';
import { ItemsModule } from './items/items.module';
import { AutomationsModule } from './automations/automations.module';
import { WorkspacesModule } from './workspaces/workspaces.module';
import { EventsModule } from './events/events.module';
import { ActivityLogsModule } from './activity-logs/activity-logs.module';
import { UpdatesModule } from './updates/updates.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { FilesModule } from './files/files.module';
import { DashboardsModule } from './dashboards/dashboards.module';
import { NotificationsModule } from './notifications/notifications.module';
import { Board } from './entities/board.entity';
import { Column } from './entities/column.entity';
import { Group } from './entities/group.entity';
import { Item } from './entities/item.entity';
import { ColumnValue } from './entities/column-value.entity';
import { Workspace } from './entities/workspace.entity';
import { Automation } from './entities/automation.entity';
import { ActivityLog } from './entities/activity-log.entity';
import { Update } from './entities/update.entity';
import { User } from './entities/user.entity';
import { File } from './entities/file.entity';
import { Notification } from './entities/notification.entity';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'localhost',
      port: 5432,
      username: 'friday_user',
      password: 'friday_password',
      database: 'friday_db',
      entities: [Board, Column, Group, Item, ColumnValue, Workspace, Automation, ActivityLog, Update, User, File, Notification],
      synchronize: true, // Auto-create tables (dev only)
    }),
    EventEmitterModule.forRoot(),
    BoardsModule,
    ItemsModule,
    AutomationsModule,
    WorkspacesModule,
    EventsModule,
    ActivityLogsModule,
    UpdatesModule,
    UsersModule,
    AuthModule,
    FilesModule,
    DashboardsModule,
    NotificationsModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
