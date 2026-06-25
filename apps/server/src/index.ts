import { cors } from "@elysiajs/cors";
import { OpenAPIHandler } from "@orpc/openapi/fetch";
import { OpenAPIReferencePlugin } from "@orpc/openapi/plugins";
import { onError, ORPCError } from "@orpc/server";
import { RPCHandler } from "@orpc/server/fetch";
import { ZodToJsonSchemaConverter } from "@orpc/zod/zod4";
import { createContext } from "@slap/api/context";
import { imageProcessQueue, scheduleTrendingRecalc } from "@slap/api/lib/queues";
import { redis } from "@slap/api/lib/redis";
import { tempStickerKey, uploadObject } from "@slap/api/lib/storage";
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
				return new Response("Unauthorized", { status: 401 });
			}

			const userId = session.user.id;

			// Extract and validate FormData fields
			const name = (formData.get("name") as string)?.trim();
			const description = (formData.get("description") as string)?.trim() || "";
			const category = (formData.get("category") as string)?.trim();
			const tagsJson = (formData.get("tags") as string) || "[]";
			const stickerFiles = formData.getAll("stickers") as File[];

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

				// Stage sticker files and collect metadata
				const staged = await Promise.all(
					pack.stickers.map(async (sticker, index) => {
						const file = stickerFiles[index];
						if (!file) {
							throw new Error("Missing sticker upload");
						}

						// Validate sticker upload
						await validateStickerUpload(file);

						// Stage file
						const tempKey = tempStickerKey(pack.id, sticker.id);
						await uploadObject({
							key: tempKey,
							body: Buffer.from(await file.arrayBuffer()),
							contentType: file.type || "application/octet-stream",
						});

						// Update sticker with temp URL
						await prisma.sticker.update({
							where: { id: sticker.id },
							data: { tempUrl: tempKey },
						});

						return {
							stickerId: sticker.id,
							tempKey,
							order: sticker.order,
						};
					})
				);

				// Queue image processing
				await imageProcessQueue.add("process-pack", {
					packId: pack.id,
					stickers: staged,
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
	.get("/", () => "OK")
	.listen(3000, () => {
		console.log("Server is running on http://localhost:3000");
	});
