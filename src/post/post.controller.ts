import { BadRequestException, Body, Controller, Get, Param, Patch, Post, Query, Req, Res, UploadedFiles, UseInterceptors } from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import * as fs from "fs"
import { v4 as uuidv4 } from 'uuid'
import { PostService } from './post.service';
import { Request, Response } from 'express';
import { getSessionId } from 'src/util';

const MAX_IMAGE_SIZE = 20 * 1024 * 1024
const MAX_IMAGE_COUNT = 10

interface PostDTO {
    title: string,
    content: string
}

@Controller('post')
export class PostController {
    constructor(private postService: PostService) {}

    @Post('write')
    @UseInterceptors(FilesInterceptor('images', MAX_IMAGE_COUNT, {
        storage: diskStorage({
            destination: 'public/post',
            filename: (req, file, callback) => {
                const ext = file.mimetype.split('/').at(-1)
                callback(null, uuidv4() + '.' + ext)
            }
        }),
        limits: {
            fileSize: MAX_IMAGE_SIZE
        }
    }))
    async write(
        @Body() body: PostDTO,
        @Req() req: Request,
        @UploadedFiles() images: Express.Multer.File[]
    ) {
        const sessionId = getSessionId(req)
        if (!(body.title && body.content)) throw new BadRequestException("제목 또는 내용이 없습니다")
        let fileNames: string[] = []
        if (images) {
            images.forEach((image) => {
                fileNames.push(image.filename)
            })
        }
        const post = await this.postService.create(sessionId, body.title, body.content, fileNames)
        return post.postId
    }

    @Get('/userPosts')
    async userPosts(
        @Query('username') username: string,
        @Query('page') page: number
    ) {
        const posts = await this.postService.getPostList(page, username)
        const result: any[] = []
        posts.forEach((post) => {
            result.push({
                postId: post.postId,
                title: post.title,
                image: post.images.length > 0,
                createdDate: post.createdDate,
                likes: post.likes.length,
                comments: post.comments.length,
                author: post.author.username
            })
        })
        return result
    }

    @Get('/count')
    async getCount() {
        return await this.postService.getCount()
    }

    @Get('/:id')
    async getPost(
        @Param('id') id: number
    ) {
        const post = await this.postService.getPost(id)
        if (!post) throw new BadRequestException("존재하지 않는 게시물입니다")
        return {
            title: post.title,
            content: post.content,
            author: post.author.username,
            imageCount: post.images.length,
            createdDate: post.createdDate,
            likes: post.likes.length
        }
    }

    @Get('/:id/isLiking')
    async isLiking(
        @Req() req: Request,
        @Param('id') id: number
    ) {
        const sessionId = getSessionId(req)
        return await this.postService.isLiking(id, sessionId)
    }

    @Patch('/:id/toggleLike')
    async toggleLike(
        @Req() req: Request,
        @Param('id') id: number
    ) {
        const sessionId = getSessionId(req)
        this.postService.toggleLike(id, sessionId)
    }

    @Get('/:id/:image')
    async getPostImage(
        @Param('id') id: number,
        @Param('image') image: number,
        @Res() res: Response
    ) {
        const post = await this.postService.getPost(id)
        if (!post || post.images.length <= image) throw new BadRequestException("존재하지 않는 이미지입니다")

        const buffer = fs.readFileSync(`public/post/${post.images[image]}`)
        res.type(`image/${post.images[image].split('.').at(-1)}`)
        res.send(buffer)
    }
}
