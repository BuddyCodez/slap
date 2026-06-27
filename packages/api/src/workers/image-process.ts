import prisma from "@slap/db";
import { PackStatus, StickerStatus } from "@slap/db/prisma/generated/enums";
import { type Job, Worker } from "bullmq";

import { generateThumbnail } from "../lib/image-processing";
import type { ImageProcessJob } from "../lib/queues";
import { redisConnection } from "../lib/redis";
import {
	getObjectBuffer,
	thumbnailKey,
	toPublicUrl,
	uploadObject,
} from "../lib/storage";

async function finalizePack(job: Job<ImageProcessJob>) {
	const { packId, stickers } = job.data;

	// Update each sticker independently — one failure doesn't block others
	const results = await Promise.allSettled(
		stickers.map((s) =>
			prisma.sticker.update({
				where: { id: s.stickerId },
				data: {
					url: s.url,
					r2Key: s.r2Key,
					width: s.width,
					height: s.height,
					sizeBytes: s.sizeBytes,
					status: StickerStatus.READY,
				},
			}),
		),
	);

	const failed = results.filter((r) => r.status === "rejected");
	if (failed.length > 0) {
		console.error(
			`[image-process] ${failed.length}/${stickers.length} sticker DB updates failed for pack ${packId}`,
			failed.map((r) => (r as PromiseRejectedResult).reason),
		);
	}

	// Generate thumbnail from first sticker
	let thumbnail: string | undefined;
	const firstSticker = stickers.toSorted((a, b) => a.order - b.order)[0];

	if (firstSticker) {
		try {
			const webpBuffer = await getObjectBuffer(firstSticker.r2Key);
			const thumb = await generateThumbnail(webpBuffer);
			const key = thumbnailKey(packId);
			await uploadObject({ key, body: thumb, contentType: "image/webp" });
			thumbnail = toPublicUrl(key);
		} catch (err) {
			console.error(
				`[image-process] thumbnail generation failed for pack ${packId}:`,
				err,
			);
		}
	}

	await prisma.pack.update({
		where: { id: packId },
		data: {
			status: PackStatus.READY,
			thumbnail,
		},
	});

	console.log(
		`[image-process] pack ${packId} finalized — ${stickers.length - failed.length}/${stickers.length} stickers ready`,
	);
}

new Worker<ImageProcessJob>("image-process", finalizePack, {
	connection: redisConnection,
	concurrency: 5,
	removeOnComplete: { count: 100 },
	removeOnFail: { count: 500 },
});

console.log("image-process worker started");
