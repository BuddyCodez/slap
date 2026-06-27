import { cors } from "@elysiajs/cors";
import { OpenAPIHandler } from "@orpc/openapi/fetch";
import { OpenAPIReferencePlugin } from "@orpc/openapi/plugins";
import { onError } from "@orpc/server";
import { RPCHandler } from "@orpc/server/fetch";
import { ZodToJsonSchemaConverter } from "@orpc/zod/zod4";
import { createContext } from "@slap/api/context";
import { processImageToWebp } from "@slap/api/lib/image-processing";
import { imageProcessQueue, scheduleTrendingRecalc } from "@slap/api/lib/queues";
import { redis } from "@slap/api/lib/redis";
import { finalStickerKey, toPublicUrl, uploadObject } from "@slap/api/lib/storage";
import { validateStickerUpload } from "@slap/api/lib/uploads";
import { appRouter } from "@slap/api/routers/index";
import "@slap/api/workers/index";
import { auth } from "@slap/auth";
import prisma from "@slap/db";
import { PackStatus } from "@slap/db/prisma/generated/enums";
import { env } from "@slap/env/server";
import { Elysia } from "elysia";
import { initLogger } from "evlog";
import {
	type BetterAuthInstance,
	createAuthMiddleware,
} from "evlog/better-auth";
import { evlog } from "evlog/elysia";

const rpcHandler = new RPCHandler(appRouter, {
	interceptors: [
		onError((error) => {
			console.error(error);
		}),
	],
});
const apiHandler = new OpenAPIHandler(appRouter, {
	plugins: [
		new OpenAPIReferencePlugin({
			schemaConverters: [new ZodToJsonSchemaConverter()],
		}),
	],
	interceptors: [
		onError((error) => {
			console.error(error);
		}),
	],
});

initLogger({
	env: { service: "slap-server" },
});

const identifyUser = createAuthMiddleware(auth as BetterAuthInstance, {
	exclude: ["/api/auth/**"],
	maskEmail: true,
});

await scheduleTrendingRecalc();

