import { Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm"
import { PostEntity } from "./PostEntity"
import { UserEntity } from "./UserEntity"

@Entity({
    name: 'likes'
})
export class LikeEntity {
    @PrimaryGeneratedColumn()
    id: number

    @ManyToOne(() => PostEntity, (post) => post.likes)
    post: PostEntity

    @ManyToOne(() => UserEntity, (user) => user.likes)
    user: UserEntity
}