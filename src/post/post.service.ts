import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, UpdateResult } from 'typeorm';
import { UserEntity } from 'src/database/UserEntity';
import { SessionEntity } from 'src/database/SessionEntity';
import { PostEntity } from 'src/database/PostEntity';
import { LikeEntity } from 'src/database/LIkedEntity';
import { getUserBySessionId } from 'src/util';

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
        private likeRepository: Repository<LikeEntity>
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

    async toggleLike(postId: number, sessionId: string) {
        const user = await getUserBySessionId(this.sessionRepository, sessionId, false, true)
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
        
        const like = post.likes.find((likeEntity) => likeEntity.user.uid == user.uid)

        if (like) {
            await this.likeRepository.delete({
                id: like.id
            })
        } else {
            const newLike = this.likeRepository.create({
                user: user,
                post: post
            })
            await this.likeRepository.save(newLike)
        }
    }

    async getUserPosts(username: string): Promise<PostEntity[] | null> {
        const user = await this.userRepository.createQueryBuilder("user")
            .leftJoinAndSelect("user.posts", "post")
            .orderBy("post.createdDate", "DESC")
            .where("user.username = :username", { username })
            .getOne()
        if (!user) throw new BadRequestException("존재하지 않는 사용자입니다")

        return user.posts
    }
}
