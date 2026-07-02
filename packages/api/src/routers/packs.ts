import { ORPCError } from "@orpc/server";
import prisma from "@slap/db";
import type { Prisma } from "@slap/db/prisma/generated/client";
import { PackStatus } from "@slap/db/prisma/generated/enums";
import { z } from "zod";

import { protectedProcedure, publicProcedure } from "../index";
import { processImageToWebp } from "../lib/image-processing";
import { imageProcessQueue } from "../lib/queues";
import { redis } from "../lib/redis";
import {
  deleteObject,
  finalStickerKey,
  toPublicUrl,
  uploadObject,
} from "../lib/storage";
import { validateStickerUpload } from "../lib/uploads";

const packInclude = {
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
  },
  tags: {
    include: {
      tag: true,
    },
  },
} satisfies Prisma.PackInclude;

type PackWithRelations = Prisma.PackGetPayload<{ include: typeof packInclude }>;

const fileSchema = z.instanceof(File);

const paginationInput = z.object({
  limit: z.number().int().min(1).max(50).default(20),
  cursor: z.number().int().min(0).default(0),
});

const packListInput = paginationInput.extend({
  tag: z.string().trim().min(1).optional(),
  category: z.string().trim().min(1).optional(),
  sort: z.enum(["trending", "new"]).default("new"),
});

const packIdInput = z.object({
  packId: z.string().min(1),
});

const searchInput = paginationInput.extend({
  query: z.string().trim().min(1),
});

const createPackInput = z.object({
  name: z.string().trim().min(1).max(80),
  description: z.string().trim().max(500).optional(),
  category: z.string().trim().min(1).max(60).optional(),
  tags: z.array(z.string().trim().min(1).max(40)).max(12).default([]),
  stickers: z.array(fileSchema).min(1).max(30),
});

const uploadStickerInput = z.object({
  packId: z.string().min(1),
  file: fileSchema,
  order: z.number().int().min(0).optional(),
});

function mapPack(pack: PackWithRelations, savedByUser = false) {
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
    savedByUser,
    tags: pack.tags.map(({ tag }) => tag.name),
    stickers: pack.stickers.map((sticker) => ({
      id: sticker.id,
      url: sticker.url,
      width: sticker.width,
      height: sticker.height,
      sizeBytes: sticker.sizeBytes,
      order: sticker.order,
    })),
    previewSticker: pack.stickers[0]
      ? {
          id: pack.stickers[0].id,
          url: pack.stickers[0].url,
        }
      : null,
  };
}

async function getSavedPackIds(userId: string | undefined, packIds: string[]) {
  if (!userId || packIds.length === 0) {
    return new Set<string>();
  }

  const saves = await prisma.save.findMany({
    where: {
      userId,
      packId: { in: packIds },
    },
    select: { packId: true },
  });

  return new Set(saves.map((save) => save.packId));
}

function readyPackWhere(input?: {
  tag?: string;
  category?: string;
}): Prisma.PackWhereInput {
  return {
    status: PackStatus.READY,
    category: input?.category
      ? {
          equals: input.category,
          mode: "insensitive",
        }
      : undefined,
    tags: input?.tag
      ? {
          some: {
            tag: {
              name: {
                equals: input.tag,
                mode: "insensitive",
              },
            },
          },
        }
      : undefined,
  };
}

async function hydrateReadyPacks(packIds: string[], userId?: string) {
  if (packIds.length === 0) {
    return [];
  }

  const packs = await prisma.pack.findMany({
    where: {
      id: { in: packIds },
      status: PackStatus.READY,
    },
    include: packInclude,
  });

  const byId = new Map(packs.map((pack) => [pack.id, pack]));
  const savedPackIds = await getSavedPackIds(userId, packIds);

  return packIds
    .map((id) => byId.get(id))
    .filter((pack): pack is PackWithRelations => Boolean(pack))
    .map((pack) => mapPack(pack, savedPackIds.has(pack.id)));
}

