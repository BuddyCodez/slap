import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// Load environment variables from apps/server/.env
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, "../../../apps/server/.env") });

import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import { PrismaClient } from "../prisma/generated/client";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
	console.error("Missing DATABASE_URL in apps/server/.env");
	process.exit(1);
}

const client = new pg.Client({
	connectionString: databaseUrl,
});

const adapter = new PrismaPg(client);
const prisma = new PrismaClient({ adapter });

async function main() {
	console.log("Seeding database with test categories...");

	const categories = ["slang", "coding", "crypto", "memes", "anime"];

	for (const categoryName of categories) {
		const result = await prisma.category.upsert({
			where: { name: categoryName },
			update: {},
			create: { name: categoryName },
		});
		console.log(`Created/updated category: ${result.name}`);
	}

	console.log("Seed completed!");
}

main()
	.then(async () => {
		await prisma.$disconnect();
	})
	.catch(async (e) => {
		console.error(e);
		await prisma.$disconnect();
		process.exit(1);
	});
