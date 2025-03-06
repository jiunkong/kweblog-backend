import { Controller, Post, UseInterceptors, UploadedFile, Body, BadRequestException, Get, Query, InternalServerErrorException, Res, Req, Patch } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { v4 as uuidv4 } from 'uuid'
import { UserService } from './user.service';
import { Request, Response } from 'express';
import * as fs from "fs"

interface SignupDTO {
    id: string,
    username: string,
    password: string,
    introduction: string
}

const MAX_IMAGE_SIZE = 10 * 1024 * 1024

@Controller('user')
export class UserController {
    constructor(private userService: UserService) {}

    getSessionId(req: Request): string {
        const sessionId = req.cookies.sessionId
        if (!sessionId) throw new BadRequestException("세션이 필요합니다")
        return sessionId
    }

    @Get('/existedId')
    async existedId(@Query('id') id: string) {
        if (!id) throw new BadRequestException()
        return await this.userService.isExistedId(id)
    }

    @Get('/existedUsername')
    async existedUsername(@Query('username') username: string) {
        if (!username) throw new BadRequestException()
        return await this.userService.isExistedUsername(username)
    }

    @Get('/profileImage')
    async profileImage(
        @Query("username") username: string,
        @Res() res: Response
    ) {
        const fname = await this.userService.getImage(username)
        if (!fname) throw new BadRequestException("잘못된 아이디입니다")
        const buffer = fs.readFileSync(`public/profile/${fname}`)
        res.type(`image/${fname.split('.').at(-1)}`)
        res.send(buffer)
    }

    @Get('/introduction')
    async introduction(
        @Query('username') username: string
    ) {
        const result = await this.userService.findOneByUsername(username)
        if (!result) throw new BadRequestException("존재하지 않는 사용자입니다")
        return result.introduction
    }

    @Get('/notification')
    async getNotificaiton(
        @Req() req: Request
    ) {
        const sessionId = this.getSessionId(req)
        const notifications = await this.userService.getNotifications(sessionId)
        return notifications.map((notification) => {
            return {
                id: notification.id,
                type: notification.type,
                sender: notification.sender.username,
                postId: notification.postId,
                accepted: notification.accepted
            }
        })
    }

    @Get('/signout')
    async signout(
        @Req() req: Request
    ) {
        const sessionId = this.getSessionId(req)
        const res = await this.userService.signout(sessionId)
        if (!res.affected || res.affected == 0) throw new BadRequestException("잘못된 세션입니다")
    }

    @Get('/signin')
    async signin(
        @Query('id') id: string,
        @Query('pw') pw: string,
        @Res() response: Response
    ) {
        const res = await this.userService.signin(id, pw)
        if (!res) throw new BadRequestException("잘못된 아이디 또는 비밀번호입니다")

        response.cookie("sessionId", res.session.sessionId, {
            httpOnly: true,
            sameSite: "strict",
            secure: true
        })

        return response.send(res.username)
    }

    @Patch('/updateProfile')
    @UseInterceptors(FileInterceptor('image', {
        storage: diskStorage({
            destination: 'public/profile',
            filename: (req, file, callback) => {
                const ext = file.mimetype.split('/').at(-1)
                callback(null, uuidv4() + '.' + ext)
            }
        }),
        limits: {
            fileSize: MAX_IMAGE_SIZE
        }
    }))
    async updateProfile(
        @Body() body: {introduction: string},
        @UploadedFile() image: Express.Multer.File,
        @Req() req: Request
    ) {
        let ret: boolean = true

        if (body.introduction) {
            const sessionId = this.getSessionId(req)
            const user = await this.userService.getUserBySession(sessionId)
            const result = await this.userService.updateIntroduction(user.uid, req.body.introduction)
            if (!(result.affected && result.affected > 0)) ret = false
        }

        if (image) {
            const sessionId = this.getSessionId(req)
            const user = await this.userService.getUserBySession(sessionId)
            if (user.image) await fs.rmSync("public/profile/" + user.image)
            
            const result = await this.userService.updateImage(user.uid, image.filename)
            if (!(result.affected && result.affected > 0)) ret = false
        }
        
        return ret
    }

    @Post('/signup')
    @UseInterceptors(FileInterceptor('image', {
        storage: diskStorage({
            destination: 'public/profile',
            filename: (req, file, callback) => {
                const ext = file.mimetype.split('/').at(-1)
                callback(null, uuidv4() + '.' + ext)
            }
        }),
        limits: {
            fileSize: MAX_IMAGE_SIZE
        }
    }))
    async signup(
        @Body() profile: SignupDTO,
        @UploadedFile() image: Express.Multer.File,
        @Res() res: Response
    ) {
        async function removeImage() {
            await fs.rmSync("public/profile/" + image.filename)
        }

        if (await this.userService.isExistedId(profile.id)) {
            await removeImage()
            throw new BadRequestException("이미 존재하는 아이디입니다")
        }
        if (await this.userService.isExistedUsername(profile.username)) {
            await removeImage()
            throw new BadRequestException("이미 존재하는 유저네임입니다")
        }

        try {
            const result = await this.userService.signup({
                ...profile,
                image: image.filename,
                posts: [],
                likes: [],
                comments: [],
                receivedNotifications: [],
                sendedNotifications: [],
                friends: []
            })

            res.cookie("sessionId", result.session.sessionId, {
                httpOnly: true,
                sameSite: "strict",
                secure: true
            })

            return res.send(result.username)
        } catch(_) {
            removeImage()
            throw new InternalServerErrorException()
        }
    }

    @Get('/relation')
    async getRelationWith(
        @Query('username') username: string,
        @Req() req: Request
    ) {
        const sessionId = this.getSessionId(req)
        return await this.userService.getRelation(sessionId, username)
    }

    @Get('/postCount')
    async getPostCount(
        @Query('username') username: string
    ) {
        return await this.userService.getPostCount(username)
    }

    @Get('/friends')
    async getFriends(
        @Req() req: Request
    ) {
        const sessionId = this.getSessionId(req)
        return await this.userService.getFriends(sessionId)
    }

    @Post('/requestFriend')
    async requestFriend(
        @Query('username') username: string,
        @Req() req: Request
    ) {
        const sessionId = this.getSessionId(req)
        await this.userService.requestFriend(sessionId, username)
    }

    @Post('/acceptFriend')
    async acceptFriend(
        @Query('nid') nid: number,
        @Req() req: Request
    ) {
        const sessionId = this.getSessionId(req)
        await this.userService.acceptFriend(sessionId, nid)
    }

    @Post('/breakFriend')
    async breakFriend(
        @Query('username') username: string,
        @Req() req: Request
    ) {
        const sessionId = this.getSessionId(req)
        await this.userService.breakFriend(sessionId, username)
    }

    @Get('/search')
    async search(
        @Query('query') query: string
    ) {
        const result = await this.userService.search(query)
        return result.map((user) => {
            return user.username
        })
    }
}
