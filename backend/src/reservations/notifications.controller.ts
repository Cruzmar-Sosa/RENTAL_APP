import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  UseGuards,
  Request,
  Query,
} from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { Permissions } from '../common/decorators/permissions.decorator';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  /**
   * Get all notifications for current user
   * GET /notifications?limit=20&offset=0&unreadOnly=false
   */
  @Get()
  async getNotifications(
    @Request() req: any,
    @Query('limit') limit: string = '20',
    @Query('offset') offset: string = '0',
    @Query('unreadOnly') unreadOnly: string = 'false',
  ) {
    const limitNum = Math.min(Math.max(parseInt(limit) || 20, 1), 100); // cap at 100
    const offsetNum = Math.max(parseInt(offset) || 0, 0);
    const unreadOnlyBool = unreadOnly === 'true';

    return this.notificationsService.getNotifications(
      req.user.sub,
      limitNum,
      offsetNum,
      unreadOnlyBool,
    );
  }

  /**
   * Get unread count for current user
   * GET /notifications/unread/count
   */
  @Get('unread/count')
  async getUnreadCount(@Request() req: any) {
    const count = await this.notificationsService.getUnreadCount(req.user.sub);
    return { unreadCount: count };
  }

  /**
   * Mark single notification as read
   * PUT /notifications/:id/read
   */
  @Put(':id/read')
  async markRead(@Request() req: any, @Param('id') id: string) {
    return this.notificationsService.markRead(id, req.user.sub);
  }

  /**
   * Mark all notifications as read
   * POST /notifications/mark-all-read
   */
  @Post('mark-all-read')
  async markAllRead(@Request() req: any) {
    return this.notificationsService.markAllRead(req.user.sub);
  }

  /**
   * Delete single notification
   * DELETE /notifications/:id
   */
  @Delete(':id')
  async delete(@Request() req: any, @Param('id') id: string) {
    return this.notificationsService.delete(id, req.user.sub);
  }

  /**
   * Clear old notifications (admin-only or system endpoint)
   * DELETE /notifications/clear-old?days=30
   */
  @Delete('clear/old')
  @Permissions('NOTIFICATIONS', 'DELETE')
  async clearOld(@Query('days') days: string = '30') {
    const daysNum = Math.max(parseInt(days) || 30, 1);
    return this.notificationsService.clearOld(daysNum);
  }
}
