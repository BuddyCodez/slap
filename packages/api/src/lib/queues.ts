import { Queue } from "bullmq";

import { redisConnection } from "./redis";

export type ImageProcessJob = {
	packId: string;
	stickers: {
		stickerId: string;
		tempKey: string;
		order: number;
	}[];
};

export type TrendingRecalcJob = Record<string, never>;

export const imageProcessQueue = new Queue<ImageProcessJob>("image-process", {
	connection: redisConnection,
});

export const trendingRecalcQueue = new Queue<TrendingRecalcJob>(
	"trending-recalc",
	{
		connection: redisConnection,
	},
);

export async function scheduleTrendingRecalc() {
	await trendingRecalcQueue.upsertJobScheduler(
		"hourly-trending-recalc",
		{ pattern: "0 * * * *" },
		{
			name: "recalculate",
			data: {},
		},
	);
}
