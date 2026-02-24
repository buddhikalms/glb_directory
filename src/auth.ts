import { PrismaAdapter } from "@auth/prisma-adapter";
import { UserRole } from "@prisma/client";
import bcrypt from "bcryptjs";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { z } from "zod";
import {
  sendRegistrationAlertEmail,
  sendRegistrationWelcomeEmail,
} from "@/lib/auth-email";
import { prisma } from "@/lib/prisma";

const credentialsSchema = z.object({
  identifier: z.string().trim().min(3).max(191),
  password: z.string().min(8),
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  secret: process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET,
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: "database",
  },
  pages: {
    signIn: "/login",
  },
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
    Credentials({
      name: "Email and Password",
      credentials: {
        identifier: { label: "Email or Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const parsed = credentialsSchema.safeParse(credentials);
        if (!parsed.success) {
          return null;
        }

        const identifier = parsed.data.identifier.toLowerCase();

        const user = await prisma.user.findFirst({
          where: {
            OR: [{ email: identifier }, { slug: identifier }],
          },
        });

        if (!user?.passwordHash) {
          return null;
        }

        const validPassword = await bcrypt.compare(
          parsed.data.password,
          user.passwordHash,
        );
        if (!validPassword) {
          return null;
        }

        if (!user.emailVerified) {
          throw new Error("Please verify your email before logging in.");
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          businessId: user.businessId,
        };
      },
    }),
  ],
  callbacks: {
    async signIn({ account, user }) {
      if (account?.provider === "google" && user.email) {
        const dbUser = await prisma.user.findUnique({
          where: { email: user.email.toLowerCase() },
          select: {
            id: true,
            role: true,
            emailVerified: true,
          },
        });

        if (dbUser && !dbUser.emailVerified) {
          await prisma.user.update({
            where: { id: dbUser.id },
            data: {
              emailVerified: dbUser.emailVerified ?? new Date(),
              avatar: user.image || undefined,
            },
          });
        }
      }

      return true;
    },
    async session({ session, user }) {
      if (session.user) {
        session.user.id = user.id;
        session.user.role = (user.role as UserRole) || UserRole.guest;
        session.user.businessId = user.businessId ?? null;
      }
      return session;
    },
  },
  events: {
    async createUser({ user }) {
      if (!user.email) return;

      try {
        await sendRegistrationAlertEmail({
          name: user.name,
          email: user.email,
          role: (user as { role?: UserRole | null }).role ?? UserRole.guest,
          provider: "google",
        });
      } catch (error) {
        console.error("google_registration_alert_email_error", error);
      }

      try {
        await sendRegistrationWelcomeEmail({
          to: user.email,
          name: user.name,
        });
      } catch (error) {
        console.error("google_registration_welcome_email_error", error);
      }
    },
  },
});
