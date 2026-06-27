import { expo } from "@better-auth/expo";
import { createPrismaClient } from "@slap/db";
import { env } from "@slap/env/server";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { emailOTP, username } from "better-auth/plugins";
import { Resend } from "resend";

export function createAuth() {
	const prisma = createPrismaClient();
	const resend = new Resend(env.RESEND_API_KEY);

	return betterAuth({
		database: prismaAdapter(prisma, {
			provider: "postgresql",
		}),
		trustedOrigins: [
			env.CORS_ORIGIN,
			"slap://",
			"exp://",
			"http://localhost:8081",
		],
		socialProviders: {
			discord: {
				clientId: env.DISCORD_CLIENT_ID,
				clientSecret: env.DISCORD_CLIENT_SECRET,
			},
		},
		secret: env.BETTER_AUTH_SECRET,
		baseURL: env.BETTER_AUTH_URL,
		user: {
			additionalFields: {
				bio: {
					type: "string",
					required: false,
				},
			},
		},
		advanced: {
			defaultCookieAttributes: {
				sameSite: env.NODE_ENV === "production" ? "none" : "lax",
				secure: env.NODE_ENV === "production",
				httpOnly: true,
			},
		},
		databaseHooks: {
			user: {
				create: {
					before: async (user) => {
						const emailLocal =
							(user.email ? user.email.split("@")[0] : "slap") || "slap";
						const cleanLocal = emailLocal
							.replace(/[^a-zA-Z0-9]/g, "")
							.toLowerCase();
						const randomDigits = Math.floor(1000 + Math.random() * 9000);
						return {
							data: {
								...user,
								name: user.name || emailLocal,
								username:
									user.username || `${cleanLocal || "slap"}_${randomDigits}`,
							},
						};
					},
				},
			},
		},
		plugins: [
			expo(),
			username(),
			emailOTP({
				async sendVerificationOTP({ email, otp, type }) {
					if (type !== "sign-in") return;
					await resend.emails.send({
						from: env.RESEND_FROM_EMAIL,
						to: email,
						subject: "Your Slap sign-in code",
						text: `Your Slap sign-in code is ${otp}. It expires in 5 minutes.`,
					});
				},
			}),
		],
	});
}

export const auth = createAuth();
