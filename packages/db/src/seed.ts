import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// Load environment variables from apps/server/.env
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, "../../../apps/server/.env") });

import { PrismaClient } from "../prisma/generated/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import sharp from "sharp";
import { AwsClient } from "aws4fetch";

const databaseUrl = process.env.DATABASE_URL;
const r2AccountId = process.env.R2_ACCOUNT_ID;
const r2AccessKeyId = process.env.R2_ACCESS_KEY_ID;
const r2SecretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
const r2BucketName = process.env.R2_BUCKET_NAME || "slap-assets";
const r2PublicUrl = process.env.R2_PUBLIC_URL || "";

if (!databaseUrl || !r2AccountId || !r2AccessKeyId || !r2SecretAccessKey || !r2PublicUrl) {
	console.error("Missing environment variables in apps/server/.env");
	process.exit(1);
}

// Set up R2 client
const r2Endpoint = `https://${r2AccountId}.r2.cloudflarestorage.com`;
const r2Client = new AwsClient({
	accessKeyId: r2AccessKeyId,
	secretAccessKey: r2SecretAccessKey,
	service: "s3",
	region: "auto",
});

async function uploadToR2(key: string, body: Buffer, contentType: string) {
	const url = `${r2Endpoint}/${r2BucketName}/${key}`;
	const response = await r2Client.fetch(url, {
		method: "PUT",
		body,
		headers: {
			"content-type": contentType,
		},
	});
	if (!response.ok) {
		throw new Error(`R2 upload failed for ${key}: ${response.status}`);
	}
	return `${r2PublicUrl.replace(/\/$/, "")}/${key}`;
}

