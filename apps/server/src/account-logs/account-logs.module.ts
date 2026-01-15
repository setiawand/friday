import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AccountLog } from '../entities/account-log.entity';
import { AccountLogsService } from './account-logs.service';
import { AccountLogsController } from './account-logs.controller';

@Module({
  imports: [TypeOrmModule.forFeature([AccountLog])],
  providers: [AccountLogsService],
  controllers: [AccountLogsController],
  exports: [AccountLogsService],
})
export class AccountLogsModule {}

