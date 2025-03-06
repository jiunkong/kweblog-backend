import { Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from 'src/database/UserEntity';
import { SessionEntity } from 'src/database/SessionEntity';
import { NotificationEntity } from 'src/database/NotificationEntity';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserEntity, SessionEntity, NotificationEntity]),
    ConfigModule
  ],
  controllers: [UserController],
  providers: [UserService]
})
export class UserModule {}
