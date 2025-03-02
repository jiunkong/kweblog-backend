import { Module } from '@nestjs/common';
import { PostController } from './post.controller';
import { PostService } from './post.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from 'src/database/UserEntity';
import { PostEntity } from 'src/database/PostEntity';
import { SessionEntity } from 'src/database/SessionEntity';
import { LikeEntity } from 'src/database/LIkedEntity';
import { CommentEntity } from 'src/database/CommentEntity';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserEntity, PostEntity, SessionEntity, LikeEntity, CommentEntity])
  ],
  controllers: [PostController],
  providers: [PostService]
})
export class PostModule {}
