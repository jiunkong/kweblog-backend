import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Like, Repository } from 'typeorm';
import { UserEntity } from 'src/database/UserEntity';
import { SessionEntity } from 'src/database/SessionEntity';
import { PostEntity } from 'src/database/PostEntity';
import { LikeEntity } from 'src/database/LikeEntity';
import { getUserBySessionId } from 'src/util';
import { NotificationEntity } from 'src/database/NotificationEntity';

const PAGE_SIZE = 10

@Injectable()
export class PostService {
    constructor(
        @InjectRepository(UserEntity)
        private userRepository: Repository<UserEntity>,
        @InjectRepository(SessionEntity)
        private sessionRepository: Repository<SessionEntity>,
        @InjectRepository(PostEntity)
        private postRepository: Repository<PostEntity>,
        @InjectRepository(LikeEntity)
        private likeRepository: Repository<LikeEntity>,
        @InjectRepository(NotificationEntity)
        private notificationRepository: Repository<NotificationEntity>
    ) {}

    async create(sessionId: string, title: string, content: string, images: string[]): Promise<PostEntity> {
        const user = await getUserBySessionId(this.sessionRepository, sessionId)

        const post = this.postRepository.create({
            content: content,
            images: images,
            author: user,
            title: title,
            likes: [],
            comments: []
        })

        return await this.postRepository.save(post)
    }

    async getPost(postId: number): Promise<PostEntity | null> {
        return await this.postRepository.findOne({
            where: {
                postId: postId
            },
            relations: {
                author: true,
                likes: true,
                comments: true
            }
        })
    }

    async isLiking(postId: number, sessionId: string): Promise<boolean> {
        const user = await getUserBySessionId(this.sessionRepository, sessionId)
        const post = await this.postRepository.findOne({
            where: {
                postId: postId
            },
            relations: {
                likes: {
                    user: true
                }
            }
        })
        if (!post) throw new BadRequestException("존재하지 않는 게시물입니다")

        return post.likes.some((likeEntity) => likeEntity.user.uid == user.uid)
    }

    async getCount(): Promise<number> {
        return await this.postRepository.count()
    }

    async toggleLike(postId: number, sessionId: string) {
        const user = await getUserBySessionId(this.sessionRepository, sessionId, false, true)
        const post = await this.postRepository.findOne({
            where: {
                postId: postId
            },
            relations: {
                likes: {
                    user: true
                },
                author: true
            }
        })
        if (!post) throw new BadRequestException("존재하지 않는 게시물입니다")
        
        const like = post.likes.find((likeEntity) => likeEntity.user.uid == user.uid)

        if (like) {
            await this.likeRepository.delete({
                id: like.id
            })
        } else {
            if (user.uid !== post.author.uid) {
                const newNotification = this.notificationRepository.create({
                    type: 'like',
                    sender: user,
                    receiver: post.author,
                    postId: post.postId
                })
                this.notificationRepository.save(newNotification)
            }
            

            const newLike = this.likeRepository.create({
                user: user,
                post: post
            })
            await this.likeRepository.save(newLike)
        }
    }

    async getPostList(page: number, username?: string): Promise<PostEntity[]> {
        let temp = this.postRepository.createQueryBuilder("post")
            .leftJoinAndSelect("post.author", "author")
            .leftJoinAndSelect("post.likes", "likes")
            .leftJoinAndSelect("post.comments", "comments")
            .orderBy("post.createdDate", "DESC")
        if (username) temp = temp.where("author.username = :username", { username })

        const posts = await temp.take(PAGE_SIZE).skip(PAGE_SIZE * (page - 1)).getMany()
        if (!posts) throw new BadRequestException("존재하지 않는 사용자입니다")

        return posts
    }
}
