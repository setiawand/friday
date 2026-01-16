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

  @Patch(':id')
  updateItem(
    @Param('id') id: string,
    @Body() body: { description?: string; task_type?: string | null; user_id?: string },
  ) {
    const data: any = {};
    if (body.description !== undefined) {
      data.description = body.description;
    }
    if (body.task_type !== undefined) {
      data.task_type = body.task_type;
    }
    return this.itemsService.updateItem(
      id,
      data,
      body.user_id,
    );
  }

  @Patch(':id/values')
  updateColumnValue(
    @Param('id') itemId: string,
    @Body() body: { column_id: string; value: any; user_id?: string },
  ) {
    return this.itemsService.updateColumnValue(itemId, body.column_id, body.value, body.user_id);
  }

  @Delete(':id')
  deleteItem(
    @Param('id') itemId: string,
    @Body() body: { user_id?: string },
  ) {
    return this.itemsService.deleteItem(itemId, body?.user_id);
  }

  @Get(':id/subitems')
  getSubitems(@Param('id') itemId: string) {
    return this.itemsService.getSubitems(itemId);
  }

  @Get(':id/dependencies')
  getDependencies(@Param('id') itemId: string) {
    return this.itemsService.getDependencies(itemId);
  }

  @Post(':id/dependencies')
  addDependency(
    @Param('id') itemId: string,
    @Body() body: { target_item_id: string; type?: string },
  ) {
    return this.itemsService.addDependency(itemId, body.target_item_id, body.type);
  }

  @Delete(':id/dependencies/:depId')
  removeDependency(@Param('depId') depId: string) {
    return this.itemsService.removeDependency(depId);
  }
}
