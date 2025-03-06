import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, CreateDateColumn, OneToMany } from "typeorm";
import { UserEntity } from "./UserEntity";
import { CommentEntity } from "./CommentEntity";
import { LikeEntity } from "./LikeEntity";
import { SaveEntity } from "./SaveEntity";

@Entity({
    name: 'posts'
})
export class PostEntity {
    @PrimaryGeneratedColumn()
    postId: number

    @Column('text')
    title: string

    @Column('longtext')
    content: string

    @Column('simple-array')
    images: string[]

    @ManyToOne(() => UserEntity, (user) => user.posts)
    author: UserEntity

    @CreateDateColumn()
    createdDate: Date

    @OneToMany(() => LikeEntity, (like) => like.post)
    likes: LikeEntity[]

    @OneToMany(() => SaveEntity, (save) => save.post)
    saves: SaveEntity[]

    @OneToMany(() => CommentEntity, (comment) => comment.post)
    comments: CommentEntity[]
}

