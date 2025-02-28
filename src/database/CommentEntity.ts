import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm"
import { UserEntity } from "./UserEntity"
import { PostEntity } from "./PostEntity"

@Entity({
    name: 'comments'
})
export class CommentEntity {
    @PrimaryGeneratedColumn()
    id: number

    @Column('text')
    content: string

    @ManyToOne(() => UserEntity, (user) => user.comments)
    user: UserEntity

    @ManyToOne(() => PostEntity, (post) => post.comments)
    post: PostEntity
}