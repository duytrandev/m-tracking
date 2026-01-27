import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { ConfigModule, ConfigService } from '@nestjs/config'

/**
 * Database module
 *
 * Centralizes TypeORM configuration and provides database connection.
 * Supports both standard PostgreSQL and Supabase configurations.
 * Feature modules import this and use TypeOrmModule.forFeature([entities]).
 *
 * @example
 * // In feature module
 * @Module({
 *   imports: [
 *     DatabaseModule,
 *     TypeOrmModule.forFeature([User, Session]),
 *   ],
 * })
 * export class AuthModule {}
 */
@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const ssl = configService.get<
          boolean | { rejectUnauthorized: boolean }
        >('database.ssl')
        return {
          type: 'postgres' as const,
          host: configService.get<string>('database.host'),
          port: configService.get<number>('database.port'),
          username: configService.get<string>('database.username'),
          password: configService.get<string>('database.password'),
          database: configService.get<string>('database.database'),
          ssl:
            typeof ssl === 'object'
              ? ssl
              : ssl === true
                ? { rejectUnauthorized: false }
                : false,
          synchronize: configService.get<boolean>('database.synchronize'),
          logging: configService.get<boolean>('database.logging'),
          autoLoadEntities: true,
          entities: [__dirname + '/../**/*.entity{.ts,.js}'],
        }
      },
      inject: [ConfigService],
    }),
  ],
  exports: [TypeOrmModule],
})
export class DatabaseModule {}
