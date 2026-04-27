import { Injectable, UnauthorizedException, ConflictException, InternalServerErrorException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private prisma: PrismaService
  ) {}

  async register(data: any) {
    try {
      const existing = await this.usersService.findByEmail(data.email);
      if (existing) throw new ConflictException('Este correo electrónico ya está en uso. Por favor ingresa otro o inicia sesión.');

      const user = await this.usersService.createUser(data);
      const payload = { sub: user.id, email: user.email, role: user.role };
      return {
        access_token: await this.jwtService.signAsync(payload),
        user: { id: user.id, email: user.email, name: user.name, role: user.role }
      };
    } catch (error: any) {
      if (error.status) throw error;
      console.error(error);
      throw new InternalServerErrorException('Error del servidor: No se pudo completar el registro.');
    }
  }

  async login(data: any) {
    try {
      const user = await this.usersService.findByEmail(data.email);
      if (!user) throw new UnauthorizedException('El correo ingresado no se encuentra registrado.');

      const isMatch = await bcrypt.compare(data.password, user.password);
      if (!isMatch) throw new UnauthorizedException('La contraseña ingresada es incorrecta.');

      const payload = { sub: user.id, email: user.email, role: user.role };
      return {
        access_token: await this.jwtService.signAsync(payload),
        user: { id: user.id, email: user.email, name: user.name, role: user.role }
      };
    } catch (error: any) {
      if (error.status) throw error;
      console.error("Login Server Error:", error.message);
      throw new InternalServerErrorException('Error interno del servidor: ' + (error.message || 'Desconocido'));
    }
  }

  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        permissions: { include: { permission: true } }
      }
    });

    if (!user) throw new UnauthorizedException('User not found');

    // Fetch Role specific permissions
    const rolePermissions = await this.prisma.rolePermission.findMany({
      where: { role: user.role as any },
      include: { permission: true }
    });

    const effectivePermissions = new Map<string, any>();

    // 1. Apply Role defaults
    for (const rp of rolePermissions) {
      effectivePermissions.set(rp.permissionId, {
        module: rp.permission.module,
        action: rp.permission.action,
        allowed: true
      });
    }

    // 2. Apply User Overrides (Grant or Revoke)
    for (const up of user.permissions) {
      effectivePermissions.set(up.permissionId, {
        module: up.permission.module,
        action: up.permission.action,
        allowed: up.allowed
      });
    }

    // Convert map to array and filter out revoked
    const allowedActions = Array.from(effectivePermissions.values())
      .filter(p => p.allowed)
      .map(p => ({ module: p.module, action: p.action }));

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      permissions: allowedActions
    };
  }
}
