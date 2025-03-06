import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UserEntity } from 'src/database/UserEntity';
import { SessionEntity } from 'src/database/SessionEntity';
import { DeleteResult, Like, Repository, UpdateResult } from 'typeorm';
import { v4 as uuidv4 } from 'uuid'
import { NotificationEntity } from 'src/database/NotificationEntity';
import { PostEntity } from 'src/database/PostEntity';

@Injectable()
export class UserService {
    constructor(
        @InjectRepository(UserEntity)
        private userRepository: Repository<UserEntity>,
        @InjectRepository(SessionEntity)
        private sessionRepository: Repository<SessionEntity>,
        @InjectRepository(NotificationEntity)
        private notificationRepository: Repository<NotificationEntity>
    ) {}

    async getPostCount(username: string): Promise<number> {
        const user = await this.userRepository.findOne({
            where: {
                username: username
            },
            relations: {
                posts: true
            }
        })
        if (!user) throw new BadRequestException("존재하지 않는 유저입니다")

        return user.posts.length
    }
    
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

    async getNotifications(sessionId: string): Promise<NotificationEntity[]> {
        const session = await this.sessionRepository.createQueryBuilder("session")
            .leftJoinAndSelect("session.user", "user")
            .leftJoinAndSelect("user.receivedNotifications", "receivedNotifications")
            .leftJoinAndSelect("receivedNotifications.sender", "sender")
            .orderBy("receivedNotifications.createdDate", "DESC")
            .where("session.sessionId = :sessionId", { sessionId })
            .getOne()
        if (!session) throw new BadRequestException("잘못된 세션입니다")

        return session.user.receivedNotifications
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

    async getUserBySession(sessionId: string, friends: boolean = false): Promise<UserEntity> {
        const session = await this.sessionRepository.findOne({
            where: {
                sessionId: sessionId
            },
            relations: {
                user: {
                    friends: friends
                }
            }
        })
        if (!session) throw new BadRequestException("잘못된 세션입니다")
        return session.user
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

    async requestFriend(sessionId: string, username: string) {
        const sender = await this.getUserBySession(sessionId, true)
        const target = await this.userRepository.findOne({
            where: {
                username: username
            }
        })
        if (!target) throw new BadRequestException("존재하지 않는 사용자입니다")
        if (sender.friends.some((friend) => friend.uid === target.uid)) throw new BadRequestException("이미 서로이웃입니다")
        
        const newRequest = this.notificationRepository.create({
            type: 'request',
            sender: sender,
            receiver: target,
            accepted: false
        })
        const newNotification = this.notificationRepository.create({
            type: 'requested',
            sender: target,
            receiver: sender
        })
        await this.notificationRepository.save([newRequest, newNotification])
    }

    /*
    self -> 2, friend -> 1, pending -> 0, nothing -> -1
    */
    async getRelation(sessionId: string, username: string): Promise<number> {
        const user = await this.getUserBySession(sessionId, true)

        const target = await this.userRepository.findOne({
            where: {
                username: username
            }
        })
        if (!target) throw new BadRequestException("존재하지 않는 사용자입니다")

        if (user.uid === target.uid) return 2
        else if (user.friends.some((friend) => friend.uid === target.uid)) return 1
        
        const result = await this.notificationRepository.createQueryBuilder("notification")
            .leftJoin("notification.sender", "sender")
            .leftJoin("notification.receiver", "receiver")
            .orderBy("notification.createdDate", "DESC")
            .where("sender.uid = :suid", { suid: user.uid })
            .andWhere("receiver.uid = :ruid", { ruid: target.uid })
            .andWhere("notification.type = 'request' OR notification.type = 'broken'")
            .getOne()
        
        if (result && result.type === 'request') return 0
        else return -1
    }

    async getFriends(sessionId: string) {
        const user = await this.getUserBySession(sessionId, true)
        return user.friends.length
    }

    async breakFriend(sessionId: string, username: string) {
        const sender = await this.getUserBySession(sessionId, true)
        const target = await this.userRepository.findOne({
            where: {
                username: username
            },
            relations: {
                friends: true
            }
        })
        if (!target) throw new BadRequestException("존재하지 않는 사용자입니다")
        if (!sender.friends.some((friend) => friend.uid === target.uid)) throw new BadRequestException("서로이웃이 아닙니다")

        await this.userRepository.createQueryBuilder().relation(UserEntity, "friends").of(sender).remove(target)
        await this.userRepository.createQueryBuilder().relation(UserEntity, "friends").of(target).remove(sender)

        const newNotifications = [
            this.notificationRepository.create({
                type: 'broken',
                sender: target,
                receiver: sender
            }),
            this.notificationRepository.create({
                type: 'broken',
                receiver: target,
                sender: sender
            })
        ]
        this.notificationRepository.save(newNotifications)
    }

    async acceptFriend(sessionId: string, nid: number) {
        const user = await this.getUserBySession(sessionId, true)
        const notification = await this.notificationRepository.findOne({
            where: {
                id: nid
            },
            relations: {
                sender: true,
                receiver: true
            }
        })
        if (!notification || user.uid !== notification.receiver.uid || notification.type !== 'request') throw new BadRequestException("잘못된 요청입니다")
        if (user.friends.some((friend) => friend.uid === notification.sender.uid)) throw new BadRequestException("이미 서로이웃입니다")

        this.notificationRepository.update({
            id: nid
        }, {
            accepted: true
        })

        await this.userRepository.createQueryBuilder().relation(UserEntity, "friends").of(notification.sender).add(notification.receiver)
        await this.userRepository.createQueryBuilder().relation(UserEntity, "friends").of(notification.receiver).add(notification.sender)

        const newNotifications = [
            this.notificationRepository.create({
                sender: notification.sender,
                receiver: notification.receiver,
                type: "accepted"
            }),
            this.notificationRepository.create({
                receiver: notification.sender,
                sender: notification.receiver,
                type: "accepted"
            })
        ]
        await this.notificationRepository.save(newNotifications)
    }

    async search(query: string): Promise<UserEntity[]> {
        return await this.userRepository
            .createQueryBuilder("user")
            .leftJoin(PostEntity, "post", "post.author.uid = user.uid")
            .where("user.username LIKE :query", { query: `%${query}%` })
            .addSelect("COUNT(post.postId)", "postCount")
            .groupBy("user.uid")
            .addOrderBy(
                `CASE 
                    WHEN user.username = :query THEN 0
                    WHEN user.username LIKE :queryStart THEN 1
                    WHEN user.username LIKE :queryMiddle THEN 2
                    WHEN user.username LIKE :queryEnd THEN 3
                    ELSE 4 
                END`,
                "ASC"
            )
            .addOrderBy("postCount", "DESC")
            .setParameters({ 
                query, 
                queryStart: `${query}%`, 
                queryMiddle: `%${query}%`, 
                queryEnd: `%${query}` 
            })
            .getMany();
    }
}
