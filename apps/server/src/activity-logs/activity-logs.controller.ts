import { Controller, Get, Param, Query } from '@nestjs/common';
import { ActivityLogsService } from './activity-logs.service';

@Controller('boards/:boardId/activity-logs')
export class ActivityLogsController {
  constructor(private readonly service: ActivityLogsService) {}

  @Get()
  getLogs(@Param('boardId') boardId: string, @Query('limit') limit: number) {
    return this.service.getLogs(boardId, limit);
  }

  @Get('items/:itemId')
  getItemLogs(@Param('itemId') itemId: string, @Query('limit') limit: number) {
    return this.service.getItemLogs(itemId, limit);
  }
}
