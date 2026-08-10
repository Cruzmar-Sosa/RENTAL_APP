import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Get,
  UseGuards,
  Request,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  private extractIp(req: any): string {
    return (
      req.headers?.['x-forwarded-for']?.toString().split(',')[0].trim() ||
      req.headers?.['x-real-ip'] ||
      req.connection?.remoteAddress ||
      req.socket?.remoteAddress ||
      req.ip ||
      '127.0.0.1'
    );
  }

  @Throttle({ auth: { limit: 5, ttl: 60000 } })
  @Post('register')
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  register(@Body() body: RegisterDto, @Request() req: any) {
    const clientIp = this.extractIp(req);
    return this.authService.register(body, clientIp);
  }

  @Throttle({ auth: { limit: 5, ttl: 60000 } })
  @HttpCode(HttpStatus.OK)
  @Post('login')
  login(@Body() body: LoginDto, @Request() req: any) {
    const clientIp = this.extractIp(req);
    return this.authService.login(body, clientIp);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  getMe(@Request() req: any) {
    return this.authService.getMe(req.user.sub);
  }
}
