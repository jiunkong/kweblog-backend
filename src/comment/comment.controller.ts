import { BadRequestException, Body, Controller, Get, Param, Post, Req } from '@nestjs/common';
import { CommentService } from './comment.service';
import { Request } from 'express';
import { getSessionId } from 'src/util';

const COMMENT_PAGE_SIZE = 5
@Controller('comment')
export class CommentController {
    constructor(private commentService: CommentService) {}

    @Get('/:id')
    async getCommentCount(
        @Param('id') postId: number
    ) {
        return await this.commentService.getCommentCount(postId)
    }

    @Post('/:id/write')
    async writeComment(
        @Param('id') postId: number,
        @Body('content') content: string,
        @Req() req: Request
    ) {
        if (!content) throw new BadRequestException("내용이 없습니다")
        const sessionId = getSessionId(req)
        this.commentService.writeComment(sessionId, postId, content)
    }

    @Get('/:id/:page')
    async getComments(
        @Param('id') postId: number,
        @Param('page') page: number
    ) {
        const comments = await this.commentService.getComments(postId, page)
        return comments.map((comment) => {
            return {
                id: comment.id,
                createdDate: comment.createdDate,
                content: comment.content,
                author: comment.author.username
            }
        })
    }
}