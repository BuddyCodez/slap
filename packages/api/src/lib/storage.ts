import { env } from "@slap/env/server";
import { AwsClient } from "aws4fetch";

const r2Endpoint = `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`;

export const r2Client = new AwsClient({
	accessKeyId: env.R2_ACCESS_KEY_ID,
	secretAccessKey: env.R2_SECRET_ACCESS_KEY,
	service: "s3",
	region: "auto",
});

export function toPublicUrl(key: string) {
	return `${env.R2_PUBLIC_URL.replace(/\/$/, "")}/${key}`;
}

function objectUrl(key: string) {
	return `${r2Endpoint}/${env.R2_BUCKET_NAME}/${key}`;
}

export async function uploadObject(input: {
	key: string;
	body: Blob | Buffer | Uint8Array | string;
	contentType: string;
}) {
	const response = await r2Client.fetch(objectUrl(input.key), {
		method: "PUT",
		body: input.body as any,
		headers: {
			"content-type": input.contentType,
		},
	});

	if (!response.ok) {
		throw new Error(`R2 upload failed for ${input.key}: ${response.status}`);
	}

	return toPublicUrl(input.key);
}

export async function getObjectBuffer(key: string) {
	const response = await r2Client.fetch(objectUrl(key));

	if (!response.ok) {
		throw new Error(`R2 download failed for ${key}: ${response.status}`);
	}

	return Buffer.from(await response.arrayBuffer());
}

export async function deleteObject(key: string) {
	const response = await r2Client.fetch(objectUrl(key), { method: "DELETE" });

	if (!response.ok && response.status !== 404) {
		throw new Error(`R2 delete failed for ${key}: ${response.status}`);
	}
}

export function tempStickerKey(packId: string, stickerId: string) {
	return `temp/packs/${packId}/${stickerId}/original`;
}

export function finalStickerKey(packId: string, stickerId: string) {
	return `packs/${packId}/stickers/${stickerId}.webp`;
}

export function thumbnailKey(packId: string) {
	return `packs/${packId}/thumbnail.webp`;
}
