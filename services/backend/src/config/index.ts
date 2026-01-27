/**
 * Configuration barrel export
 *
 * Centralized configuration modules for NestJS ConfigModule.
 */

import appConfig from './app.config'
import databaseConfig from './database.config'
import jwtConfig from './jwt.config'
import redisConfig from './redis.config'

// Array of all config modules for ConfigModule.forRoot()
export const configModules = [appConfig, databaseConfig, jwtConfig, redisConfig]

// Individual config exports
export { default as appConfig } from './app.config'
export { default as databaseConfig } from './database.config'
export { default as jwtConfig } from './jwt.config'
export { default as redisConfig } from './redis.config'