async function enforceUploadRateLimit(userId: string) {
  const key = `slap:ratelimit:upload:${userId}`;
  const count = await redis.incr(key);

  if (count === 1) {
    await redis.expire(key, 3600);
  }

  if (count > 10) {
    throw new ORPCError("TOO_MANY_REQUESTS", {
      message: "Upload limit reached. Try again later.",
    });
  }
}

async function processAndUploadSticker(input: {
  packId: string;
  stickerId: string;
  file: File;
  label?: string;
}) {
  await validateStickerUpload(input.file);
  const raw = Buffer.from(await input.file.arrayBuffer());
  const result = await processImageToWebp(raw, input.label);
  const key = finalStickerKey(input.packId, input.stickerId);
  await uploadObject({ key, body: result.webp, contentType: "image/webp" });
  return { r2Key: key, url: toPublicUrl(key), ...result };
}

export const packsRouter = {
  list: publicProcedure
    .input(packListInput)
    .handler(async ({ input, context }) => {
      if (input.sort === "trending" && !input.tag && !input.category) {
        const cached = await redis.get("slap:trending:cache");
        const packIds = cached ? (JSON.parse(cached) as string[]) : [];

        if (packIds.length > 0) {
          const pageIds = packIds.slice(
            input.cursor,
            input.cursor + input.limit,
          );
          return {
            items: await hydrateReadyPacks(pageIds, context.session?.user.id),
            nextCursor:
              packIds.length > input.cursor + input.limit
                ? input.cursor + input.limit
                : undefined,
          };
        }
      }

      const orderBy: Prisma.PackOrderByWithRelationInput[] =
        input.sort === "new"
          ? [{ createdAt: "desc" }]
          : [{ downloads: "desc" }, { saves: "desc" }, { createdAt: "desc" }];

      const packs = await prisma.pack.findMany({
        where: readyPackWhere(input),
        include: packInclude,
        orderBy,
        skip: input.cursor,
        take: input.limit + 1,
      });

      const page = packs.slice(0, input.limit);
      const savedPackIds = await getSavedPackIds(
        context.session?.user.id,
        page.map((pack) => pack.id),
      );

      return {
        items: page.map((pack) => mapPack(pack, savedPackIds.has(pack.id))),
        nextCursor:
          packs.length > input.limit ? input.cursor + input.limit : undefined,
      };
    }),

  get: publicProcedure
    .input(packIdInput)
    .handler(async ({ input, context }) => {
      const pack = await prisma.pack.findFirst({
        where: {
          id: input.packId,
          status: PackStatus.READY,
        },
        include: packInclude,
      });

      if (!pack) {
        throw new ORPCError("NOT_FOUND", { message: "Pack not found" });
      }

      const savedPackIds = await getSavedPackIds(context.session?.user.id, [
        pack.id,
      ]);

      return mapPack(pack, savedPackIds.has(pack.id));
    }),

  create: protectedProcedure
    .input(createPackInput)
    .handler(async ({ input, context }) => {
      const userId = context.session.user.id;
      await enforceUploadRateLimit(userId);

      const normalizedTags = [
        ...new Set(input.tags.map((tag) => tag.toLowerCase())),
      ];

      const normalizedCategory = input.category
        ? input.category.toLowerCase().trim()
        : undefined;

      if (normalizedCategory) {
        await prisma.category.upsert({
          where: { name: normalizedCategory },
          update: {},
          create: { name: normalizedCategory },
        });
      }

      const pack = await prisma.pack.create({
        data: {
          creatorId: userId,
          name: input.name,
          description: input.description,
          category: normalizedCategory,
          status: PackStatus.PROCESSING,
          tags: {
            create: normalizedTags.map((name) => ({
              tag: {
                connectOrCreate: {
                  where: { name },
                  create: { name },
                },
              },
            })),
          },
          stickers: {
            create: input.stickers.map((_, order) => ({ order })),
          },
        },
        include: {
          stickers: {
            orderBy: { order: "asc" },
          },
        },
      });

      const processed = await Promise.all(
        pack.stickers.map(async (sticker, index) => {
          const file = input.stickers[index];
          if (!file) {
            throw new ORPCError("BAD_REQUEST", {
              message: "Missing sticker upload",
            });
          }
          const result = await processAndUploadSticker({
            packId: pack.id,
            stickerId: sticker.id,
            file,
            label: `Sticker #${index + 1}`,
          });
          return {
            stickerId: sticker.id,
            r2Key: result.r2Key,
            url: result.url,
            width: result.width,
            height: result.height,
            sizeBytes: result.sizeBytes,
            order: sticker.order,
          };
        }),
      );

      await imageProcessQueue.add(
        "finalize-pack",
        {
          packId: pack.id,
          stickers: processed,
        },
        {
          attempts: 3,
          backoff: { type: "exponential", delay: 2000 },
        },
      );

      return {
        id: pack.id,
        status: pack.status,
      };
    }),

  delete: protectedProcedure
    .input(packIdInput)
    .handler(async ({ input, context }) => {
      const pack = await prisma.pack.findUnique({
        where: { id: input.packId },
        include: { stickers: true },
      });

      if (!pack) {
        throw new ORPCError("NOT_FOUND", { message: "Pack not found" });
      }

      if (pack.creatorId !== context.session.user.id) {
        throw new ORPCError("FORBIDDEN", {
          message: "Only the creator can delete this pack",
        });
      }

      await prisma.pack.delete({ where: { id: pack.id } });
      await Promise.allSettled(
        pack.stickers
          .map((sticker) => sticker.r2Key)
          .filter((key): key is string => Boolean(key))
          .map((key) => deleteObject(key)),
      );

      return { deleted: true };
    }),

  trending: publicProcedure.handler(async ({ context }) => {
    const cached = await redis.get("slap:trending:cache");
    const packIds = cached ? (JSON.parse(cached) as string[]) : [];

    if (packIds.length > 0) {
      return hydrateReadyPacks(packIds, context.session?.user.id);
    }

    const packs = await prisma.pack.findMany({
      where: { status: PackStatus.READY },
      include: packInclude,
      orderBy: [
        { downloads: "desc" },
        { saves: "desc" },
        { createdAt: "desc" },
      ],
      take: 20,
    });
    const savedPackIds = await getSavedPackIds(
      context.session?.user.id,
      packs.map((pack) => pack.id),
    );

    return packs.map((pack) => mapPack(pack, savedPackIds.has(pack.id)));
  }),

  search: publicProcedure
    .input(searchInput)
    .handler(async ({ input, context }) => {
      const packs = await prisma.pack.findMany({
        where: {
          status: PackStatus.READY,
          OR: [
            {
              name: {
                contains: input.query,
                mode: "insensitive",
              },
            },
            {
              tags: {
                some: {
                  tag: {
                    name: {
                      contains: input.query,
                      mode: "insensitive",
                    },
                  },
                },
              },
            },
          ],
        },
        include: packInclude,
        orderBy: [
          { downloads: "desc" },
          { saves: "desc" },
          { createdAt: "desc" },
        ],
        skip: input.cursor,
        take: input.limit + 1,
      });

      const page = packs.slice(0, input.limit);
      const savedPackIds = await getSavedPackIds(
        context.session?.user.id,
        page.map((pack) => pack.id),
      );

      return {
        items: page.map((pack) => mapPack(pack, savedPackIds.has(pack.id))),
        nextCursor:
          packs.length > input.limit ? input.cursor + input.limit : undefined,
      };
    }),

  getStatus: protectedProcedure
    .input(packIdInput)
    .handler(async ({ input, context }) => {
      const pack = await prisma.pack.findFirst({
        where: {
          id: input.packId,
          creatorId: context.session.user.id,
        },
        include: {
          stickers: {
            orderBy: { order: "asc" },
            select: {
              id: true,
              order: true,
              status: true,
              url: true,
            },
          },
        },
      });

      if (!pack) {
        throw new ORPCError("NOT_FOUND", { message: "Pack not found" });
      }

      return {
        id: pack.id,
        name: pack.name,
        status: pack.status,
        thumbnail: pack.thumbnail,
        createdAt: pack.createdAt,
        stickers: pack.stickers,
      };
    }),

  myPacks: protectedProcedure
    .input(paginationInput)
    .handler(async ({ input, context }) => {
      const packs = await prisma.pack.findMany({
        where: {
          creatorId: context.session.user.id,
        },
        include: packInclude,
        orderBy: { createdAt: "desc" },
        skip: input.cursor,
        take: input.limit + 1,
      });

      const page = packs.slice(0, input.limit);
      const savedPackIds = await getSavedPackIds(
        context.session?.user.id,
        page.map((pack) => pack.id),
      );

      return {
        items: page.map((pack) => mapPack(pack, savedPackIds.has(pack.id))),
        nextCursor:
          packs.length > input.limit ? input.cursor + input.limit : undefined,
      };
    }),
};

