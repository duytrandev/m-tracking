import { registerAs } from '@nestjs/config'

export default registerAs('database', () => ({
  // Support both standard and Supabase env variables
  host: process.env.SUPABASE_DB_HOST || process.env.DB_HOST || 'localhost',
  port: parseInt(
    process.env.SUPABASE_DB_PORT || process.env.DB_PORT || '5432',
    10,
  ),
  username:
    process.env.SUPABASE_DB_USER || process.env.DB_USERNAME || 'postgres',
  password:
    process.env.SUPABASE_DB_PASSWORD || process.env.DB_PASSWORD || 'postgres',
  database:
    process.env.SUPABASE_DB_NAME || process.env.DB_DATABASE || 'm_tracking',
  ssl:
    process.env.DB_SSL === 'true' ||
    process.env.SUPABASE_DB_HOST !== undefined
      ? { rejectUnauthorized: false }
      : false,
  synchronize: process.env.NODE_ENV === 'development',
  logging: process.env.NODE_ENV === 'development',
}))
