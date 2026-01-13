import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AutomationsService } from './automations.service';
import { AutomationsController } from './automations.controller';
import { ItemsModule } from '../items/items.module';
import { Automation } from '../entities/automation.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Automation]),
    ItemsModule
  ],
  controllers: [AutomationsController],
  providers: [AutomationsService],
  exports: [AutomationsService],
})
export class AutomationsModule {}