export const stickersRouter = {
  upload: protectedProcedure
    .input(uploadStickerInput)
    .handler(async ({ input, context }) => {
      const pack = await prisma.pack.findUnique({
        where: { id: input.packId },
        include: {
          _count: { select: { stickers: true } },
        },
      });

      if (!pack) {
        throw new ORPCError("NOT_FOUND", { message: "Pack not found" });
      }

      if (pack.creatorId !== context.session.user.id) {
        throw new ORPCError("FORBIDDEN", {
          message: "Only the creator can add stickers",
        });
      }

      const order = input.order ?? pack._count.stickers;
      const sticker = await prisma.sticker.create({
        data: {
          packId: pack.id,
          order,
        },
      });
      const result = await processAndUploadSticker({
        packId: pack.id,
        stickerId: sticker.id,
        file: input.file,
        label: "Sticker",
      });

      await prisma.pack.update({
        where: { id: pack.id },
        data: { status: PackStatus.PROCESSING },
      });
      await imageProcessQueue.add(
        "finalize-pack",
        {
          packId: pack.id,
          stickers: [
            {
              stickerId: sticker.id,
              r2Key: result.r2Key,
              url: result.url,
              width: result.width,
              height: result.height,
              sizeBytes: result.sizeBytes,
              order,
            },
          ],
        },
        {
          attempts: 3,
          backoff: { type: "exponential", delay: 2000 },
        },
      );

      return {
        id: sticker.id,
        status: sticker.status,
      };
    }),

  delete: protectedProcedure
    .input(z.object({ stickerId: z.string().min(1) }))
    .handler(async ({ input, context }) => {
      const sticker = await prisma.sticker.findUnique({
        where: { id: input.stickerId },
        include: { pack: true },
      });

      if (!sticker) {
        throw new ORPCError("NOT_FOUND", { message: "Sticker not found" });
      }

      if (sticker.pack.creatorId !== context.session.user.id) {
        throw new ORPCError("FORBIDDEN", {
          message: "Only the creator can delete stickers",
        });
      }

      await prisma.sticker.delete({ where: { id: sticker.id } });
      if (sticker.r2Key) {
        await deleteObject(sticker.r2Key).catch(() => undefined);
      }

      return { deleted: true };
    }),
};

