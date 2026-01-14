import { Controller, Get, Post, Param, Body } from '@nestjs/common';
import { TimeLogsService } from './time-logs.service';

@Controller('items/:itemId/time-logs')
export class TimeLogsController {
  constructor(private readonly service: TimeLogsService) {}

  @Get()
  getTimeLogs(@Param('itemId') itemId: string) {
    return this.service.getTimeLogs(itemId);
  }

  @Post('start')
  startTimer(
    @Param('itemId') itemId: string,
    @Body('user_id') userId: string,
  ) {
    return this.service.startTimer(itemId, userId);
  }

  @Post('stop')
  stopTimer(
    @Param('itemId') itemId: string,
    @Body('user_id') userId: string,
  ) {
    return this.service.stopTimer(itemId, userId);
  }
}

