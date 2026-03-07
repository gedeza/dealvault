function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const env = {
  DATABASE_URL: requiredEnv("DATABASE_URL"),
  NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET || (
    process.env.NODE_ENV === "production"
      ? (() => { throw new Error("NEXTAUTH_SECRET is required in production"); })()
      : "dev-secret-change-in-production"
  ),
  NEXTAUTH_URL: process.env.NEXTAUTH_URL || "http://localhost:3000",
  NODE_ENV: process.env.NODE_ENV || "development",
} as const;
