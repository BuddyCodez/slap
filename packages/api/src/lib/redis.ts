import { env } from "@slap/env/server";
import Redis from "ioredis";

export const redis = new Redis(env.REDIS_URL, {
	maxRetriesPerRequest: null,
});

export const redisConnection = {
	url: env.REDIS_URL,
};
