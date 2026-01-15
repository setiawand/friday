import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BoardsController } from './boards.controller';
import { BoardsService } from './boards.service';
import { Board } from '../entities/board.entity';
import { Column } from '../entities/column.entity';
import { Group } from '../entities/group.entity';
import { BoardMember } from '../entities/board-member.entity';
import { BoardPermissionsService } from './board-permissions.service';

@Module({
  imports: [TypeOrmModule.forFeature([Board, Column, Group, BoardMember])],
  controllers: [BoardsController],
  providers: [BoardsService, BoardPermissionsService],
  exports: [BoardsService, BoardPermissionsService],
})
export class BoardsModule {}