new Elysia()
	.use(evlog())
	.derive(async ({ request, log }) => {
		await identifyUser(log, request.headers, new URL(request.url).pathname);
		return {};
	})
	.use(
		cors({
			origin: env.CORS_ORIGIN,
			methods: ["GET", "POST", "OPTIONS"],
			allowedHeaders: ["Content-Type", "Authorization"],
			credentials: true,
		}),
	)
	.all("/api/auth/*", async (context) => {
		const { request, status } = context;
		if (["POST", "GET"].includes(request.method)) {
			return auth.handler(request);
		}
		return status(405);
	})
	.all(
		"/rpc*",
		async (context) => {
			const { response } = await rpcHandler.handle(context.request, {
				prefix: "/rpc",
				context: await createContext({ context }),
			});
			return response ?? new Response("Not Found", { status: 404 });
		},
		{
			parse: "none",
		},
	)
	.all(
		"/api-reference*",
		async (context) => {
			const { response } = await apiHandler.handle(context.request, {
				prefix: "/api-reference",
				context: await createContext({ context }),
			});
			return response ?? new Response("Not Found", { status: 404 });
		},
		{
			parse: "none",
		},
	)
	.post(
		"/api/packs/create-formdata",
		async (context) => {
			const { request } = context;
			const formData = await request.formData();

			// Extract session
			const session = await auth.api.getSession({
				headers: request.headers,
			});

      if (!session?.user) {
        console.log("No sess");
				return new Response("Unauthorized", { status: 401 });
			}

			const userId = session.user.id;

			// Extract and validate FormData fields
			const name = (formData.get("name") as string)?.trim();
			const description = (formData.get("description") as string)?.trim() || "";
			const category = (formData.get("category") as string)?.trim();
			const tagsJson = (formData.get("tags") as string) || "[]";
			const stickerDataStrings = formData.getAll("stickers") as string[];

			// Parse base64-encoded sticker data from React Native
			const stickerFiles = stickerDataStrings.map((dataStr) => {
				try {
					const parsed = JSON.parse(dataStr);
					return {
						base64: parsed.data,
						name: parsed.name,
						type: parsed.type,
					};
				} catch {
					throw new Error(`Failed to parse sticker data: ${dataStr}`);
				}
			});

			console.log("[create-formdata] received:", {
				name,
				category,
				tagsJson,
				stickerCount: stickerFiles.length,
				stickerDetails: stickerFiles.map((f, i) => ({
					index: i,
					name: f.name,
					type: f.type,
					dataLength: f.base64.length,
				})),
			});

			// Validation
			if (!name) {
				return new Response(
					JSON.stringify({ error: "Pack name is required" }),
					{ status: 400, headers: { "Content-Type": "application/json" } }
				);
			}

			if (stickerFiles.length === 0 || stickerFiles.length > 30) {
				return new Response(
					JSON.stringify({
						error: "Add between 1 and 30 stickers",
					}),
					{ status: 400, headers: { "Content-Type": "application/json" } }
				);
			}

			try {
				// Enforce rate limit
				const rateLimitKey = `slap:ratelimit:upload:${userId}`;
				const count = await redis.incr(rateLimitKey);
				if (count === 1) {
					await redis.expire(rateLimitKey, 3600);
				}
				if (count > 10) {
					return new Response(
						JSON.stringify({
							error: "Upload limit reached. Try again later.",
						}),
						{
							status: 429,
							headers: { "Content-Type": "application/json" },
						}
					);
				}

				// Parse and normalize tags
				let parsedTags: string[] = [];
				try {
					parsedTags = JSON.parse(tagsJson);
				} catch {
					parsedTags = [];
				}
				const normalizedTags = [
					...new Set(parsedTags.map((tag) => tag.toLowerCase())),
				];

				// Normalize category
				const normalizedCategory = category
					? category.toLowerCase().trim()
					: undefined;

				// Create/upsert category
				if (normalizedCategory) {
					await prisma.category.upsert({
						where: { name: normalizedCategory },
						update: {},
						create: { name: normalizedCategory },
					});
				}

				// Create pack with tags
				const pack = await prisma.pack.create({
					data: {
						creatorId: userId,
						name,
						description,
						category: normalizedCategory,
						status: PackStatus.PROCESSING,
						tags: {
							create: normalizedTags.map((tagName) => ({
								tag: {
									connectOrCreate: {
										where: { name: tagName },
										create: { name: tagName },
									},
								},
							})),
						},
						stickers: {
							create: stickerFiles.map((_, order) => ({ order })),
						},
					},
					include: {
						stickers: {
							orderBy: { order: "asc" },
						},
					},
				});

				// Process + upload each sticker inline (fail fast)
				const processed = await Promise.all(
					pack.stickers.map(async (sticker, index) => {
						const stickerData = stickerFiles[index];
						if (!stickerData) {
							throw new Error(`Sticker #${index + 1}: missing data`);
						}

						// Decode base64 to Buffer
						const raw = Buffer.from(stickerData.base64, 'base64');

						// Create a File-like object for validation
						const filelike = {
							arrayBuffer: async () => raw.buffer.slice(raw.byteOffset, raw.byteOffset + raw.byteLength),
						} as File;

						await validateStickerUpload(filelike);
						const result = await processImageToWebp(raw, `Sticker #${index + 1}`);

						const key = finalStickerKey(pack.id, sticker.id);
						await uploadObject({ key, body: result.webp, contentType: "image/webp" });

						return {
							stickerId: sticker.id,
							r2Key: key,
							url: toPublicUrl(key),
							width: result.width,
							height: result.height,
							sizeBytes: result.sizeBytes,
							order: sticker.order,
						};
					}),
				);

				// Queue lightweight finalization (DB updates + thumbnail)
				await imageProcessQueue.add("finalize-pack", {
					packId: pack.id,
					stickers: processed,
				}, {
					attempts: 3,
					backoff: { type: "exponential", delay: 2000 },
				});

				return new Response(
					JSON.stringify({
						id: pack.id,
						status: pack.status,
					}),
					{
						status: 200,
						headers: { "Content-Type": "application/json" },
					}
				);
			} catch (error) {
				console.error("Pack creation error:", error);
				const message =
					error instanceof Error ? error.message : "Failed to create pack";
				return new Response(JSON.stringify({ error: message }), {
					status: 500,
					headers: { "Content-Type": "application/json" },
				});
			}
		},
		{
			parse: "none",
		}
	)
	.post(
		"/api/stickers/add-formdata",
		async (context) => {
			const { request } = context;
			const formData = await request.formData();

			const session = await auth.api.getSession({ headers: request.headers });
			if (!session?.user) {
				return new Response(JSON.stringify({ error: "Unauthorized" }), {
					status: 401,
					headers: { "Content-Type": "application/json" },
				});
			}

			const packId = (formData.get("packId") as string)?.trim();
			const stickerFile = formData.get("sticker") as File | null;
			const order = Number(formData.get("order") ?? -1);

			if (!packId || !stickerFile) {
				return new Response(
					JSON.stringify({ error: "packId and sticker file are required" }),
					{ status: 400, headers: { "Content-Type": "application/json" } },
				);
			}

			try {
				const pack = await prisma.pack.findUnique({
					where: { id: packId },
					include: { _count: { select: { stickers: true } } },
				});

				if (!pack) {
					return new Response(
						JSON.stringify({ error: "Pack not found" }),
						{ status: 404, headers: { "Content-Type": "application/json" } },
					);
				}

				if (pack.creatorId !== session.user.id) {
					return new Response(
						JSON.stringify({ error: "Only the creator can add stickers" }),
						{ status: 403, headers: { "Content-Type": "application/json" } },
					);
				}

				await validateStickerUpload(stickerFile);
				const raw = Buffer.from(await stickerFile.arrayBuffer());
				const result = await processImageToWebp(raw, "Sticker");

				const stickerOrder = order >= 0 ? order : pack._count.stickers;
				const sticker = await prisma.sticker.create({
					data: { packId, order: stickerOrder },
				});

				const key = finalStickerKey(packId, sticker.id);
				await uploadObject({ key, body: result.webp, contentType: "image/webp" });
				const url = toPublicUrl(key);

				await prisma.sticker.update({
					where: { id: sticker.id },
					data: {
						url,
						r2Key: key,
						width: result.width,
						height: result.height,
						sizeBytes: result.sizeBytes,
						status: "READY",
					},
				});

				await prisma.pack.update({
					where: { id: packId },
					data: { status: "READY" },
				});

				return new Response(
					JSON.stringify({ id: sticker.id, status: "READY", url }),
					{ status: 200, headers: { "Content-Type": "application/json" } },
				);
			} catch (error) {
				console.error("Sticker add error:", error);
				const message = error instanceof Error ? error.message : "Failed to add sticker";
				return new Response(JSON.stringify({ error: message }), {
					status: 500,
					headers: { "Content-Type": "application/json" },
				});
			}
		},
		{ parse: "none" },
	)
	.get("/", () => "OK")
	.listen(3000, () => {
		console.log("Server is running on http://localhost:3000");
	});
