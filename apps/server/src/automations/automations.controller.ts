import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { AutomationsService } from './automations.service';
import { Automation } from '../entities/automation.entity';

@Controller('boards/:boardId/automations')
export class AutomationsController {
  constructor(private readonly automationsService: AutomationsService) {}

  @Get()
  getAutomations(@Param('boardId') boardId: string) {
    return this.automationsService.getAutomationsByBoard(boardId);
  }

  @Post()
  createAutomation(
    @Param('boardId') boardId: string,
    @Body() data: Partial<Automation>
  ) {
    return this.automationsService.createAutomation({
      ...data,
      board_id: boardId,
    });
  }
}
