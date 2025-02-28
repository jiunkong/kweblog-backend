import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UserEntity } from 'src/database/UserEntity';
import { SessionEntity } from 'src/database/SessionEntity';
import { DeleteResult, Repository, UpdateResult } from 'typeorm';
import { v4 as uuidv4 } from 'uuid'

@Injectable()
export class UserService {
    constructor(
        @InjectRepository(UserEntity)
        private userRepository: Repository<UserEntity>,
        @InjectRepository(SessionEntity)
        private sessionRepository: Repository<SessionEntity>
    ) {}

    async signin(id: string, pw: string): Promise<{session: SessionEntity, username: string} | null> {
        const user = await this.userRepository.findOne({
            where: {
                id: id,
                password: pw
            }
        })
        if (!user) return null

        const sessionId = uuidv4()
        const existedSessions = await this.sessionRepository.find({
            where: {
                user: user
            },
            relations: ['user']
        })
        
        for (const session of existedSessions) {
            await this.sessionRepository.delete(session)
        }

        const newSession = await this.sessionRepository.create({
            sessionId: sessionId,
            user: user
        })
        
        return {
            session: await this.sessionRepository.save(newSession),
            username: user.username
        } 
    }

    async signup(profile: Omit<UserEntity, "uid">): Promise<{session: SessionEntity, username: string}> {
        const newProfile = this.userRepository.create(profile);
        await this.userRepository.save(newProfile);

        const sessionId = uuidv4()
        const newSession = await this.sessionRepository.create({
            sessionId: sessionId,
            user: newProfile
        })

        return {
            session: await this.sessionRepository.save(newSession),
            username: newProfile.username
        }
    }

    async isExistedId(id: string): Promise<boolean> {
        return await this.userRepository.exists({
            where: {
                id: id
            }
        })
    }

    async isExistedUsername(username: string): Promise<boolean> {
        return await this.userRepository.exists({
            where: {
                username: username
            }
        })
    }

    async getImage(username: string): Promise<string | null> {
        const user = await this.userRepository.findOne({
            where: {
                username: username
            }
        })
        if (!user) return null
        return user.image
    }

    async updateImage(uid: number, image: string): Promise<UpdateResult> {
        return await this.userRepository.update({
            uid: uid
        }, {
            image: image
        })
    }

    async updateIntroduction(uid: number, introduction: string): Promise<UpdateResult> {
        return await this.userRepository.update({
            uid: uid
        }, {
            introduction: introduction
        })
    }

    async getUserBySession(sessionId: string): Promise<UserEntity | null> {
        const session = await this.sessionRepository.findOne({
            where: {
                sessionId: sessionId
            },
            relations: ['user']
        })
        return session?.user ?? null
    }

    async findOneByUsername(username: string): Promise<UserEntity | null> {
        return await this.userRepository.findOne({
            where: {
                username: username
            }
        })
    }

    async findOne(uid: number): Promise<UserEntity | null> {
        return await this.userRepository.findOne({
            where: {
                uid: uid
            }
        })
    }

    async signout(sessionId: string): Promise<DeleteResult> {
        return await this.sessionRepository.delete({
            sessionId: sessionId
        })
    }
}
