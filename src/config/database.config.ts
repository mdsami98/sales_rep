// config/database.config.ts
import { registerAs } from '@nestjs/config';

export default registerAs('database', () => {
  // ✅ Validate all required env vars at startup
  const requiredEnvVars = [
    'DATABASE_HOST',
    'DATABASE_PORT',
    'DATABASE_USER',
    'DATABASE_PASSWORD',
    'DATABASE_NAME',
  ];

  requiredEnvVars.forEach((key) => {
    if (!process.env[key]) {
      throw new Error(`Missing required environment variable: ${key}`);
    }
  });

  return {
    DATABASE_HOST: process.env.DATABASE_HOST!,
    DATABASE_PORT: parseInt(process.env.DATABASE_PORT!, 10),
    DATABASE_USER: process.env.DATABASE_USER!,
    DATABASE_PASSWORD: process.env.DATABASE_PASSWORD!,
    DATABASE_NAME: process.env.DATABASE_NAME!,
  };
});
