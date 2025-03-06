import { Entity, PrimaryGeneratedColumn, Column, OneToMany, ManyToMany, JoinTable } from "typeorm";
import { PostEntity } from "./PostEntity";
import { LikeEntity } from "./LikeEntity";
import { CommentEntity } from "./CommentEntity";
import { NotificationEntity } from "./NotificationEntity";
import { SaveEntity } from "./SaveEntity";

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

    @OneToMany(() => SaveEntity, (save) => save.user)
    saves: SaveEntity[]

    @OneToMany(() => LikeEntity, (like) => like.user)
    likes: LikeEntity[]

    @OneToMany(() => CommentEntity, (comment) => comment.author)
    comments: CommentEntity[]

    @OneToMany(() => NotificationEntity, (notification) => notification.sender)
    sendedNotifications: NotificationEntity[]

    @OneToMany(() => NotificationEntity, (notification) => notification.receiver)
    receivedNotifications: NotificationEntity[]

    @ManyToMany(() => UserEntity)
    @JoinTable()
    friends: UserEntity[]
}

