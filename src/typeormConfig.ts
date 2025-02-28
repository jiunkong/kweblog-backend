import { ConfigService } from "@nestjs/config";
import { TypeOrmModuleOptions } from "@nestjs/typeorm";
import { UserEntity } from "./database/UserEntity";
import { SessionEntity } from "./database/SessionEntity";
import { PostEntity } from "./database/PostEntity";
import { LikeEntity } from "./database/LIkedEntity";
import { CommentEntity } from "./database/CommentEntity";

export const TypeORMConfig = async (configService: ConfigService): Promise<TypeOrmModuleOptions> => {
    return {
        type: 'mysql',
        host: configService.get<string>('DB_HOST') || 'localhost',
        port: parseInt(configService.get<string>('DB_PORT') || "") || 3306,
        username: configService.get<string>('DB_USERNAME'),
        password: configService.get<string>('DB_PASSWORD'),
        database: configService.get<string>('DB_NAME'),
        entities: [UserEntity, SessionEntity, PostEntity, LikeEntity, CommentEntity],
        synchronize: true
    }
}