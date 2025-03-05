import { ConfigService } from "@nestjs/config";
import { TypeOrmModuleOptions } from "@nestjs/typeorm";
import { UserEntity } from "./database/UserEntity";
import { SessionEntity } from "./database/SessionEntity";
import { PostEntity } from "./database/PostEntity";
import { LikeEntity } from "./database/LikeEntity";
import { CommentEntity } from "./database/CommentEntity";
import { NotificationEntity } from "./database/NotificationEntity";

export const TypeORMConfig = async (configService: ConfigService): Promise<TypeOrmModuleOptions> => {
    return {
        type: 'mysql',
        host: configService.get<string>('DB_HOST') || 'localhost',
        port: parseInt(configService.get<string>('DB_PORT') || "") || 3306,
        username: configService.get<string>('DB_USERNAME'),
        password: configService.get<string>('DB_PASSWORD'),
        database: configService.get<string>('DB_NAME'),
        entities: [UserEntity, SessionEntity, PostEntity, LikeEntity, CommentEntity, NotificationEntity],
        synchronize: true
    }
}