import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async createUser(data: CreateUserDto) {
    try {
      const hashedPassword = await bcrypt.hash(data.password, 10);
      return this.prisma.user.create({
        data: {
          email: data.email,
          password: hashedPassword,
          name: data.name,
          phone: data.phone ?? null,
          role: (data.role as any) ?? 'USER',
        },
        select: {
          id: true,
          code: true,
          email: true,
          name: true,
          phone: true,
          role: true,
          createdAt: true,
        }
      });
    } catch (error) {
      console.error('[UsersService.createUser]', error);
      throw new InternalServerErrorException('Failed to create user');
    }
  }

  async findByEmail(email: string) {
    try {
      return this.prisma.user.findUnique({ where: { email } });
    } catch (error) {
      console.error('[UsersService.findByEmail]', error);
      throw new InternalServerErrorException('Failed to find user by email');
    }
  }

  async findAll() {
    try {
      return this.prisma.user.findMany({
        where: { deletedAt: null },
        select: {
          id: true,
          code: true,
          email: true,
          name: true,
          phone: true,
          role: true,
          permissions: { include: { permission: true } },
          createdAt: true,
          updatedAt: true,
        },
        orderBy: { createdAt: 'desc' }
      });
    } catch (error) {
      console.error('[UsersService.findAll]', error);
      throw new InternalServerErrorException('Failed to fetch users');
    }
  }

  async findOne(id: string) {
    try {
      return this.prisma.user.findUnique({
        where: { id },
        select: {
          id: true,
          code: true,
          email: true,
          name: true,
          phone: true,
          role: true,
          permissions: { include: { permission: true } },
          createdAt: true,
          updatedAt: true,
        },
      });
    } catch (error) {
      console.error('[UsersService.findOne]', error);
      throw new InternalServerErrorException('Failed to fetch user');
    }
  }

  async update(id: string, data: UpdateUserDto) {
    try {
      const updateData: any = { ...data };
      if (updateData.password) {
        updateData.password = await bcrypt.hash(updateData.password, 10);
      } else {
        delete updateData.password; // Don't overwrite with empty string
      }
      return this.prisma.user.update({
        where: { id },
        data: updateData,
        select: {
          id: true,
          email: true,
          name: true,
          phone: true,
          role: true,
          updatedAt: true,
        }
      });
    } catch (error) {
      console.error('[UsersService.update]', error);
      throw new InternalServerErrorException('Failed to update user');
    }
  }

  async remove(id: string) {
    try {
      // Soft delete
      return this.prisma.user.update({
        where: { id },
        data: { deletedAt: new Date() }
      });
    } catch (error) {
      console.error('[UsersService.remove]', error);
      throw new InternalServerErrorException('Failed to delete user');
    }
  }

  async updatePermissions(userId: string, permissions: Array<{ module: string, action: string, allowed: boolean }>) {
    try {
      return this.prisma.$transaction(async (tx) => {
        await tx.userPermission.deleteMany({ where: { userId } });

        if (permissions && permissions.length > 0) {
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
    } catch (error) {
      console.error('[UsersService.updatePermissions]', error);
      throw new InternalServerErrorException('Failed to update permissions');
    }
  }
}
