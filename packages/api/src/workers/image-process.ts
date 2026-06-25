import prisma from "@slap/db";
import { PackStatus, StickerStatus } from "@slap/db/prisma/generated/enums";
import { type Job, Worker } from "bullmq";
import sharp from "sharp";

import type { ImageProcessJob } from "../lib/queues";
import { redisConnection } from "../lib/redis";
import {
	finalStickerKey,
	getObjectBuffer,
	thumbnailKey,
	toPublicUrl,
	uploadObject,
} from "../lib/storage";

const maxDimension = 512;
const maxSizeBytes = 512 * 1024;

async function processSticker(
	input: ImageProcessJob["stickers"][number] & {
		packId: string;
	},
) {
	const original = await getObjectBuffer(input.tempKey);
	const image = sharp(original, { failOn: "warning" }).rotate();
	const metadata = await image.metadata();

	if (
		!metadata.width ||
		!metadata.height ||
		metadata.width > maxDimension ||
		metadata.height > maxDimension
	) {
		throw new Error(
			`Sticker ${input.stickerId} exceeds ${maxDimension}x${maxDimension}`,
		);
	}

	const webp = await image.webp({ quality: 90 }).toBuffer();

	if (webp.byteLength > maxSizeBytes) {
		throw new Error(
			`Sticker ${input.stickerId} exceeds 512KB after conversion`,
		);
	}

	const key = finalStickerKey(input.packId, input.stickerId);
	const url = await uploadObject({
		key,
		body: webp,
		contentType: "image/webp",
	});

	await prisma.sticker.update({
		where: { id: input.stickerId },
		data: {
			url,
			r2Key: key,
			width: metadata.width,
			height: metadata.height,
			sizeBytes: webp.byteLength,
			status: StickerStatus.READY,
		},
	});

	return { key, webp };
}

async function processPack(job: Job<ImageProcessJob>) {
	const processed: { key: string; webp: Buffer }[] = [];

	try {
		for (const sticker of job.data.stickers.toSorted(
			(a, b) => a.order - b.order,
		)) {
			processed.push(
				await processSticker({ ...sticker, packId: job.data.packId }),
			);
		}

		const firstSticker = processed[0];
		let thumbnail: string | undefined;

		if (firstSticker) {
			const thumb = await sharp(firstSticker.webp)
				.resize(96, 96, { fit: "inside" })
				.webp({ quality: 85 })
				.toBuffer();
			const key = thumbnailKey(job.data.packId);
			await uploadObject({ key, body: thumb, contentType: "image/webp" });
			thumbnail = toPublicUrl(key);
		}

		await prisma.pack.update({
			where: { id: job.data.packId },
			data: {
				status: PackStatus.READY,
				thumbnail,
			},
		});
	} catch (error) {
		await prisma.pack.update({
			where: { id: job.data.packId },
			data: { status: PackStatus.FAILED },
		});
		await prisma.sticker.updateMany({
			where: {
				id: { in: job.data.stickers.map((sticker) => sticker.stickerId) },
				status: StickerStatus.PROCESSING,
			},
			data: { status: StickerStatus.FAILED },
		});
		throw error;
	}
}

new Worker<ImageProcessJob>("image-process", processPack, {
	connection: redisConnection,
});

console.log("image-process worker started");
