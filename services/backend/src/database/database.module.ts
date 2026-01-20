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
        const ssl = configService.get('database.ssl')
        return {
          type: 'postgres',
          host: configService.get('database.host'),
          port: configService.get('database.port'),
          username: configService.get('database.username'),
          password: configService.get('database.password'),
          database: configService.get('database.database'),
          ssl: typeof ssl === 'object' ? ssl : ssl === true ? { rejectUnauthorized: false } : false,
          synchronize: configService.get('database.synchronize'),
          logging: configService.get('database.logging'),
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
