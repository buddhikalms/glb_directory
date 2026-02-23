import { randomBytes, randomUUID } from "crypto";
import bcrypt from "bcryptjs";
import { UserRole } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { sendVerificationEmail } from "@/lib/auth-email";

const registerSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().transform((value) => value.toLowerCase()),
  password: z.string().min(8).max(128),
  username: z
    .string()
    .trim()
    .min(3)
    .max(40)
    .regex(/^[a-z0-9_-]+$/i)
    .optional()
    .or(z.literal("")),
  role: z.nativeEnum(UserRole).optional(),
});

const REGISTRATION_ALLOWED_ROLES = new Set<UserRole>([
  UserRole.guest,
  UserRole.business_owner,
  UserRole.subscriber,
]);

function getBaseUrl() {
  return (
    process.env.NEXTAUTH_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    "http://localhost:3000"
  );
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid registration data." },
        { status: 400 },
      );
    }

    const role =
      parsed.data.role && REGISTRATION_ALLOWED_ROLES.has(parsed.data.role)
        ? parsed.data.role
        : UserRole.guest;

    const existingUser = await prisma.user.findUnique({
      where: { email: parsed.data.email },
      select: {
        id: true,
        name: true,
        emailVerified: true,
      },
    });

    const passwordHash = await bcrypt.hash(parsed.data.password, 12);

    let userId = existingUser?.id ?? randomUUID();
    let name = parsed.data.name;
    if (existingUser) {
      name = existingUser.name || parsed.data.name;
      await prisma.user.update({
        where: { id: existingUser.id },
        data: {
          name,
          passwordHash,
          role,
          slug: parsed.data.username || null,
          emailVerified: null,
        },
      });
    } else {
      await prisma.user.create({
        data: {
          id: userId,
          email: parsed.data.email,
          name,
          role,
          slug: parsed.data.username || null,
          passwordHash,
          emailVerified: null,
        },
      });
    }

    const token = randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + 1000 * 60 * 60 * 24);

    await prisma.verificationToken.deleteMany({
      where: { identifier: parsed.data.email },
    });

    await prisma.verificationToken.create({
      data: {
        identifier: parsed.data.email,
        token,
        expires,
      },
    });

    const verificationUrl = `${getBaseUrl()}/api/auth/verify-email?token=${token}&email=${encodeURIComponent(parsed.data.email)}`;

    await sendVerificationEmail({
      to: parsed.data.email,
      name,
      verificationUrl,
    });

    return NextResponse.json({
      ok: true,
      message:
        "Registration successful. Please verify your email before logging in.",
    });
  } catch (error) {
    console.error("register_error", error);
    return NextResponse.json(
      { error: "Could not complete registration." },
      { status: 500 },
    );
  }
}
