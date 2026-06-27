import sharp from "sharp";

const MAX_DIMENSION = 768;
const MAX_SIZE_BYTES = 768 * 1024;
const QUALITY_STEPS = [90, 80, 70, 60] as const;

export interface ProcessedImage {
	webp: Buffer;
	width: number;
	height: number;
	sizeBytes: number;
}

export async function processImageToWebp(
	input: Buffer,
	label?: string,
): Promise<ProcessedImage> {
	const image = sharp(input, { failOn: "warning" }).rotate();
	const metadata = await image.metadata();

	if (!metadata.width || !metadata.height) {
		throw new Error(
			`${label ?? "Image"} has invalid or missing dimensions`,
		);
	}

	const needsResize =
		metadata.width > MAX_DIMENSION || metadata.height > MAX_DIMENSION;
	const base = needsResize
		? image.resize(MAX_DIMENSION, MAX_DIMENSION, { fit: "inside" })
		: image;

	for (const quality of QUALITY_STEPS) {
		const webp = await base.clone().webp({ quality }).toBuffer();

		if (webp.byteLength <= MAX_SIZE_BYTES) {
			const outMeta = await sharp(webp).metadata();
			return {
				webp,
				width: outMeta.width ?? metadata.width,
				height: outMeta.height ?? metadata.height,
				sizeBytes: webp.byteLength,
			};
		}
	}

	throw new Error(
		`${label ?? "Image"} exceeds 512 KB even at minimum quality — try a smaller or simpler image`,
	);
}

export async function generateThumbnail(webpBuffer: Buffer): Promise<Buffer> {
	return sharp(webpBuffer)
		.resize(96, 96, { fit: "inside" })
		.webp({ quality: 85 })
		.toBuffer();
}
