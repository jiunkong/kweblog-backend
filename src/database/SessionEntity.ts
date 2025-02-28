import { Entity, PrimaryColumn, Column, OneToOne, JoinColumn } from "typeorm";
import { UserEntity } from "./UserEntity";

@Entity({
    name: 'sessions'
})
export class SessionEntity {
    @PrimaryColumn()
    sessionId: string

    @OneToOne(() => UserEntity)
    @JoinColumn()
    user: UserEntity
}