// Set up Prisma
const pool = new pg.Pool({ connectionString: databaseUrl });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const PACKS_DATA = [
	{
		name: "Gen Z Vibe",
		category: "slang",
		description: "Vibe check passed. Unapologetic slang for your daily chats.",
		tags: ["genz", "slang", "vibe", "chaos"],
		stickers: [
			{ emoji: "💀", text: "DEAD" },
			{ emoji: "😭", text: "SOB" },
			{ emoji: "🤡", text: "CLOWN" },
			{ emoji: "💅", text: "SLAY" },
			{ emoji: "🔥", text: "LIT" },
			{ emoji: "🧢", text: "NO CAP" },
			{ emoji: "🚩", text: "RED FLAG" },
			{ emoji: "🗿", text: "MOAI" },
			{ emoji: "🗣️", text: "FACTS" },
			{ emoji: "💯", text: "REAL" },
			{ emoji: "🤝", text: "BET" },
			{ emoji: "🤫", text: "MEWING" },
			{ emoji: "🧏", text: "SHH" },
			{ emoji: "✨", text: "SHINE" },
			{ emoji: "👁️", text: "BRUH" },
			{ emoji: "🧠", text: "BIG BRAIN" },
			{ emoji: "🤬", text: "RAGE" },
			{ emoji: "🥱", text: "BORING" },
			{ emoji: "🫠", text: "MELTING" },
			{ emoji: "🤢", text: "EW" },
		],
	},
	{
		name: "Dev Chaos",
		category: "coding",
		description: "Inside jokes and pain from git push origin master --force.",
		tags: ["dev", "coding", "git", "programming"],
		stickers: [
			{ emoji: "💻", text: "CODE" },
			{ emoji: "🚀", text: "SHIP IT" },
			{ emoji: "🦀", text: "RUSTY" },
			{ emoji: "🐍", text: "PYTHON" },
			{ emoji: "🐛", text: "BUG" },
			{ emoji: "☕", text: "JAVA" },
			{ emoji: "☕", text: "COFFEE" },
			{ emoji: "📡", text: "PING" },
			{ emoji: "💾", text: "SAVE" },
			{ emoji: "🧠", text: "AI" },
			{ emoji: "⚙️", text: "CONFIG" },
			{ emoji: "🛡️", text: "SECURE" },
			{ emoji: "🔑", text: "TOKEN" },
			{ emoji: "📊", text: "STATS" },
			{ emoji: "📈", text: "SCALE" },
			{ emoji: "📉", text: "CRASH" },
			{ emoji: "🗑️", text: "DELETE" },
			{ emoji: "🦖", text: "LEGACY" },
			{ emoji: "🤡", text: "PM" },
			{ emoji: "🤯", text: "PROD DOWN" },
		],
	},
	{
		name: "Crypto Chaos",
		category: "crypto",
		description: "Moon, rekt, gas, and everything between.",
		tags: ["crypto", "finance", "web3", "gamble"],
		stickers: [
			{ emoji: "🪙", text: "COIN" },
			{ emoji: "📈", text: "MOON" },
			{ emoji: "📉", text: "REKT" },
			{ emoji: "💸", text: "GAS" },
			{ emoji: "🤑", text: "PUMP" },
			{ emoji: "🦁", text: "BULL" },
			{ emoji: "🐻", text: "BEAR" },
			{ emoji: "🐋", text: "WHALE" },
			{ emoji: "🚀", text: "HODL" },
			{ emoji: "💎", text: "DIAMOND" },
			{ emoji: "🤡", text: "SHITCOIN" },
			{ emoji: "🎰", text: "GAMBLE" },
			{ emoji: "⚡", text: "L2" },
			{ emoji: "🔒", text: "SAFU" },
			{ emoji: "🛡️", text: "REVOKE" },
			{ emoji: "🥶", text: "FREEZE" },
			{ emoji: "🤡", text: "DEV JUMPED" },
			{ emoji: "💩", text: "DUMP" },
			{ emoji: "🤡", text: "FOMO" },
			{ emoji: "🤫", text: "ALPHA" },
		],
	},
	{
		name: "Meme Lord",
		category: "memes",
		description: "Fresh internet culture packaged into stickers.",
		tags: ["meme", "funny", "internet", "slap"],
		stickers: [
			{ emoji: "😂", text: "LMAO" },
			{ emoji: "👽", text: "BOGDANOFF" },
			{ emoji: "🦖", text: "GIGA" },
			{ emoji: "🐶", text: "DOGE" },
			{ emoji: "🐸", text: "PEPE" },
			{ emoji: "🐱", text: "POPCAT" },
			{ emoji: "🍞", text: "LOAF" },
			{ emoji: "🍌", text: "BANANA" },
			{ emoji: "🦧", text: "MONKE" },
			{ emoji: "🥑", text: "HEALTHY" },
			{ emoji: "🍩", text: "SWEET" },
			{ emoji: "🍔", text: "BORGER" },
			{ emoji: "🌮", text: "TACO" },
			{ emoji: "Sushi", text: "SUS" },
			{ emoji: "🍻", text: "CHEERS" },
			{ emoji: "🍷", text: "FANCY" },
			{ emoji: "🍹", text: "PARTY" },
			{ emoji: "🍕", text: "PIZZA" },
			{ emoji: "🍟", text: "FRIES" },
			{ emoji: "🍿", text: "CHILL" },
		],
	},
	{
		name: "Anime Slap",
		category: "anime",
		description: "Expressive anime reactions to drop in your group chats.",
		tags: ["anime", "reaction", "otaku", "kawaii"],
		stickers: [
			{ emoji: "🦊", text: "KITSUNE" },
			{ emoji: "🌸", text: "SAKURA" },
			{ emoji: "⚡", text: "SHONEN" },
			{ emoji: "🍜", text: "RAMEN" },
			{ emoji: "🍥", text: "NARUTO" },
			{ emoji: "🍡", text: "DANGO" },
			{ emoji: "🍵", text: "MATCHA" },
			{ emoji: "🍙", text: "ONIGIRI" },
			{ emoji: "🎐", text: "WIND" },
			{ emoji: "⛩️", text: "SHRINE" },
			{ emoji: "🗻", text: "FUJI" },
			{ emoji: "🏯", text: "CASTLE" },
			{ emoji: "👹", text: "ONI" },
			{ emoji: "🎭", text: "KABUKI" },
			{ emoji: "🎏", text: "KOI" },
			{ emoji: "🏮", text: "LANTERN" },
			{ emoji: "🐱", text: "NEKO" },
			{ emoji: "🥋", text: "DOJO" },
			{ emoji: "⚔️", text: "KATANA" },
			{ emoji: "🌟", text: "DEKOTORA" },
		],
	},
];

