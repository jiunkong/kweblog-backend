import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from "typeorm";
import { PostEntity } from "./PostEntity";
import { LikeEntity } from "./LIkedEntity";
import { CommentEntity } from "./CommentEntity";

@Entity({
    name: 'users'
})
export class UserEntity {
    @PrimaryGeneratedColumn()
    uid: number

    @Column()
    username: string

    @Column()
    id: string

    @Column()
    password: string

    @Column()
    introduction: string

    @Column()
    image: string

    @OneToMany(() => PostEntity, (post) => post.author)
    posts: PostEntity[]

    @OneToMany(() => LikeEntity, (like) => like.user)
    likes: LikeEntity[]

    @OneToMany(() => CommentEntity, (comment) => comment.user)
    comments: CommentEntity[]
}

