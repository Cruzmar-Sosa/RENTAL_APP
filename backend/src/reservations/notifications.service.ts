import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export enum NotificationType {
  BOOKING_CONFIRMED = 'BOOKING_CONFIRMED',
  PAYMENT_SETTLED = 'PAYMENT_SETTLED',
  CHECK_IN_READY = 'CHECK_IN_READY',
  CHECK_IN_SUCCESSFUL = 'CHECK_IN_SUCCESSFUL',
  RIDE_STARTED = 'RIDE_STARTED',
  RIDE_COMPLETED = 'RIDE_COMPLETED',
  DAMAGE_REPORT = 'DAMAGE_REPORT',
  REFUND_ISSUED = 'REFUND_ISSUED',
  PAYMENT_DECLINED = 'PAYMENT_DECLINED',
  SYSTEM_ALERT = 'SYSTEM_ALERT',
}

@Injectable()
export class NotificationsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Dispatch a notification to a user
   * Creates DB record and returns notification
   */
  async dispatch(
    userId: string,
    type: NotificationType | string,
    title: string,
    message: string,
    metadata?: any,
  ) {
    return this.prisma.notification.create({
      data: {
        userId,
        type,
        title,
        message,
        read: false,
        metadata: metadata || null,
      },
    });
  }

  /**
   * Get notifications for a user with optional filters
   */
  async getNotifications(
    userId: string,
    limit: number = 20,
    offset: number = 0,
    unreadOnly: boolean = false,
  ) {
    const where = unreadOnly ? { userId, read: false } : { userId };

    const [notifications, total] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        take: limit,
        skip: offset,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.notification.count({ where }),
    ]);

    return {
      notifications,
      total,
      limit,
      offset,
      hasMore: offset + limit < total,
    };
  }

  /**
   * Mark single notification as read
   */
  async markRead(notificationId: string, userId: string) {
    const notification = await this.prisma.notification.findUnique({
      where: { id: notificationId },
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    if (notification.userId !== userId) {
      throw new Error('Not authorized to update this notification');
    }

    return this.prisma.notification.update({
      where: { id: notificationId },
      data: {
        read: true,
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Mark all notifications as read for a user
   */
  async markAllRead(userId: string) {
    return this.prisma.notification.updateMany({
      where: { userId, read: false },
      data: {
        read: true,
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Get unread notification count for a user
   */
  async getUnreadCount(userId: string): Promise<number> {
    return this.prisma.notification.count({
      where: { userId, read: false },
    });
  }

  /**
   * Delete old notifications (older than specified days)
   */
  async clearOld(daysBefore: number = 30): Promise<{ deletedCount: number }> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysBefore);

    const result = await this.prisma.notification.deleteMany({
      where: {
        createdAt: { lt: cutoffDate },
      },
    });

    return { deletedCount: result.count };
  }

  /**
   * Delete single notification
   */
  async delete(notificationId: string, userId: string) {
    const notification = await this.prisma.notification.findUnique({
      where: { id: notificationId },
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    if (notification.userId !== userId) {
      throw new Error('Not authorized to delete this notification');
    }

    return this.prisma.notification.delete({
      where: { id: notificationId },
    });
  }

  /**
   * Delete all notifications for a user
   */
  async deleteAll(userId: string) {
    return this.prisma.notification.deleteMany({
      where: { userId },
    });
  }
}
