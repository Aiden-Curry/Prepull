import { query } from "../guilds/db.ts";

export type RateLimitConsumption = { count: number; resetAt: Date };
export interface RateLimitStore { consume(bucket: string, keyHash: string, limit: number, windowMs: number, now: Date): Promise<RateLimitConsumption>; }

export class PostgresRateLimitStore implements RateLimitStore {
  async consume(bucket: string, keyHash: string, _limit: number, windowMs: number, now: Date) {
    const windowStartedAt = new Date(Math.floor(now.getTime() / windowMs) * windowMs);
    const resetAt = new Date(windowStartedAt.getTime() + windowMs);
    await query("DELETE FROM abuse_rate_limit_windows WHERE bucket=$1 AND expires_at<=$2", [bucket, now]);
    const result = await query<{ request_count: number }>(
      `INSERT INTO abuse_rate_limit_windows(bucket,key_hash,window_started_at,request_count,expires_at)
       VALUES($1,$2,$3,1,$4)
       ON CONFLICT(bucket,key_hash,window_started_at)
       DO UPDATE SET request_count=abuse_rate_limit_windows.request_count+1,expires_at=excluded.expires_at
       RETURNING request_count`,
      [bucket, keyHash, windowStartedAt, resetAt],
    );
    return { count: result.rows[0].request_count, resetAt };
  }
}

export const postgresRateLimitStore = new PostgresRateLimitStore();
