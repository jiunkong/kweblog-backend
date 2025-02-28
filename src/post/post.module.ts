import { Module } from '@nestjs/common';
import { PostController } from './post.controller';
import { PostService } from './post.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from 'src/database/UserEntity';
import { PostEntity } from 'src/database/PostEntity';
import { SessionEntity } from 'src/database/SessionEntity';
import { CommentEntity } from 'src/database/CommentEntity';
import { LikeEntity } from 'src/database/LIkedEntity';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserEntity, PostEntity, SessionEntity, CommentEntity, LikeEntity])
  ],
  controllers: [PostController],
  providers: [PostService]
})
export class PostModule {}
