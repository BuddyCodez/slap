import prisma from "@slap/db";
import { PackStatus } from "@slap/db/prisma/generated/enums";
import { Worker } from "bullmq";

import type { TrendingRecalcJob } from "../lib/queues";
import { redis, redisConnection } from "../lib/redis";

async function recalculateTrending() {
	const downloads = await redis.zrange("slap:downloads", 0, -1, "WITHSCORES");
	const scores = new Map<string, number>();

	for (let index = 0; index < downloads.length; index += 2) {
		const packId = downloads[index];
		const count = Number(downloads[index + 1] ?? 0);
		if (packId && count > 0) {
			scores.set(packId, count);
		}
	}

	if (scores.size === 0) {
		await redis.set("slap:trending:cache", JSON.stringify([]), "EX", 3600);
		return;
	}

	const packs = await prisma.pack.findMany({
		where: {
			id: { in: [...scores.keys()] },
			status: PackStatus.READY,
		},
		select: {
			id: true,
			createdAt: true,
		},
	});

	const now = Date.now();
	const topPacks = packs
		.map((pack) => {
			const ageHours = Math.max(
				0,
				(now - pack.createdAt.getTime()) / (1000 * 60 * 60),
			);
			const downloads = scores.get(pack.id) ?? 0;
			return {
				id: pack.id,
				score: downloads / (ageHours + 2) ** 1.5,
			};
		})
		.toSorted((a, b) => b.score - a.score)
		.slice(0, 20)
		.map((pack) => pack.id);

	await redis.set("slap:trending:cache", JSON.stringify(topPacks), "EX", 3600);
	await redis.del("slap:downloads");
}

new Worker<TrendingRecalcJob>("trending-recalc", recalculateTrending, {
	connection: redisConnection,
});

console.log("trending-recalc worker started");
