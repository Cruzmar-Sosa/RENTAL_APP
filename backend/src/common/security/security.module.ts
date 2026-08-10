import { Module, Global } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule, seconds } from '@nestjs/throttler';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { InMemoryLockoutStorage } from './storage/in-memory-lockout.storage';
import { LOCKOUT_STORAGE_TOKEN, LoginProtectionService } from './login-protection.service';
import { RegistrationAbuseService } from './registration-abuse.service';
import { SecurityAuditService } from './security-audit.service';
import { AppThrottlerGuard } from '../guards/app-throttler.guard';
import { TimeoutInterceptor } from '../interceptors/timeout.interceptor';
import { PaginationPipe } from '../pipes/pagination.pipe';

@Global()
@Module({
  imports: [
    ConfigModule,
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => [
        {
          name: 'default',
          ttl: seconds(Math.floor((config.get<number>('THROTTLE_TTL', 60000)) / 1000)),
          limit: config.get<number>('THROTTLE_LIMIT_DEFAULT', 100),
        },
        {
          name: 'auth',
          ttl: seconds(Math.floor((config.get<number>('THROTTLE_TTL', 60000)) / 1000)),
          limit: config.get<number>('THROTTLE_LIMIT_AUTH', 5),
        },
        {
          name: 'payments',
          ttl: seconds(Math.floor((config.get<number>('THROTTLE_TTL', 60000)) / 1000)),
          limit: config.get<number>('THROTTLE_LIMIT_PAYMENTS', 10),
        },
        {
          name: 'reservations',
          ttl: seconds(Math.floor((config.get<number>('THROTTLE_TTL', 60000)) / 1000)),
          limit: config.get<number>('THROTTLE_LIMIT_RESERVATIONS', 15),
        },
        {
          name: 'uploads',
          ttl: seconds(Math.floor((config.get<number>('THROTTLE_TTL', 60000)) / 1000)),
          limit: config.get<number>('THROTTLE_LIMIT_UPLOADS', 10),
        },
      ],
    }),
  ],
  providers: [
    SecurityAuditService,
    {
      provide: LOCKOUT_STORAGE_TOKEN,
      useClass: InMemoryLockoutStorage, // Easily swappable to RedisLockoutStorage in future
    },
    LoginProtectionService,
    RegistrationAbuseService,
    PaginationPipe,
    {
      provide: APP_GUARD,
      useClass: AppThrottlerGuard,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: TimeoutInterceptor,
    },
  ],
  exports: [
    SecurityAuditService,
    LoginProtectionService,
    RegistrationAbuseService,
    PaginationPipe,
    ThrottlerModule,
  ],
})
export class SecurityModule {}
