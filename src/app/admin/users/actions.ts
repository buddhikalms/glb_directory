"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import type { UserFormData, UserRole, UserRow } from "./types";

type UserWithBusiness = Prisma.UserGetPayload<{
  include: {
    business: {
      select: {
        name: true;
      };
    };
  };
}>;

function toNullable(value: string) {
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
}

function mapUserRow(item: UserWithBusiness): UserRow {
  return {
    id: item.id,
    email: item.email,
    name: item.name,
    role: item.role as UserRole,
    slug: item.slug || "",
    avatar: item.avatar || "",
    bio: item.bio || "",
    location: item.location || "",
    title: item.title || "",
    businessId: item.businessId || "",
    businessName: item.business?.name || "N/A",
  };
}

function normalizeInput(input: UserFormData) {
  if (!input.name.trim() || !input.email.trim() || !input.role) {
    throw new Error("Name, email, and role are required.");
  }

  return {
    email: input.email.trim(),
    name: input.name.trim(),
    role: input.role,
    slug: toNullable(input.slug),
    avatar: toNullable(input.avatar),
    bio: toNullable(input.bio),
    location: toNullable(input.location),
    title: toNullable(input.title),
    businessId: toNullable(input.businessId),
  };
}

function toActionError(error: unknown): Error {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") {
      return new Error("Email or slug already exists.");
    }
    if (error.code === "P2003") {
      return new Error("Selected business is invalid.");
    }
  }

  if (error instanceof Error) return error;
  return new Error("Unexpected error");
}

export async function createUserAction(input: UserFormData) {
  try {
    const data = normalizeInput(input);

    const created = await prisma.user.create({
      data: {
        id: crypto.randomUUID(),
        ...data,
      },
      include: {
        business: { select: { name: true } },
      },
    });

    revalidatePath("/admin/users");
    return mapUserRow(created);
  } catch (error) {
    throw toActionError(error);
  }
}

export async function updateUserAction(id: string, input: UserFormData) {
  try {
    const data = normalizeInput(input);

    const updated = await prisma.user.update({
      where: { id },
      data,
      include: {
        business: { select: { name: true } },
      },
    });

    revalidatePath("/admin/users");
    return mapUserRow(updated);
  } catch (error) {
    throw toActionError(error);
  }
}

export async function deleteUserAction(id: string) {
  try {
    await prisma.user.delete({ where: { id } });
    revalidatePath("/admin/users");
    return { ok: true };
  } catch (error) {
    throw toActionError(error);
  }
}

