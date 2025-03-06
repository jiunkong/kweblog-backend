import { BadRequestException } from "@nestjs/common"
import { Request } from "express"

export function getSessionId(req: Request): string {
    const sessionId = req.cookies.sessionId
    if (!sessionId) throw new BadRequestException("세션이 필요합니다")
    return sessionId
}