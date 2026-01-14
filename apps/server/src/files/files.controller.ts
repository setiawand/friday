import { Controller, Get, Post, Delete, Body, Param, Query } from '@nestjs/common';
import { FilesService } from './files.service';

@Controller('items/:itemId/files')
export class FilesController {
  constructor(private readonly service: FilesService) {}

  @Get()
  getFiles(@Param('itemId') itemId: string) {
    return this.service.getFiles(itemId);
  }

  @Post()
  createFile(@Param('itemId') itemId: string, @Body() body: any) {
    return this.service.createFile({
      item_id: itemId,
      ...body,
    });
  }

  @Delete(':fileId')
  deleteFile(@Param('fileId') fileId: string) {
    return this.service.deleteFile(fileId);
  }
}
