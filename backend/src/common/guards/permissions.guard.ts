import { Injectable, CanActivate, ExecutionContext, ForbiddenException, InternalServerErrorException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../../core/database/prisma.service';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermission = this.reflector.getAllAndOverride<{ module: string, action: string }>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()]
    );

    if (!requiredPermission) {
      return true; // No permission required
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user; // Appended by JwtAuthGuard

    if (!user) {
      throw new ForbiddenException('You do not have permission to perform this action.');
    }

    // 🔑 ADMIN BYPASS: Admins always have full access — no DB check needed
    if (user.role === 'ADMIN') {
      return true;
    }

    try {
      // 1. Fetch user role permissions and user overrides
      const dbUser = await this.prisma.user.findUnique({
        where: { id: user.sub },
        include: {
          permissions: {
            include: { permission: true }
          }
        }
      });

      if (!dbUser) {
        throw new ForbiddenException('User not found in system.');
      }

      // 2. Fetch the target permission record
      const targetPermission = await this.prisma.permission.findFirst({
        where: {
          module: requiredPermission.module,
          action: requiredPermission.action
        }
      });

      if (!targetPermission) {
        console.warn(`[PermissionsGuard] Permission not found in DB: ${requiredPermission.module} - ${requiredPermission.action}`);
        throw new ForbiddenException(`Permission ${requiredPermission.action} on ${requiredPermission.module} does not exist in registry.`);
      }

      // 3. User override validation
      const userOverride = dbUser.permissions.find(p => p.permissionId === targetPermission.id);
      if (userOverride) {
        if (userOverride.allowed) return true;
        throw new ForbiddenException('Your access to this action was explicitly revoked.');
      }

      // 4. Role default validation
      const rolePermission = await this.prisma.rolePermission.findUnique({
        where: {
          role_permissionId: {
            role: dbUser.role as any,
            permissionId: targetPermission.id
          }
        }
      });

      if (rolePermission) {
        return true;
      }

      throw new ForbiddenException(`You lack the ${requiredPermission.module} - ${requiredPermission.action} permission.`);
    } catch (error) {
      if (error instanceof ForbiddenException) throw error;
      console.error('[PermissionsGuard] Unexpected error:', error);
      throw new InternalServerErrorException('Failed to validate permissions.');
    }
  }
}
