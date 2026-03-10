import { Injectable, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

@Injectable()
export class RedisService {
  constructor(@Inject(CACHE_MANAGER) private readonly cache: Cache) {}

  get<T>(key: string): Promise<T | null> {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    return this.cache.get(key) as Promise<T | null>;
  }

  async set(key: string, value: any, ttl?: number): Promise<void> {
    await this.cache.set(key, value, ttl);
  }

  async del(key: string): Promise<void> {
    await this.cache.del(key);
  }

  async delPattern(pattern: string): Promise<void> {
    const cacheAny = this.cache as any;
    let keys: string[] = [];

    if (cacheAny.store && typeof cacheAny.store.keys === 'function') {
      keys = await cacheAny.store.keys(pattern);
    } else if (
      cacheAny.stores &&
      cacheAny.stores.length > 0 &&
      typeof cacheAny.stores[0].keys === 'function'
    ) {
      keys = await cacheAny.stores[0].keys(pattern);
    } else {
      // Fallback if neither exposes keys directly, though redisStore usually does
      // Note: If this fallback is reached, we might not be able to delete by pattern
      // cleanly using cache-manager abstraction directly without the redis client.
      console.warn('delPattern: store.keys is not available on cache instance');
      return;
    }

    if (keys?.length) {
      await Promise.all(keys.map((key: string) => this.cache.del(key)));
    }
  }

  async getOrSet<T>(
    key: string,
    factory: () => Promise<T>,
    ttl?: number,
  ): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached) return cached;

    const data = await factory();
    await this.set(key, data, ttl);
    return data;
  }
}