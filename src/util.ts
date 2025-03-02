import { BadRequestException } from "@nestjs/common"
import { Request } from "express"
import { UserEntity } from "./database/UserEntity"
import { Repository } from "typeorm"
import { SessionEntity } from "./database/SessionEntity"

export function getSessionId(req: Request): string {
    const sessionId = req.cookies.sessionId
    if (!sessionId) throw new BadRequestException("세션이 필요합니다")
    return sessionId
}

export async function getUserBySessionId(sessionRepository: Repository<SessionEntity>, sessionId: string, posts: boolean = false, likes: boolean = false): Promise<UserEntity> {
    const session = await sessionRepository.findOne({
        where: {
            sessionId: sessionId
        },
        relations: {
            user: {
                posts: posts,
                likes: likes
            }
        }
    })
    if (!session) throw new BadRequestException("잘못된 세션입니다")
    return session?.user
}