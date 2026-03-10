import { registerAs } from "@nestjs/config";


export default registerAs('app', () => {
  const requiredEnvVars = ['NODE_ENV'];

  requiredEnvVars.forEach((key) => {
    if (!process.env[key]) {
      throw new Error(`Missing required environment variable: ${key}`);
    }
  });
  return {
    nodeEnv: process.env.NODE_ENV!,
  };
})