export const savesRouter = {
  save: protectedProcedure
    .input(packIdInput)
    .handler(async ({ input, context }) => {
      await prisma.$transaction(async (tx) => {
        const pack = await tx.pack.findFirst({
          where: { id: input.packId, status: PackStatus.READY },
          select: { id: true },
        });

        if (!pack) {
          throw new ORPCError("NOT_FOUND", { message: "Pack not found" });
        }

        const existing = await tx.save.findUnique({
          where: {
            userId_packId: {
              userId: context.session.user.id,
              packId: input.packId,
            },
          },
          select: { packId: true },
        });

        if (existing) {
          return;
        }

        await tx.save.create({
          data: {
            userId: context.session.user.id,
            packId: input.packId,
          },
        });
        await tx.pack.update({
          where: { id: input.packId },
          data: { saves: { increment: 1 } },
        });
      });

      return { saved: true };
    }),

  unsave: protectedProcedure
    .input(packIdInput)
    .handler(async ({ input, context }) => {
      await prisma.$transaction(async (tx) => {
        const deleted = await tx.save.deleteMany({
          where: {
            userId: context.session.user.id,
            packId: input.packId,
          },
        });

        if (deleted.count > 0) {
          await tx.pack.update({
            where: { id: input.packId },
            data: { saves: { decrement: deleted.count } },
          });
        }
      });

      return { saved: false };
    }),

  list: protectedProcedure
    .input(paginationInput)
    .handler(async ({ input, context }) => {
      const saves = await prisma.save.findMany({
        where: {
          userId: context.session.user.id,
          pack: { status: PackStatus.READY },
        },
        include: {
          pack: {
            include: packInclude,
          },
        },
        orderBy: { savedAt: "desc" },
        skip: input.cursor,
        take: input.limit + 1,
      });

      const page = saves.slice(0, input.limit);

      return {
        items: page.map((save) => mapPack(save.pack, true)),
        nextCursor:
          saves.length > input.limit ? input.cursor + input.limit : undefined,
      };
    }),
};

