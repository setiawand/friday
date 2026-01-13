import { Body, Controller, Get, Param, Post, Delete, Put } from '@nestjs/common';
import { BoardsService } from './boards.service';

@Controller('boards')
export class BoardsController {
  constructor(private readonly boardsService: BoardsService) {}

  @Get()
  getAllBoards() {
    return this.boardsService.getAllBoards();
  }

  @Get(':id')
  getBoard(@Param('id') id: string) {
    return this.boardsService.getBoardById(id);
  }

  @Post()
  createBoard(@Body() body: any) {
    return this.boardsService.createBoard(body);
  }

  @Post(':id/columns')
  createColumn(@Param('id') id: string, @Body() body: any) {
    return this.boardsService.createColumn(id, body);
  }

  @Delete(':id/columns/:columnId')
  deleteColumn(@Param('id') boardId: string, @Param('columnId') columnId: string) {
    return this.boardsService.deleteColumn(boardId, columnId);
  }

  @Put(':id/columns/reorder')
  reorderColumns(@Param('id') boardId: string, @Body() body: { columnIds: string[] }) {
    return this.boardsService.reorderColumns(boardId, body.columnIds);
  }

  @Post(':id/groups')
  createGroup(@Param('id') id: string, @Body() body: any) {
    return this.boardsService.createGroup(id, body);
  }

  @Put(':id/groups/:groupId')
  updateGroup(@Param('id') boardId: string, @Param('groupId') groupId: string, @Body() body: any) {
    return this.boardsService.updateGroup(boardId, groupId, body);
  }

  @Delete(':id/groups/:groupId')
  deleteGroup(@Param('id') boardId: string, @Param('groupId') groupId: string) {
    return this.boardsService.deleteGroup(boardId, groupId);
  }
}
