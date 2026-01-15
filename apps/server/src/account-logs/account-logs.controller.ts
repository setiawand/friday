import { Controller, Get, Query } from '@nestjs/common';
import { AccountLogsService } from './account-logs.service';

@Controller('admin/audit-logs')
export class AccountLogsController {
  constructor(private readonly service: AccountLogsService) {}

  @Get()
  getLogs(@Query('limit') limit?: number) {
    const parsedLimit = limit ? Number(limit) : 100;
    return this.service.getLogs(parsedLimit);
  }
}

