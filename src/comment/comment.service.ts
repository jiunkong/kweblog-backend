import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CommentEntity } from 'src/database/CommentEntity';
import { PostEntity } from 'src/database/PostEntity';
import { SessionEntity } from 'src/database/SessionEntity';
import { getUserBySessionId } from 'src/util';
import { Repository } from 'typeorm';

const COMMENT_PAGE_SIZE = 5
@Injectable()
export class CommentService {
    constructor(
        @InjectRepository(CommentEntity)
        private commentRepository: Repository<CommentEntity>,
        @InjectRepository(PostEntity)
        private postRepository: Repository<PostEntity>,
        @InjectRepository(SessionEntity)
        private sessionRepository: Repository<SessionEntity>
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

    async getComments(postId: number, page: number): Promise<CommentEntity[]> {
        const post = await this.postRepository
            .createQueryBuilder("post")
            .leftJoinAndSelect("post.comments", "comment")
            .leftJoinAndSelect("comment.author", "author")
            .orderBy("comment.createdDate", "DESC")
            .take(COMMENT_PAGE_SIZE)
            .skip((page - 1) * COMMENT_PAGE_SIZE)
            .where("post.postId = :postId", { postId })
            .getOne()

        if (!post) throw new BadRequestException("존재하지 않는 게시물물입니다")

        return post.comments
    }

    async writeComment(sessionId: string, postId: number, content: string): Promise<CommentEntity>{
        const user = await getUserBySessionId(this.sessionRepository, sessionId)
        const post = await this.postRepository.findOne({
            where: {
                postId: postId
            }
        })

        if (!user) throw new BadRequestException("존재하지 않는 유저입니다")
        if (!post) throw new BadRequestException("존재하지 않는 게시글입니다")

        const newComment = this.commentRepository.create({
            content: content,
            author: user,
            post: post
        })
        return await this.commentRepository.save(newComment)
    }
}
