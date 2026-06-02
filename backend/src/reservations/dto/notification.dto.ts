export class NotificationResponseDto {
  id?: string;
  userId?: string;
  type?: string;
  title?: string;
  message?: string;
  read?: boolean;
  metadata?: any;
  createdAt?: Date;
  updatedAt?: Date;
}

export class NotificationsListResponseDto {
  notifications?: NotificationResponseDto[];
  total?: number;
  limit?: number;
  offset?: number;
  hasMore?: boolean;
}

export class UnreadCountResponseDto {
  unreadCount?: number;
}
