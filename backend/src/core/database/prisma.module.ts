import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { UsersService } from 'src/users/users.service';


@Global() // 🔥 IMPORTANTE
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
  imports: [PrismaModule], // 🔥 AGREGA ESTO
})
export class PrismaModule {}