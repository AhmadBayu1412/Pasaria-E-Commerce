// Mock Redis client for Serverless environment (No-op)
// Caching and Rate Limiting degrade gracefully when isReady = false.

export const redis = {
    isReady: false,
    connect: async () => {},
    quit: async () => {},
    get: async (_key: string) => null,
    set: async (_key: string, _value: string, _options?: any) => {},
    del: async (_key: string) => 0,
    keys: async (_pattern: string) => [],
    ping: async () => "PONG",
    exists: async (_key: string) => 0,
    incr: async (_key: string) => 1,
    expire: async (_key: string, _seconds: number) => 1,
    ttl: async (_key: string) => -1,
    zRemRangeByScore: async (_key: string, _min: number, _max: number) => 0,
    zCard: async (_key: string) => 0,
    zAdd: async (_key: string, _member: any) => 0,
    zRange: async (_key: string, _min: number, _max: number, _options?: any) => [],
}