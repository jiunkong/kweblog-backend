import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm"
import { UserEntity } from "./UserEntity"


@Entity({
    name: 'notifications'
})
export class NotificationEntity {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    type: string // like, comment, request
    
    @Column({
        default: null,
        nullable: true
    })
    postId: number

    @Column({
        default: null,
        nullable: true
    })
    accepted: boolean

    @ManyToOne(() => UserEntity, (user) => user.sendedNotifications)
    sender: UserEntity

    @ManyToOne(() => UserEntity, (user) => user.receivedNotifications)
    receiver: UserEntity

    @CreateDateColumn()
    createdDate: Date
}