import { CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm"
import { PostEntity } from "./PostEntity"
import { UserEntity } from "./UserEntity"

@Entity({
    name: 'saves'
})
export class SaveEntity {
    @PrimaryGeneratedColumn()
    id: number

    @ManyToOne(() => PostEntity, (post) => post.saves)
    post: PostEntity

    @ManyToOne(() => UserEntity, (user) => user.saves)
    user: UserEntity

    @CreateDateColumn()
    createdDate: Date
}