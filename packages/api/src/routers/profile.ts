import { ORPCError } from "@orpc/server";
import prisma from "@slap/db";
import type { Prisma } from "@slap/db/prisma/generated/client";
import { z } from "zod";

import { protectedProcedure, publicProcedure } from "../index";
import { processImageToWebp } from "../lib/image-processing";
import { toPublicUrl, uploadObject } from "../lib/storage";

const paginationInput = z.object({
	limit: z.number().int().min(1).max(50).default(20),
	cursor: z.number().int().min(0).default(0),
});

const updateProfileInput = z.object({
	name: z.string().trim().min(1).max(80).optional(),
	username: z
		.string()
		.trim()
		.min(3)
		.max(30)
		.regex(
			/^[a-zA-Z0-9_]+$/,
			"Username can only contain letters, numbers, and underscores",
		)
		.optional(),
	bio: z.string().trim().max(280).nullable().optional(),
	image: z.url().nullable().optional(),
});

const uploadPhotoInput = z.object({
	photo: z.instanceof(Blob),
});

const packSummaryInclude = {
	creator: {
		select: {
			id: true,
			name: true,
			image: true,
		},
	},
	stickers: {
		where: { status: "READY" },
		orderBy: { order: "asc" },
		take: 1,
	},
	tags: {
		include: {
			tag: true,
		},
	},
	_count: {
		select: {
			stickers: true,
		},
	},
} satisfies Prisma.PackInclude;

type PackSummary = Prisma.PackGetPayload<{
	include: typeof packSummaryInclude;
}>;

function mapPackSummary(pack: PackSummary) {
	return {
		id: pack.id,
		creatorId: pack.creatorId,
		creator: pack.creator,
		name: pack.name,
		description: pack.description,
		category: pack.category,
		thumbnail: pack.thumbnail,
		status: pack.status,
		downloads: pack.downloads,
		saves: pack.saves,
		createdAt: pack.createdAt,
		stickerCount: pack._count.stickers,
		tags: pack.tags.map(({ tag }) => tag.name),
		previewSticker: pack.stickers[0]
			? {
					id: pack.stickers[0].id,
					url: pack.stickers[0].url,
				}
			: null,
	};
}

export const profileRouter = {
	me: protectedProcedure.handler(async ({ context }) => {
		const user = await prisma.user.findUnique({
			where: { id: context.session.user.id },
			select: {
				id: true,
				name: true,
				email: true,
				username: true,
				bio: true,
				image: true,
				createdAt: true,
				_count: {
					select: {
						packs: true,
						saves: true,
					},
				},
			},
		});

		if (!user) {
			throw new ORPCError("NOT_FOUND", { message: "User not found" });
		}

		return {
			id: user.id,
			name: user.name,
			email: user.email,
			username: user.username,
			bio: user.bio,
			image: user.image,
			createdAt: user.createdAt,
			packCount: user._count.packs,
			savedPackCount: user._count.saves,
		};
	}),

	get: publicProcedure
		.input(z.object({ userId: z.string() }))
		.handler(async ({ input }) => {
			const user = await prisma.user.findUnique({
				where: { id: input.userId },
				select: {
					id: true,
					name: true,
					username: true,
					bio: true,
					image: true,
					createdAt: true,
					_count: {
						select: {
							packs: true,
							saves: true,
						},
					},
				},
			});

			if (!user) {
				throw new ORPCError("NOT_FOUND", { message: "User not found" });
			}

			const packs = await prisma.pack.findMany({
				where: { creatorId: input.userId },
				include: packSummaryInclude,
				orderBy: { createdAt: "desc" },
				take: 20,
			});

			return {
				id: user.id,
				name: user.name,
				username: user.username,
				bio: user.bio,
				image: user.image,
				createdAt: user.createdAt,
				packCount: user._count.packs,
				savedPackCount: user._count.saves,
				packs: packs.map(mapPackSummary),
			};
		}),

	update: protectedProcedure
		.input(updateProfileInput)
		.handler(async ({ input, context }) => {
			if (input.username) {
				const existing = await prisma.user.findFirst({
					where: {
						username: input.username,
						NOT: { id: context.session.user.id },
					},
					select: { id: true },
				});

				if (existing) {
					throw new ORPCError("CONFLICT", {
						message: "Username is already taken",
					});
				}
			}

			const user = await prisma.user.update({
				where: { id: context.session.user.id },
				data: {
					name: input.name,
					username: input.username,
					bio: input.bio,
					image: input.image,
				},
				select: {
					id: true,
					name: true,
					email: true,
					username: true,
					bio: true,
					image: true,
					createdAt: true,
				},
			});

			return user;
		}),

	myPacks: protectedProcedure
		.input(paginationInput)
		.handler(async ({ input, context }) => {
			const packs = await prisma.pack.findMany({
				where: { creatorId: context.session.user.id },
				include: packSummaryInclude,
				orderBy: { createdAt: "desc" },
				skip: input.cursor,
				take: input.limit + 1,
			});

			const page = packs.slice(0, input.limit);

			return {
				items: page.map(mapPackSummary),
				nextCursor:
					packs.length > input.limit ? input.cursor + input.limit : undefined,
			};
		}),

	uploadPhoto: protectedProcedure
		.input(uploadPhotoInput)
		.handler(async ({ input, context }) => {
			const buffer = await input.photo.arrayBuffer();
			const nodeBuffer = Buffer.from(buffer);

			const processed = await processImageToWebp(nodeBuffer);
			const photoKey = `users/${context.session.user.id}/profile-photo.webp`;

			await uploadObject({
				key: photoKey,
				body: processed.webp,
				contentType: "image/webp",
			});

			const photoUrl = toPublicUrl(photoKey);

			const updatedUser = await prisma.user.update({
				where: { id: context.session.user.id },
				data: { image: photoUrl },
				select: {
					id: true,
					name: true,
					email: true,
					username: true,
					bio: true,
					image: true,
					createdAt: true,
				},
			});

			return updatedUser;
		}),
};
