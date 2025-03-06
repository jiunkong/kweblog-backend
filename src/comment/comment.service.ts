import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CommentEntity } from 'src/database/CommentEntity';
import { NotificationEntity } from 'src/database/NotificationEntity';
import { PostEntity } from 'src/database/PostEntity';
import { UserService } from 'src/user/user.service';
import { Repository } from 'typeorm';

@Injectable()
export class CommentService {
    constructor(
        private userService: UserService,
        @InjectRepository(CommentEntity)
        private commentRepository: Repository<CommentEntity>,
        @InjectRepository(PostEntity)
        private postRepository: Repository<PostEntity>,
        @InjectRepository(NotificationEntity)
        private notificationRepository: Repository<NotificationEntity>
    ) {}

    async getCommentCount(postId: number): Promise<number> {
        const post = await this.postRepository.findOne({
            where: {
                postId: postId
            },
            relations: {
                comments: true
            }
        })

        if (!post) throw new BadRequestException("존재하지 않는 게시글입니다")

        return post.comments.length
    }

    async getComments(postId: number): Promise<CommentEntity[]> {
        const post = await this.postRepository.createQueryBuilder("post")
            .leftJoinAndSelect("post.comments", "comment")
            .leftJoinAndSelect("comment.author", "author")
            .orderBy("comment.createdDate", "DESC")
            .where("post.postId = :postId", { postId })
            .getOne()

        if (!post) throw new BadRequestException("존재하지 않는 게시물물입니다")

        return post.comments
    }

    async writeComment(sessionId: string, postId: number, content: string): Promise<CommentEntity> {
        const user = await this.userService.getUserBySessionId(sessionId)
        const post = await this.postRepository.findOne({
            where: {
                postId: postId
            },
            relations: {
                author: true
            }
        })

        if (!user) throw new BadRequestException("존재하지 않는 유저입니다")
        if (!post) throw new BadRequestException("존재하지 않는 게시글입니다")

        if (post.author.uid !== user.uid) {
            const newNotification = this.notificationRepository.create({
                type: 'comment',
                sender: user,
                receiver: post.author,
                postId: post.postId
            })
            this.notificationRepository.save(newNotification)
        }
        
        const newComment = this.commentRepository.create({
            content: content,
            author: user,
            post: post
        })
        return await this.commentRepository.save(newComment)
    }
}
