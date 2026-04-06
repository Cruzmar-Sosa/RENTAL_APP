import { Injectable } from '@nestjs/common';
import { PrismaService } from '../core/database/prisma.service';
import * as bcrypt from 'bcrypt';
import { Prisma } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async createUser(data: Prisma.UserCreateInput) {
    const hashedPassword = await bcrypt.hash(data.password, 10);
    return this.prisma.user.create({
      data: {
        ...data,
        password: hashedPassword,
      },
    });
  }

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  async findAll() {
    return this.prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        permissions: { include: { permission: true } },
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async findOne(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        permissions: { include: { permission: true } },
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async update(id: string, data: any) {
    const updateData = { ...data };
    if (updateData.password) {
      updateData.password = await bcrypt.hash(updateData.password, 10);
    }
    return this.prisma.user.update({
      where: { id },
      data: updateData,
    });
  }

  async remove(id: string) {
    return this.prisma.user.delete({
      where: { id },
    });
  }

  async updatePermissions(userId: string, permissions: Array<{ module: string, action: string, allowed: boolean }>) {
    return this.prisma.$transaction(async (tx) => {
      // Clear all existing overrides
      await tx.userPermission.deleteMany({ where: { userId } });

      if (permissions && permissions.length > 0) {
        // Fetch valid permission IDs to insert overrides
        const validPerms = await tx.permission.findMany({
          where: {
            OR: permissions.map(p => ({ module: p.module, action: p.action }))
          }
        });

        const inserts = permissions.map(p => {
          const matched = validPerms.find(v => v.module === p.module && v.action === p.action);
          if (!matched) return null;
          return { userId, permissionId: matched.id, allowed: p.allowed };
        }).filter(Boolean);

        if (inserts.length > 0) {
          await tx.userPermission.createMany({ data: inserts as any });
        }
      }
      return tx.user.findUnique({
        where: { id: userId },
        include: { permissions: { include: { permission: true } } }
      });
    });
  }
}
