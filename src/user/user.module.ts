import { forwardRef, Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from 'src/database/UserEntity';
import { SessionEntity } from 'src/database/SessionEntity';
import { NotificationEntity } from 'src/database/NotificationEntity';
import { ConfigModule } from '@nestjs/config';
import { SaveEntity } from 'src/database/SaveEntity';
import { PostModule } from 'src/post/post.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserEntity, SessionEntity, NotificationEntity, SaveEntity]),
    ConfigModule,
    forwardRef(() => PostModule)
  ],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService]
})
export class UserModule {}
