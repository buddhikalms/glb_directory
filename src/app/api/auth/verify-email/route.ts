import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function getBaseUrl() {
  return (
    process.env.NEXTAUTH_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    "http://localhost:3000"
  );
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");
  const email = searchParams.get("email")?.toLowerCase();
  const baseUrl = getBaseUrl();

  if (!token || !email) {
    return NextResponse.redirect(
      new URL("/login?verified=invalid", baseUrl),
    );
  }

  const verification = await prisma.verificationToken.findUnique({
    where: { token },
  });

  if (
    !verification ||
    verification.identifier.toLowerCase() !== email ||
    verification.expires.getTime() < Date.now()
  ) {
    return NextResponse.redirect(
      new URL("/login?verified=invalid", baseUrl),
    );
  }

  await prisma.user.update({
    where: { email },
    data: { emailVerified: new Date() },
  });

  await prisma.verificationToken.delete({
    where: { token },
  });

  return NextResponse.redirect(new URL("/login?verified=success", baseUrl));
}
