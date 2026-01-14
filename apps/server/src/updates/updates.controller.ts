
import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { UpdatesService } from './updates.service';

@Controller('items/:itemId/updates')
export class UpdatesController {
  constructor(private readonly updatesService: UpdatesService) {}

  @Post()
  createUpdate(
    @Param('itemId') itemId: string,
    @Body('content') content: string,
    @Body('user_id') userId: string,
  ) {
    return this.updatesService.createUpdate(itemId, content, userId);
  }

  @Get()
  getUpdates(@Param('itemId') itemId: string) {
    return this.updatesService.getUpdates(itemId);
  }
}
