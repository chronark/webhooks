import {redis } from "./deps.ts"
export interface Repository<T> {
  get: (key: string) => Promise<T | null>;
  set: (key: string, value: T) => Promise<void>;

  delete: (key: string) => Promise<void>;
}

export class Redis<T> implements Repository<T> {
  constructor() {
    const redisUrl = Deno.env.get("UPSTASH_REDIS_REST_URL");
    if (!redisUrl) {
      throw new Error("UPSTASH_REDIS_REST_URL missing");
    }
    const redisToken = Deno.env.get("UPSTASH_REDIS_REST_TOKEN");
    if (!redisToken) {
      throw new Error("UPSTASH_REDIS_REST_TOKEN missing");
    }

    redis.auth(redisUrl, redisToken);
  }

  public async get(key: string): Promise<T | null> {
    const res = await redis.get(key);
    if (res.error) {
      throw new Error(res.error);
    }

    return res.data ? (JSON.parse(res.data) as T) : null;
  }

  public async set(key: string, value: T): Promise<void> {
    const res = await redis.set(key, JSON.stringify(value));
    if (res.error) {
      throw new Error(res.error);
    }
  }
  public async delete(key: string): Promise<void> {
    const res = await redis.del(key);
    if (res.error) {
      throw new Error(res.error);
    }
  }
}
