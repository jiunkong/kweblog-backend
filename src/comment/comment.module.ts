import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommentController } from './comment.controller';
import { CommentService } from './comment.service';
import { CommentEntity } from 'src/database/CommentEntity';
import { PostEntity } from 'src/database/PostEntity';
import { SessionEntity } from 'src/database/SessionEntity';
import { NotificationEntity } from 'src/database/NotificationEntity';

@Module({
    imports: [
        TypeOrmModule.forFeature([CommentEntity, PostEntity, SessionEntity, NotificationEntity])
    ],
    controllers: [CommentController],
    providers: [CommentService]
})
export class CommentModule {}
