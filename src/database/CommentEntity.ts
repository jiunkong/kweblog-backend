import { Column, Entity, ManyToOne, PrimaryGeneratedColumn, CreateDateColumn } from "typeorm"
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

    @ManyToOne(() => UserEntity, (author) => author.comments)
    author: UserEntity

    @ManyToOne(() => PostEntity, (post) => post.comments)
    post: PostEntity

    @CreateDateColumn()
    createdDate: Date
}