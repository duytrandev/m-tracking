import { registerAs } from '@nestjs/config'

export default registerAs('redis', () => ({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379', 10),
  password: process.env.REDIS_PASSWORD || undefined,
  cacheDb: parseInt(process.env.REDIS_CACHE_DB || '0', 10),
  queueDb: parseInt(process.env.REDIS_QUEUE_DB || '1', 10),
}))