async function generateStickerWebP(emoji: string, text: string): Promise<Buffer> {
	const width = 256;
	const height = 256;
	const svg = `
<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="6" dy="6" stdDeviation="0" flood-color="#000000" />
    </filter>
  </defs>
  <rect x="15" y="15" width="${width - 30}" height="${height - 30}" rx="6" fill="#FFF500" stroke="#000000" stroke-width="5" filter="url(#shadow)"/>
  <text x="50%" y="45%" dominant-baseline="middle" text-anchor="middle" font-size="80" font-family="system-ui, sans-serif">${emoji}</text>
  <text x="50%" y="75%" dominant-baseline="middle" text-anchor="middle" font-size="20" font-family="system-ui, sans-serif" font-weight="900" fill="#000000">${text}</text>
</svg>
`;
	return sharp(Buffer.from(svg)).webp({ quality: 90 }).toBuffer();
}

async function main() {
	console.log("Seeding database and R2...");

	// 1. Create or upsert the system user
	const systemUser = await prisma.user.upsert({
		where: { id: "system" },
		update: {},
		create: {
			id: "system",
			name: "system",
			username: "system",
			email: "system@slap.social",
			emailVerified: true,
		},
	});
	console.log(`System user created/verified: ${systemUser.id}`);

	// 2. Iterate and create packs
	for (const packData of PACKS_DATA) {
		console.log(`\nCreating pack: "${packData.name}"...`);

		// Create pack in DB first
		const pack = await prisma.pack.create({
			data: {
				creatorId: systemUser.id,
				name: packData.name,
				description: packData.description,
				category: packData.category,
				status: "PROCESSING",
				tags: {
					create: packData.tags.map((name) => ({
						tag: {
							connectOrCreate: {
								where: { name },
								create: { name },
							},
						},
					})),
				},
			},
		});

		console.log(`Pack ID: ${pack.id}. Generating and uploading ${packData.stickers.length} stickers...`);

		// Generate and upload stickers
		const createdStickers = [];
		for (let i = 0; i < packData.stickers.length; i++) {
			const item = packData.stickers[i];
			if (!item) continue;
			const webpBuffer = await generateStickerWebP(item.emoji, item.text);

			// Create sticker in DB
			const sticker = await prisma.sticker.create({
				data: {
					packId: pack.id,
					order: i,
					status: "PROCESSING",
				},
			});

			const key = `packs/${pack.id}/stickers/${sticker.id}.webp`;
			const url = await uploadToR2(key, webpBuffer, "image/webp");

			// Update sticker to READY
			const updatedSticker = await prisma.sticker.update({
				where: { id: sticker.id },
				data: {
					url,
					r2Key: key,
					width: 256,
					height: 256,
					sizeBytes: webpBuffer.byteLength,
					status: "READY",
				},
			});

			createdStickers.push(updatedSticker);
			console.log(`Uploaded sticker ${i + 1}/${packData.stickers.length}: ${updatedSticker.id}`);
		}

		// Generate thumbnail from first sticker webp buffer
		const firstSticker = packData.stickers[0];
		if (!firstSticker) continue;
		const firstStickerWebp = await generateStickerWebP(firstSticker.emoji, firstSticker.text);
		const thumbWebp = await sharp(firstStickerWebp)
			.resize(96, 96, { fit: "inside" })
			.webp({ quality: 85 })
			.toBuffer();

		const thumbKey = `packs/${pack.id}/thumbnail.webp`;
		const thumbnailUrl = await uploadToR2(thumbKey, thumbWebp, "image/webp");

		// Set pack to READY
		await prisma.pack.update({
			where: { id: pack.id },
			data: {
				status: "READY",
				thumbnail: thumbnailUrl,
			},
		});

		console.log(`Pack "${packData.name}" is now READY!`);
	}

	console.log("\nSeeding completed successfully!");
	process.exit(0);
}

main().catch((err) => {
	console.error("Seeding failed:", err);
	process.exit(1);
});
