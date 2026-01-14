import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TimeLog } from '../entities/time-log.entity';

@Injectable()
export class TimeLogsService {
  constructor(
    @InjectRepository(TimeLog)
    private timeLogRepo: Repository<TimeLog>,
  ) {}

  async getTimeLogs(itemId: string) {
    return this.timeLogRepo.find({
      where: { item_id: itemId },
      relations: ['user'],
      order: { start_time: 'DESC' },
    });
  }

  async getActiveTimeLog(itemId: string, userId: string) {
    return this.timeLogRepo.findOne({
      where: { item_id: itemId, user_id: userId, is_running: true },
    });
  }

  async startTimer(itemId: string, userId: string) {
    const existing = await this.getActiveTimeLog(itemId, userId);
    if (existing) {
      return existing;
    }

    const now = new Date();

    const log = this.timeLogRepo.create({
      item_id: itemId,
      user_id: userId,
      start_time: now,
      is_running: true,
      duration_seconds: 0,
    });

    return this.timeLogRepo.save(log);
  }

  async stopTimer(itemId: string, userId: string) {
    const log = await this.getActiveTimeLog(itemId, userId);
    if (!log) {
      throw new NotFoundException('No active timer');
    }

    const end = new Date();
    const durationSeconds = Math.max(
      0,
      Math.floor((end.getTime() - log.start_time.getTime()) / 1000),
    );

    log.end_time = end;
    log.duration_seconds = durationSeconds;
    log.is_running = false;

    return this.timeLogRepo.save(log);
  }
}

