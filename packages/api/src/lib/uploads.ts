import { ORPCError } from "@orpc/server";
import { fileTypeFromBuffer } from "file-type";

const allowedMimeTypes = new Set([
	"image/png",
	"image/webp",
	"image/gif",
	"image/jpeg",
]);

const maxStickerBytes = 2 * 1024 * 1024;

export async function validateStickerUpload(file: File) {
	const buffer = Buffer.from(await file.arrayBuffer());

	if (buffer.byteLength > maxStickerBytes) {
		throw new ORPCError("BAD_REQUEST", {
			message: "Sticker exceeds 2MB",
		});
	}

	const detected = await fileTypeFromBuffer(buffer);
	if (!detected || !allowedMimeTypes.has(detected.mime)) {
		throw new ORPCError("BAD_REQUEST", {
			message: "Only PNG, WebP, GIF, and JPEG stickers are supported",
		});
	}

	return buffer;
}
