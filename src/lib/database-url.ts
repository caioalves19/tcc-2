const LOCAL_DATABASE_URL = "postgresql://kolo_user:kolo_password@localhost:5432/kolo_db";

export function databaseUrl(): string {
  const configured = process.env.DATABASE_URL;
  if (configured !== undefined && configured.length > 0) {
    return configured;
  }
  return LOCAL_DATABASE_URL;
}