export const downloadRouter = {
  trackDownload: publicProcedure
    .input(packIdInput)
    .handler(async ({ input, context }) => {
      const existing = await prisma.pack.findFirst({
        where: { id: input.packId, status: PackStatus.READY },
        select: { id: true },
      });

      if (!existing) {
        throw new ORPCError("NOT_FOUND", { message: "Pack not found" });
      }

      const userId = context.session?.user.id;
      if (userId) {
        const dedupKey = `slap:user-downloads:${userId}`;
        const alreadyDownloaded = await redis.sismember(dedupKey, input.packId);
        if (alreadyDownloaded) {
          return { tracked: false, alreadyDownloaded: true };
        }
        await redis.sadd(dedupKey, input.packId);
      }

      const pack = await prisma.pack.update({
        where: { id: input.packId },
        data: { downloads: { increment: 1 } },
        select: { id: true },
      });

      await redis.zincrby("slap:downloads", 1, pack.id);

      return { tracked: true };
    }),

  getWhatsappBundle: publicProcedure
    .input(packIdInput)
    .handler(async ({ input }) => {
      const pack = await prisma.pack.findFirst({
        where: { id: input.packId, status: PackStatus.READY },
        include: packInclude,
      });

      if (!pack) {
        throw new ORPCError("NOT_FOUND", { message: "Pack not found" });
      }

      return {
        id: pack.id,
        name: pack.name,
        publisher: pack.creator.name,
        trayImageUrl: pack.thumbnail,
        stickers: pack.stickers.map((sticker) => ({
          id: sticker.id,
          url: sticker.url,
          mimeType: "image/webp",
          width: sticker.width,
          height: sticker.height,
          sizeBytes: sticker.sizeBytes,
        })),
      };
    }),
};

export const tagsRouter = {
  list: publicProcedure.handler(async () => {
    const tags = await prisma.tag.findMany({
      include: {
        _count: {
          select: {
            packs: {
              where: {
                pack: {
                  status: PackStatus.READY,
                },
              },
            },
          },
        },
      },
      orderBy: { name: "asc" },
    });

    return tags
      .map((tag) => ({
        id: tag.id,
        name: tag.name,
        packCount: tag._count.packs,
      }))
      .filter((tag) => tag.packCount > 0)
      .toSorted(
        (a, b) => b.packCount - a.packCount || a.name.localeCompare(b.name),
      );
  }),
};

export const categoriesRouter = {
  list: publicProcedure.handler(async () => {
    const categories = await prisma.category.findMany({
      orderBy: { name: "asc" },
    });

    const counts = await prisma.pack.groupBy({
      by: ["category"],
      where: { status: PackStatus.READY, category: { not: null } },
      _count: { id: true },
    });

    const countMap = new Map(counts.map((c) => [c.category, c._count.id]));

    return categories
      .map((cat) => ({
        id: cat.id,
        name: cat.name,
        packCount: countMap.get(cat.name) ?? 0,
      }))
      .toSorted(
        (a, b) => b.packCount - a.packCount || a.name.localeCompare(b.name),
      );
  }),
};
