import { Body, Controller, Get, Param, Patch, Post, Query, Delete } from '@nestjs/common';
import { ItemsService } from './items.service';

@Controller('items')
export class ItemsController {
  constructor(private readonly itemsService: ItemsService) {}

  @Get()
  getItems(@Query('board_id') boardId: string) {
    return this.itemsService.getItemsByBoard(boardId);
  }

  @Post()
  createItem(@Body() body: any) {
    return this.itemsService.createItem(body);
  }

  @Patch(':id/values')
  updateColumnValue(
    @Param('id') itemId: string,
    @Body() body: { column_id: string; value: any },
  ) {
    return this.itemsService.updateColumnValue(itemId, body.column_id, body.value);
  }

  @Delete(':id')
  deleteItem(@Param('id') itemId: string) {
    return this.itemsService.deleteItem(itemId);
  }
}
