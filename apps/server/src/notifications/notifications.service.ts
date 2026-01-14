import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification, NotificationType } from '../entities/notification.entity';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { UsersService } from '../users/users.service';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private notificationRepo: Repository<Notification>,
    private eventEmitter: EventEmitter2,
    private usersService: UsersService,
  ) {}

  @OnEvent('update.created')
  async handleUpdateCreated(payload: any) {
    const { content, user_id, item_id } = payload || {};
    if (!content) return;

    const mentionMatches = content.match(/@([A-Za-z0-9_-]+)/g) || [];
    if (mentionMatches.length === 0) return;

    const tokens = Array.from(
      new Set(mentionMatches.map((m: string) => m.slice(1).toLowerCase())),
    );

    const allUsers = await this.usersService.findAll();
    const mentionedUsers = allUsers.filter((user) => {
      const nameToken = user.name?.split(' ')[0]?.toLowerCase();
      const emailLocal = user.email?.split('@')[0]?.toLowerCase();
      return (
        (nameToken && tokens.includes(nameToken)) ||
        (emailLocal && tokens.includes(emailLocal))
      );
    });

    for (const user of mentionedUsers) {
      if (user.id === user_id) continue;

      await this.createNotification({
        user_id: user.id,
        actor_id: user_id,
        type: NotificationType.MENTION,
        message: 'mentioned you in an update',
        entity_type: 'item',
        entity_id: item_id,
      });
    }
  }

  async getNotifications(userId: string) {
    return this.notificationRepo.find({
      where: { user_id: userId },
      order: { created_at: 'DESC' },
      take: 50,
      relations: ['actor'],
    });
  }

  async getUnreadCount(userId: string) {
    return this.notificationRepo.count({
      where: { user_id: userId, is_read: false },
    });
  }

  async createNotification(data: Partial<Notification>) {
    const notification = this.notificationRepo.create(data);
    const saved = await this.notificationRepo.save(notification);
    
    this.eventEmitter.emit('notification.created', saved);
    return saved;
  }

  async markAsRead(id: string) {
    await this.notificationRepo.update(id, { is_read: true });
    return this.notificationRepo.findOne({ where: { id } });
  }

  async markAllAsRead(userId: string) {
    await this.notificationRepo.update({ user_id: userId, is_read: false }, { is_read: true });
    return { success: true };
  }
}
