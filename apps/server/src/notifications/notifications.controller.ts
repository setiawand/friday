import { Controller, Get, Post, Put, Body, Param, Query } from '@nestjs/common';
import { NotificationsService } from './notifications.service';

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  async getNotifications(@Query('userId') userId: string) {
    if (!userId) return [];
    return this.notificationsService.getNotifications(userId);
  }

  @Get('unread-count')
  async getUnreadCount(@Query('userId') userId: string) {
    if (!userId) return { count: 0 };
    const count = await this.notificationsService.getUnreadCount(userId);
    return { count };
  }

  @Put(':id/read')
  async markAsRead(@Param('id') id: string) {
    return this.notificationsService.markAsRead(id);
  }

  @Put('read-all')
  async markAllAsRead(@Body() body: { userId: string }) {
    return this.notificationsService.markAllAsRead(body.userId);
  }

  @Post('test')
  async createTestNotification(@Body() body: { userId: string }) {
    return this.notificationsService.createNotification({
      user_id: body.userId,
      type: 'system' as any,
      message: 'This is a test notification from the system.',
      created_at: new Date(),
    });
  }
}
