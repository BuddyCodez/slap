import { expo } from "@better-auth/expo";
import { createPrismaClient } from "@slap/db";
import { env } from "@slap/env/server";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { emailOTP } from "better-auth/plugins";
export function createAuth() {
  const prisma = createPrismaClient();

  return betterAuth({
    database: prismaAdapter(prisma, {
      provider: "postgresql",
    }),
    trustedOrigins: [env.CORS_ORIGIN, "slap://", "exp://", "http://localhost:8081"],
    socialProviders: {
      discord: { 
            clientId: process.env.DISCORD_CLIENT_ID as string, 
            clientSecret: process.env.DISCORD_CLIENT_SECRET as string, 
        }, 
    },
    secret: env.BETTER_AUTH_SECRET,
    baseURL: env.BETTER_AUTH_URL,
    advanced: {
      defaultCookieAttributes: {
        sameSite: "none",
        secure: true,
        httpOnly: true,
      },
    },
    plugins: [expo(),
      emailOTP({
        async sendVerificationOTP({email, otp, type}) {
          if (type !== "sign-in") return;
          // not gonna handle anything else.
}
      })
    ],
  });
}

export const auth = createAuth();
