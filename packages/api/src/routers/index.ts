import type { RouterClient } from "@orpc/server";

import prisma from "@slap/db";
import { z } from "zod";
import { protectedProcedure, publicProcedure } from "../index";
import {
	categoriesRouter,
	downloadRouter,
	packsRouter,
	savesRouter,
	stickersRouter,
	tagsRouter,
} from "./packs";
import { profileRouter } from "./profile";

export const appRouter = {
	healthCheck: publicProcedure.handler(() => {
		return "OK";
	}),
	checkEmail: publicProcedure
		.input(z.object({ email: z.string().email() }))
		.handler(async ({ input }) => {
			const existing = await prisma.user.findFirst({
				where: { email: input.email },
				select: { id: true },
			});
			return { exists: !!existing };
		}),
	privateData: protectedProcedure.handler(({ context }) => {
		return {
			message: "This is private",
			user: context.session?.user,
		};
	}),
	packs: packsRouter,
	stickers: stickersRouter,
	saves: savesRouter,
	download: downloadRouter,
	tags: tagsRouter,
	categories: categoriesRouter,
	profile: profileRouter,
};
export type AppRouter = typeof appRouter;
export type AppRouterClient = RouterClient<typeof appRouter>;
