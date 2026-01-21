import { DataSource } from 'typeorm';
import { config } from 'dotenv';

// Load environment variables
config();

// Support both standard and Supabase env variables
const dbHost = process.env.SUPABASE_DB_HOST || process.env.DB_HOST || 'localhost';
const dbPort = parseInt(process.env.SUPABASE_DB_PORT || process.env.DB_PORT || '5432', 10);
const dbUsername = process.env.SUPABASE_DB_USER || process.env.DB_USERNAME || 'postgres';
const dbPassword = process.env.SUPABASE_DB_PASSWORD || process.env.DB_PASSWORD || 'postgres';
const dbDatabase = process.env.SUPABASE_DB_NAME || process.env.DB_DATABASE || 'm_tracking';

// Enable SSL only for Supabase or when explicitly configured
const enableSSL = process.env.DB_SSL === 'true' || process.env.SUPABASE_DB_HOST !== undefined;

export default new DataSource({
  type: 'postgres',
  host: dbHost,
  port: dbPort,
  username: dbUsername,
  password: dbPassword,
  database: dbDatabase,
  entities: ['src/**/*.entity{.ts,.js}'],
  migrations: ['src/migrations/*{.ts,.js}'],
  migrationsTableName: 'migrations',
  ssl: enableSSL ? { rejectUnauthorized: false } : false,
  logging: process.env.NODE_ENV === 'development',
});
