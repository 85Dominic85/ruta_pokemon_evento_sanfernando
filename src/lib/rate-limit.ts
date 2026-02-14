interface RateLimitEntry {
    count: number;
    resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

/**
 * Simple in-memory rate limiter.
 * @param key   – unique key (e.g. IP or email)
 * @param max   – max requests in window
 * @param windowMs – window duration in milliseconds
 * @returns true if allowed, false if rate-limited
 */
export function rateLimit(
    key: string,
    max: number = 10,
    windowMs: number = 60_000
): boolean {
    const now = Date.now();
    const entry = store.get(key);

    if (!entry || now > entry.resetAt) {
        store.set(key, { count: 1, resetAt: now + windowMs });
        return true;
    }

    if (entry.count >= max) {
        return false;
    }

    entry.count++;
    return true;
}

// Clean up stale entries every 5 minutes
if (typeof setInterval !== "undefined") {
    setInterval(() => {
        const now = Date.now();
        for (const [key, entry] of store.entries()) {
            if (now > entry.resetAt) {
                store.delete(key);
            }
        }
    }, 5 * 60_000);
}
